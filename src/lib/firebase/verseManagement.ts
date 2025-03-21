import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { BibleVerse } from '../types/bible';
import { FirebaseError } from 'firebase/app';
import { checkFirebasePermissions } from './permissions';
import { fetchVerses } from '@/lib/api/bibleApi';
import { VerseCommentary } from '@/lib/types/commentary';

interface VerseData {
  number: number | 'S';
  content: string;
  reference: string; // Make reference required
}

interface ChapterVerses {
  version: string;
  book: string;
  chapter: number;
  verses: VerseData[];
  timestamp: number;
}

interface BookMetadata {
  id: string;
  name: string;
  chapters: number[];
}

interface VersionMetadata {
  id: string;
  name: string;
  books: BookMetadata[];
  timestamp: number;
}

const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days for metadata
const VERSE_CACHE_EXPIRY = 60 * 60 * 1000; // 1 hour for verses

// Cache version metadata in memory
const versionMetadataCache = new Map<string, VersionMetadata>();

async function fetchVersionMetadataFromAPI(version: string): Promise<VersionMetadata> {
  // Get books list
  const booksPath = `/bibles/${version}/books`;
  const booksResponse = await fetch(`/api/bible?path=${encodeURIComponent(booksPath)}`);
  const booksData = await booksResponse.json();

  if (!booksResponse.ok || !booksData.data) {
    throw new Error('Failed to fetch books list');
  }

  // Get chapters for each book
  const books = await Promise.all(booksData.data.map(async (book: any) => {
    const chaptersPath = `/bibles/${version}/books/${book.id}/chapters`;
    const chaptersResponse = await fetch(`/api/bible?path=${encodeURIComponent(chaptersPath)}`);
    const chaptersData = await chaptersResponse.json();

    if (!chaptersResponse.ok || !chaptersData.data) {
      throw new Error(`Failed to fetch chapters for book ${book.id}`);
    }

    return {
      id: book.id,
      name: book.name,
      chapters: chaptersData.data.map((chapter: any) => parseInt(chapter.number))
    };
  }));

  return {
    id: version,
    name: version,
    books,
    timestamp: Date.now()
  };
}

async function fetchVersesFromAPI(version: string, book: string, chapter: number): Promise<VerseData[]> {
  // Step 1: Get list of verses
  const listPath = `/bibles/${version}/chapters/${book}.${chapter}/verses`;
  const listResponse = await fetch(`/api/bible?path=${encodeURIComponent(listPath)}`);
  const listData = await listResponse.json();

  if (!listResponse.ok || !listData.data) {
    throw new Error('Failed to fetch verse list');
  }

  // Step 2: Get content for each verse
  const versePromises = listData.data.map(async (verseMetadata: any) => {
    const versePath = `/bibles/${version}/verses/${verseMetadata.id}?content-type=text&include-notes=false&include-verse-numbers=false&include-chapter-numbers=false`;
    const verseResponse = await fetch(`/api/bible?path=${encodeURIComponent(versePath)}`);
    const verseData = await verseResponse.json();

    if (!verseResponse.ok || !verseData.data) {
      throw new Error(`Failed to fetch verse content for ${verseMetadata.id}`);
    }

    return {
      number: parseInt(verseMetadata.id.split('.')[2]),
      content: verseData.data.content,
      reference: verseMetadata.reference || `${book}.${chapter}.${verseMetadata.id.split('.')[2]}`
    };
  });

  const verses = await Promise.all(versePromises);
  
  // Filter out any existing summary verses
  return verses.filter(verse => verse.number !== 'S');
}

export async function getVersionMetadata(version: string): Promise<VersionMetadata | null> {
  // Check memory cache first
  const cachedMetadata = versionMetadataCache.get(version);
  if (cachedMetadata && Date.now() - cachedMetadata.timestamp < CACHE_EXPIRY) {
    return cachedMetadata;
  }

  try {
    if (await checkFirebasePermissions()) {
      // Try to get from Firebase
      const docRef = doc(db, 'versions', version);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data() as VersionMetadata;
        if (Date.now() - data.timestamp < CACHE_EXPIRY) {
          versionMetadataCache.set(version, data);
          return data;
        }
      }
    }

    // If not in Firebase or expired, fetch from API
    const metadata = await fetchVersionMetadataFromAPI(version);
    
    // Cache in Firebase if we have permissions
    if (await checkFirebasePermissions()) {
      try {
        await setDoc(doc(db, 'versions', version), metadata);
      } catch (error) {
        console.warn('Failed to cache version metadata:', error);
      }
    }

    // Cache in memory
    versionMetadataCache.set(version, metadata);
    return metadata;
  } catch (error) {
    console.error('Error getting version metadata:', error);
    return null;
  }
}

export async function getVerses(version: string, book: string, chapter: number): Promise<VerseData[]> {
  try {
    const docRef = doc(db, 'verses', `${version}_${book}_${chapter}`);

    if (await checkFirebasePermissions()) {
      // Try to get from Firebase first
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data() as ChapterVerses;
        
        // Check if cache is still valid
        if (Date.now() - data.timestamp < VERSE_CACHE_EXPIRY) {
          console.log('Using cached verses');
          // Filter out duplicate summary verses from cache
          const filteredVerses = data.verses.filter((verse, index, array) => {
            if (verse.number === 'S') {
              // Keep only the first summary verse
              return array.findIndex(v => v.number === 'S') === index;
            }
            return true;
          });
          return filteredVerses;
        }
      }
    }
    
    // If not in Firebase or expired, fetch from API
    console.log('Fetching verses from API');
    const verses = await fetchVerses(version, `${book}.${chapter}`);
    
    // Transform the verses into the expected format
    const transformedVerses: VerseData[] = [];

    // Add regular verses first
    for (const verse of verses) {
      if (verse && typeof verse === 'object' && 'id' in verse) {
        const verseContent = 'text' in verse && typeof verse.text === 'string' 
          ? verse.text 
          : 'content' in verse && typeof verse.content === 'string'
          ? verse.content
          : '';

        transformedVerses.push({
          number: parseInt(verse.id.split('.')[2]),
          content: verseContent,
          reference: verse.reference
        });
      }
    }

    // Add summary verse only if it doesn't already exist
    const hasSummaryVerse = transformedVerses.some(verse => verse.number === 'S');
    if (!hasSummaryVerse) {
      transformedVerses.unshift({
        number: 'S' as const,
        content: 'Summary text summary text summary text summary text',
        reference: `${book.toUpperCase()}.${chapter}.S`
      });
    }

    // Cache in Firebase if we have permissions
    if (await checkFirebasePermissions()) {
      try {
        await setDoc(docRef, {
          version,
          book,
          chapter,
          verses: transformedVerses,
          timestamp: Date.now()
        } as ChapterVerses);
      } catch (error) {
        console.warn('Failed to cache verses:', error);
      }
    }

    return transformedVerses;
  } catch (error) {
    console.error('Error getting verses:', error);
    throw error;
  }
}

export async function getVerseCommentary(reference: string): Promise<VerseCommentary | null> {
  console.log('Checking commentary for reference:', reference);
  
  try {
    const docRef = doc(db, 'commentary', reference);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data() as VerseCommentary;
      const hasContent = data.currentContent && data.currentContent.trim() !== '';
      console.log('Found commentary:', { reference, hasContent });
      return data;
    } else {
      console.log('No commentary found for reference:', reference);
      return null;
    }
  } catch (error) {
    if (error instanceof FirebaseError && error.code === 'permission-denied') {
      // If it's a permission error, assume commentary exists
      // This is because we can still access it when clicking
      console.log('Permission denied, assuming commentary exists for:', reference);
      return {
        id: reference,
        currentContent: 'Loading...',
        contributors: [],
        edits: [],
        debate: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        lastEditId: ''
      };
    }
    console.warn('Error getting verse commentary:', error);
    return null;
  }
} 
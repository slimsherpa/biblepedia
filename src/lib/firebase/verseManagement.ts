import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { BibleVerse } from '../types/bible';
import { FirebaseError } from 'firebase/app';

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
const VERSE_CACHE_EXPIRY = 30 * 24 * 60 * 60 * 1000; // 30 days for verses

// Cache version metadata in memory
const versionMetadataCache = new Map<string, VersionMetadata>();

// Track if we have Firebase permissions
let hasFirebasePermissions: boolean | null = null;

async function checkFirebasePermissions(): Promise<boolean> {
  if (hasFirebasePermissions !== null) {
    return hasFirebasePermissions;
  }

  try {
    // Try to read a test document
    const testRef = doc(db, '_test_permissions', 'test');
    await getDoc(testRef);
    hasFirebasePermissions = true;
    return true;
  } catch (error) {
    if (error instanceof FirebaseError) {
      console.warn('Firebase permissions not available:', error.message);
      hasFirebasePermissions = false;
    }
    return false;
  }
}

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
  
  // Filter out any existing summary verses first
  const filteredVerses = verses.filter(verse => verse.number !== 'S');
  
  // Add single summary verse at the start
  return [
    { 
      number: 'S' as const, 
      content: 'Summary text summary text summary text summary text',
      reference: `${book}.${chapter}.S`
    },
    ...filteredVerses
  ];
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
    if (await checkFirebasePermissions()) {
      // Try to get from Firebase first
      const docRef = doc(db, 'verses', `${version}_${book}_${chapter}`);
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
    const verses = await fetchVersesFromAPI(version, book, chapter);
    
    // Cache in Firebase if we have permissions
    if (await checkFirebasePermissions()) {
      try {
        const chapterVerses: ChapterVerses = {
          version,
          book,
          chapter,
          verses,
          timestamp: Date.now()
        };
        
        await setDoc(doc(db, 'verses', `${version}_${book}_${chapter}`), chapterVerses);
        console.log('Successfully cached verses');
      } catch (cacheError) {
        console.warn('Failed to cache verses:', cacheError);
      }
    }
    
    return verses;
  } catch (error) {
    console.error('Error in getVerses:', error);
    throw error;
  }
}

export async function getVerseCommentary(reference: string): Promise<string | null> {
  if (await checkFirebasePermissions()) {
    try {
      const docRef = doc(db, 'commentary', reference);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data().content;
      }
    } catch (error) {
      console.warn('Error getting verse commentary:', error);
    }
  }
  
  return null;
} 
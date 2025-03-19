import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { BibleVerse } from '../types/bible';
import { FirebaseError } from 'firebase/app';

interface VerseData {
  number: number | 'S';
  content: string;
  reference?: string;
}

interface ChapterVerses {
  version: string;
  book: string;
  chapter: number;
  verses: VerseData[];
  timestamp: number;
}

const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

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
      reference: verseMetadata.reference
    };
  });

  const verses = await Promise.all(versePromises);
  
  // Add summary verse at the start
  return [
    { number: 'S' as const, content: 'Summary text summary text summary text summary text' },
    ...verses
  ];
}

export async function getVerses(version: string, book: string, chapter: number): Promise<VerseData[]> {
  try {
    // Try Firebase cache first
    try {
      const docRef = doc(db, 'verses', `${version}_${book}_${chapter}`);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data() as ChapterVerses;
        
        // Check if cache is still valid
        if (Date.now() - data.timestamp < CACHE_EXPIRY) {
          console.log('Using cached verses');
          return data.verses;
        }
      }
    } catch (error) {
      // If Firebase error, log it but continue to API fallback
      if (error instanceof FirebaseError) {
        console.warn('Firebase error, falling back to API:', error.message);
      }
    }
    
    // If not in cache, expired, or Firebase error, fetch from API
    console.log('Fetching verses from API');
    const verses = await fetchVersesFromAPI(version, book, chapter);
    
    // Try to cache the verses, but don't block on it
    try {
      const chapterVerses: ChapterVerses = {
        version,
        book,
        chapter,
        verses,
        timestamp: Date.now()
      };
      
      const docRef = doc(db, 'verses', `${version}_${book}_${chapter}`);
      await setDoc(docRef, chapterVerses);
      console.log('Successfully cached verses');
    } catch (cacheError) {
      // If caching fails, just log it and continue
      console.warn('Failed to cache verses:', cacheError);
    }
    
    return verses;
  } catch (error) {
    console.error('Error in getVerses:', error);
    throw error;
  }
}

export async function getVerseCommentary(reference: string): Promise<string | null> {
  try {
    const docRef = doc(db, 'commentary', reference);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data().content;
    }
    
    return null;
  } catch (error) {
    console.warn('Error getting verse commentary:', error);
    return null;
  }
} 
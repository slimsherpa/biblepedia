import { db } from './firebase';
import { collection, doc, getDoc, setDoc } from 'firebase/firestore';
import { fetchVerses } from '../api/bibleApi';

const VERSES_COLLECTION = 'verses';

export interface CachedVerse {
  number: number;
  content: string;
  version: string;
  bookId: string;
  chapter: number;
  lastUpdated: number;
}

export interface ChapterVerses {
  version: string;
  bookId: string;
  chapter: number;
  verses: CachedVerse[];
  lastUpdated: number;
}

/**
 * Generates a unique document ID for a chapter's verses
 */
function getChapterDocId(version: string, bookId: string, chapter: number): string {
  return `${version}_${bookId}_${chapter}`;
}

/**
 * Retrieves verses from cache if available, otherwise fetches from API and caches
 */
export async function getVerses(version: string, bookId: string, chapter: number): Promise<CachedVerse[]> {
  try {
    // Try to get from cache first
    const docRef = doc(db, VERSES_COLLECTION, getChapterDocId(version, bookId, chapter));
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data() as ChapterVerses;
      
      // Check if cache is older than 7 days
      const cacheAge = Date.now() - data.lastUpdated;
      const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
      
      if (cacheAge < CACHE_TTL) {
        console.log('Serving verses from cache');
        return data.verses;
      }
    }

    // If not in cache or cache is old, fetch from API
    console.log('Fetching verses from API');
    const verses = await fetchVerses(version, bookId, chapter);
    
    // Transform API response to our cache format
    const cachedVerses: CachedVerse[] = verses.map(verse => ({
      number: verse.number,
      content: verse.text,
      version,
      bookId,
      chapter,
      lastUpdated: Date.now()
    }));

    // Cache the verses
    const chapterData: ChapterVerses = {
      version,
      bookId,
      chapter,
      verses: cachedVerses,
      lastUpdated: Date.now()
    };

    await setDoc(docRef, chapterData);
    
    return cachedVerses;
  } catch (error) {
    console.error('Error getting verses:', error);
    throw error;
  }
}

/**
 * Force updates the cache for a specific chapter
 */
export async function refreshVerseCache(version: string, bookId: string, chapter: number): Promise<CachedVerse[]> {
  try {
    const verses = await fetchVerses(version, bookId, chapter);
    
    const cachedVerses: CachedVerse[] = verses.map(verse => ({
      number: verse.number,
      content: verse.text,
      version,
      bookId,
      chapter,
      lastUpdated: Date.now()
    }));

    const chapterData: ChapterVerses = {
      version,
      bookId,
      chapter,
      verses: cachedVerses,
      lastUpdated: Date.now()
    };

    const docRef = doc(db, VERSES_COLLECTION, getChapterDocId(version, bookId, chapter));
    await setDoc(docRef, chapterData);
    
    return cachedVerses;
  } catch (error) {
    console.error('Error refreshing verse cache:', error);
    throw error;
  }
} 
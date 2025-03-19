import { getFirestore, doc, getDoc, setDoc, collection } from 'firebase/firestore';
import { Book, Chapter, Verse } from './bibleApi';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  version: string;
}

const CACHE_VERSION = '1.0';
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

/**
 * Creates a cache key from the path components
 */
function createCacheKey(type: string, ...components: string[]): string {
  return components.join('-');
}

/**
 * Creates a Firestore document path for a cache entry
 */
function createFirestorePath(type: string, key: string): string {
  return `${type}s/${key}`; // e.g. "books/nrsv-genesis"
}

/**
 * Check if localStorage is available
 */
function isLocalStorageAvailable() {
  try {
    const test = '__test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Get data from localStorage
 */
function getFromLocalStorage<T>(key: string): CacheEntry<T> | null {
  if (!isLocalStorageAvailable()) return null;
  
  try {
    const item = localStorage.getItem(key);
    if (!item) return null;
    
    const cacheEntry = JSON.parse(item) as CacheEntry<T>;
    if (!cacheEntry || !cacheEntry.timestamp || !cacheEntry.version) return null;
    
    // Check if cache is valid
    if (cacheEntry.version !== CACHE_VERSION || 
        Date.now() - cacheEntry.timestamp > CACHE_TTL) {
      localStorage.removeItem(key);
      return null;
    }
    
    return cacheEntry;
  } catch (e) {
    console.warn('Error reading from localStorage:', e);
    return null;
  }
}

/**
 * Save data to localStorage
 */
function saveToLocalStorage<T>(key: string, data: T) {
  if (!isLocalStorageAvailable()) return;
  
  try {
    const cacheEntry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      version: CACHE_VERSION
    };
    localStorage.setItem(key, JSON.stringify(cacheEntry));
  } catch (e) {
    console.warn('Error writing to localStorage:', e);
  }
}

/**
 * Save data to Firestore in the background
 */
async function saveToFirestore<T>(type: string, key: string, data: T) {
  try {
    const db = getFirestore();
    const cacheRef = doc(db, 'bible-cache', createFirestorePath(type, key));
    
    const cacheEntry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      version: CACHE_VERSION
    };

    console.log('Saving to Firestore:', {
      type,
      key,
      path: createFirestorePath(type, key)
    });

    await setDoc(cacheRef, cacheEntry, { merge: true });
  } catch (e) {
    console.warn('Error writing to Firestore:', {
      type,
      key,
      error: e instanceof Error ? e.message : 'Unknown error'
    });
  }
}

/**
 * Generic function to fetch data with caching
 */
async function fetchWithCache<T>(
  type: string,
  key: string,
  fetchFn: () => Promise<T>
): Promise<T> {
  try {
    // Try to fetch fresh data first
    console.log('Fetching fresh data:', { type, key });
    const freshData = await fetchFn();
    
    // Save to Firestore in the background
    saveToFirestore(type, key, freshData).catch(error => {
      console.warn('Background Firestore sync failed:', error);
    });
    
    return freshData;
  } catch (error) {
    console.error('Data fetch failed:', error);
    throw error;
  }
}

/**
 * Cache books for a specific Bible version
 */
export async function cacheBooks(
  version: string,
  fetchFn: () => Promise<Book[]>
): Promise<Book[]> {
  return fetchWithCache<Book[]>(
    'book',
    version,
    fetchFn
  );
}

/**
 * Cache chapters for a specific book
 */
export async function cacheChapters(
  version: string,
  book: string,
  fetchFn: () => Promise<Chapter[]>
): Promise<Chapter[]> {
  return fetchWithCache<Chapter[]>(
    'chapter',
    `${version}-${book}`,
    fetchFn
  );
}

/**
 * Cache verses for a specific chapter
 */
export async function cacheVerses(
  version: string,
  book: string,
  chapter: string,
  fetchFn: () => Promise<Verse[]>
): Promise<Verse[]> {
  return fetchWithCache<Verse[]>(
    'verse',
    `${version}-${book}-${chapter}`,
    fetchFn
  );
}

/**
 * Cache a specific verse
 */
export async function cacheVerse(
  version: string,
  book: string,
  chapter: string,
  verse: string,
  fetchFn: () => Promise<Verse>
): Promise<Verse> {
  return fetchWithCache<Verse>(
    'verse',
    `${version}-${book}-${chapter}-${verse}`,
    fetchFn
  );
} 
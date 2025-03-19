import { CacheEntry } from '../types/bible';
import { db } from '../firebase/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

class BibleCache {
  private memoryCache = new Map<string, CacheEntry<any>>();
  private readonly DEFAULT_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours
  private readonly CACHE_PREFIX = 'bible_cache_';

  constructor(private useFirebase: boolean = false) {}

  private getLocalStorageKey(key: string): string {
    return `${this.CACHE_PREFIX}${key}`;
  }

  private getFirestoreKey(key: string): string {
    return key.replace(/[/\\?%*:|"<>]/g, '_');
  }

  async set<T>(key: string, data: T, expiresIn: number = this.DEFAULT_EXPIRY): Promise<void> {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiresIn
    };

    // Always set in memory cache
    this.memoryCache.set(key, entry);

    // Set in localStorage
    try {
      localStorage.setItem(
        this.getLocalStorageKey(key),
        JSON.stringify(entry)
      );
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }

    // Set in Firebase if enabled
    if (this.useFirebase) {
      try {
        const cacheRef = doc(db, 'bibleCache', this.getFirestoreKey(key));
        await setDoc(cacheRef, entry);
      } catch (error) {
        console.warn('Failed to save to Firebase:', error);
      }
    }
  }

  async get<T>(key: string): Promise<T | null> {
    // Check memory cache first
    const memoryEntry = this.memoryCache.get(key);
    if (memoryEntry && !this.isExpired(memoryEntry)) {
      return memoryEntry.data as T;
    }

    // Check localStorage
    try {
      const localData = localStorage.getItem(this.getLocalStorageKey(key));
      if (localData) {
        const entry = JSON.parse(localData) as CacheEntry<T>;
        if (!this.isExpired(entry)) {
          this.memoryCache.set(key, entry);
          return entry.data;
        }
      }
    } catch (error) {
      console.warn('Failed to read from localStorage:', error);
    }

    // Check Firebase if enabled
    if (this.useFirebase) {
      try {
        const cacheRef = doc(db, 'bibleCache', this.getFirestoreKey(key));
        const snapshot = await getDoc(cacheRef);
        if (snapshot.exists()) {
          const entry = snapshot.data() as CacheEntry<T>;
          if (!this.isExpired(entry)) {
            this.memoryCache.set(key, entry);
            return entry.data;
          }
        }
      } catch (error) {
        console.warn('Failed to read from Firebase:', error);
      }
    }

    return null;
  }

  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp > entry.expiresIn;
  }

  async clear(): Promise<void> {
    // Clear memory cache
    this.memoryCache.clear();

    // Clear localStorage
    try {
      const keys = Object.keys(localStorage);
      for (const key of keys) {
        if (key.startsWith(this.CACHE_PREFIX)) {
          localStorage.removeItem(key);
        }
      }
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
    }

    // Firebase cache clearing would need to be done through admin SDK or cloud functions
  }
}

// Export a singleton instance
export const bibleCache = new BibleCache(); 
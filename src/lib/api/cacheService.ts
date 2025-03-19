import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { CACHE_CONFIG } from './bibleConfig';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class CacheService {
  private memoryCache: Map<string, CacheEntry<any>>;
  private db: ReturnType<typeof getFirestore>;

  constructor() {
    this.memoryCache = new Map();
    this.db = getFirestore();
  }

  private getMemoryKey(key: string): string {
    return `${CACHE_CONFIG.prefix.memory}${key}`;
  }

  private getLocalKey(key: string): string {
    return `${CACHE_CONFIG.prefix.local}${key}`;
  }

  private getFirestoreKey(key: string): string {
    return key.replace(/[/]/g, '-');
  }

  private isExpired(timestamp: number): boolean {
    return Date.now() - timestamp > CACHE_CONFIG.ttl;
  }

  // Memory Cache Operations
  private getFromMemory<T>(key: string): T | null {
    const memKey = this.getMemoryKey(key);
    const entry = this.memoryCache.get(memKey);
    
    if (!entry || this.isExpired(entry.timestamp)) {
      return null;
    }
    
    return entry.data;
  }

  private setInMemory<T>(key: string, data: T): void {
    const memKey = this.getMemoryKey(key);
    this.memoryCache.set(memKey, {
      data,
      timestamp: Date.now()
    });
  }

  // LocalStorage Operations
  private getFromLocal<T>(key: string): T | null {
    try {
      const localKey = this.getLocalKey(key);
      const item = localStorage.getItem(localKey);
      
      if (!item) {
        return null;
      }
      
      const entry: CacheEntry<T> = JSON.parse(item);
      
      if (this.isExpired(entry.timestamp)) {
        localStorage.removeItem(localKey);
        return null;
      }
      
      return entry.data;
    } catch (error) {
      console.warn('Error reading from localStorage:', error);
      return null;
    }
  }

  private setInLocal<T>(key: string, data: T): void {
    try {
      const localKey = this.getLocalKey(key);
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now()
      };
      
      localStorage.setItem(localKey, JSON.stringify(entry));
    } catch (error) {
      console.warn('Error writing to localStorage:', error);
    }
  }

  // Firestore Operations
  private async getFromFirestore<T>(key: string): Promise<T | null> {
    try {
      const firestoreKey = this.getFirestoreKey(key);
      const docRef = doc(this.db, CACHE_CONFIG.prefix.firestore, firestoreKey);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }
      
      const entry = docSnap.data() as CacheEntry<T>;
      
      if (this.isExpired(entry.timestamp)) {
        return null;
      }
      
      return entry.data;
    } catch (error) {
      console.warn('Error reading from Firestore:', error);
      return null;
    }
  }

  private async setInFirestore<T>(key: string, data: T): Promise<void> {
    try {
      const firestoreKey = this.getFirestoreKey(key);
      const docRef = doc(this.db, CACHE_CONFIG.prefix.firestore, firestoreKey);
      
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now()
      };
      
      await setDoc(docRef, entry);
    } catch (error) {
      console.warn('Error writing to Firestore:', error);
    }
  }

  // Public API
  async get<T>(key: string, options: { useFirestore?: boolean } = {}): Promise<T | null> {
    // Try memory first
    const memoryData = this.getFromMemory<T>(key);
    if (memoryData) {
      return memoryData;
    }
    
    // Try localStorage
    const localData = this.getFromLocal<T>(key);
    if (localData) {
      // Cache in memory for faster subsequent access
      this.setInMemory(key, localData);
      return localData;
    }
    
    // Try Firestore if enabled
    if (options.useFirestore) {
      const firestoreData = await this.getFromFirestore<T>(key);
      if (firestoreData) {
        // Cache in memory and localStorage
        this.setInMemory(key, firestoreData);
        this.setInLocal(key, firestoreData);
        return firestoreData;
      }
    }
    
    return null;
  }

  async set<T>(key: string, data: T, options: { useFirestore?: boolean } = {}): Promise<void> {
    // Always cache in memory
    this.setInMemory(key, data);
    
    // Cache in localStorage
    this.setInLocal(key, data);
    
    // Cache in Firestore if enabled
    if (options.useFirestore) {
      await this.setInFirestore(key, data);
    }
  }

  // Clear all caches
  async clear(): Promise<void> {
    // Clear memory cache
    this.memoryCache.clear();
    
    // Clear localStorage (only our keys)
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(CACHE_CONFIG.prefix.local)) {
        localStorage.removeItem(key);
      }
    }
    
    // Note: We don't clear Firestore cache as it might be shared
  }
}

// Export a singleton instance
export const cacheService = new CacheService(); 
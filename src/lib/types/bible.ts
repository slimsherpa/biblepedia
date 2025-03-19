export interface BibleVerse {
  id: string;
  orgId: string;
  bookId: string;
  chapterId: string;
  bibleId: string;
  reference: string;
  text: string;
  number: string;
}

export interface BibleChapter {
  id: string;
  bibleId: string;
  bookId: string;
  number: string;
  reference: string;
}

export interface BibleBook {
  id: string;
  bibleId: string;
  abbreviation: string;
  name: string;
  nameLong: string;
}

export interface BibleVersion {
  id: string;
  name: string;
  abbreviation?: string;
  description?: string;
  language?: string;
}

// Cache types
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresIn: number;
}

// API Response types
export interface APIResponse<T> {
  data: T;
  meta: {
    fumsId: string;
    [key: string]: any;
  };
} 
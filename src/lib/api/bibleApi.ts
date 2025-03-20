/**
 * Bible API Service
 * Provides functions to interact with the Bible API
 * Based on https://github.com/wldeh/bible-api
 */

// Define supported Bible versions
export const BIBLE_VERSIONS: BibleVersion[] = [
  { 
    id: '9879dbb7cfe39e4d-01', 
    name: 'New Revised Standard Version', 
    abbreviation: 'NRSV',
    language: 'en',
    isSupported: true
  },
  { 
    id: 'de4e12af7f28f599-01', 
    name: 'King James Version', 
    abbreviation: 'KJV',
    language: 'en',
    isSupported: true
  },
  {
    id: '0b262f1ed7f084a6-01',
    name: 'Hebrew Bible',
    abbreviation: 'WLC',
    language: 'heb',
    isSupported: true
  },
  {
    id: '7644de2e4c5188e5-01',
    name: 'Text-Critical Greek New Testament',
    abbreviation: 'GNT',
    language: 'grc',
    isSupported: true
  },
  {
    id: 'c114c33098c4fef1-01',
    name: 'Brenton Greek Septuagint',
    abbreviation: 'LXX',
    language: 'grc',
    isSupported: true
  }
];

// Default version to use
export const DEFAULT_VERSION = BIBLE_VERSIONS[0].id;

// Types
export interface BibleVersion {
  id: string;
  name: string;
  abbreviation: string;
  language: string;
  isSupported: boolean;
}

export interface Book {
  id: string;
  name: string;
  bibleId: string;
}

export interface Chapter {
  id: string;
  number: string;
  bookId: string;
  bibleId: string;
}

export interface Verse {
  id: string;
  orgId: string;
  bibleId: string;
  bookId: string;
  chapterId: string;
  content: string;
  reference: string;
  verseCount: number;
  copyright: string;
}

const API_KEY = process.env.NEXT_PUBLIC_BIBLE_API_KEY || process.env.BIBLE_API_KEY;
const BASE_URL = 'https://api.scripture.api.bible/v1';

async function fetchFromBibleApi(path: string) {
  if (!API_KEY) {
    console.error('Environment variables:', {
      NEXT_PUBLIC_BIBLE_API_KEY: process.env.NEXT_PUBLIC_BIBLE_API_KEY,
      BIBLE_API_KEY: process.env.BIBLE_API_KEY,
      NODE_ENV: process.env.NODE_ENV
    });
    throw new Error('Bible API key not found. Please check environment variables.');
  }

  try {
    const fullUrl = `${BASE_URL}/${path}`;
    console.log('Fetching from Bible API:', { url: fullUrl });
    
    const response = await fetch(fullUrl, {
      headers: {
        'api-key': API_KEY,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Bible API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Bible API fetch error:', error);
    throw error;
  }
}

/**
 * Fetches all available Bible versions
 */
export async function fetchBibleVersions(): Promise<BibleVersion[]> {
  // Only return our supported versions
  return BIBLE_VERSIONS.filter(v => v.isSupported);
}

/**
 * Fetches all books for a specific Bible version
 */
export async function fetchBooks(version: string): Promise<Book[]> {
  return fetchFromBibleApi(`bibles/${version}/books`);
}

/**
 * Fetches all chapters for a specific book
 */
export async function fetchChapters(version: string, bookId: string): Promise<Chapter[]> {
  return fetchFromBibleApi(`bibles/${version}/books/${bookId}/chapters`);
}

/**
 * Fetches all verses for a specific chapter
 */
export async function fetchVerses(version: string, chapterId: string): Promise<Verse[]> {
  const data = await fetchFromBibleApi(`bibles/${version}/chapters/${chapterId}/verses`);
  
  // Fetch the actual content for each verse
  const versesWithContent = await Promise.all(
    data.map(async (verse: any) => {
      try {
        const verseContent = await fetchFromBibleApi(`bibles/${version}/verses/${verse.id}?content-type=text&include-notes=false&include-titles=false&include-chapter-numbers=false&include-verse-numbers=true&include-verse-spans=false`);
        return {
          ...verse,
          content: verseContent.content
        };
      } catch (error) {
        console.error(`Error fetching verse content for ${verse.id}:`, error);
        return {
          ...verse,
          content: 'Error loading verse content'
        };
      }
    })
  );

  return versesWithContent;
}

/**
 * Fetches a specific verse
 */
export async function fetchVerse(version: string, verseId: string): Promise<Verse> {
  return fetchFromBibleApi(`bibles/${version}/verses/${verseId}?content-type=text&include-notes=false&include-titles=false&include-chapter-numbers=false&include-verse-numbers=true&include-verse-spans=false`);
} 
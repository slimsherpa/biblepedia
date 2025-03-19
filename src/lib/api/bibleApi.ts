/**
 * Bible API Service
 * Provides functions to interact with the Bible API
 * Based on https://github.com/wldeh/bible-api
 */

import { BIBLE_VERSION, getApiBookId, getApiChapterId, getApiVerseId } from './bibleConfig';
import { cacheService } from './cacheService';

interface BibleApiError {
  statusCode: number;
  message: string;
}

interface BibleApiResponse<T> {
  data: T | null;
  error: BibleApiError | null;
}

// API Response Types
interface Book {
  id: string;
  name: string;
  nameLong: string;
  abbreviation: string;
}

interface Chapter {
  id: string;
  number: string;
  bookId: string;
  reference: string;
}

interface Verse {
  id: string;
  orgId: string;
  bookId: string;
  chapterId: string;
  reference: string;
  text: string;
}

// Helper function to check if running in browser
const isBrowser = typeof window !== 'undefined';

// Helper function to make API requests
async function makeApiRequest<T>(endpoint: string): Promise<BibleApiResponse<T>> {
  try {
    const response = await fetch(`/api/bible/${endpoint}`);
    
    if (!response.ok) {
      return {
        data: null,
        error: {
          statusCode: response.status,
          message: `API request failed: ${response.statusText}`
        }
      };
    }

    const data = await response.json();
    return { data, error: null };
  } catch (error) {
    console.error('API request error:', error);
    return {
      data: null,
      error: {
        statusCode: 500,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    };
  }
}

// API Functions
export async function getBooks(): Promise<BibleApiResponse<Book[]>> {
  const cacheKey = `books/${BIBLE_VERSION}`;
  
  // Try cache first
  const cachedData = await cacheService.get<Book[]>(cacheKey, { useFirestore: true });
  if (cachedData) {
    return { data: cachedData, error: null };
  }
  
  // Make API request
  const response = await makeApiRequest<Book[]>(`bibles/${BIBLE_VERSION}/books`);
  
  // Cache successful response
  if (response.data) {
    await cacheService.set(cacheKey, response.data, { useFirestore: true });
  }
  
  return response;
}

export async function getChapters(bookName: string): Promise<BibleApiResponse<Chapter[]>> {
  const bookId = getApiBookId(bookName);
  if (!bookId) {
    return {
      data: null,
      error: { statusCode: 400, message: `Invalid book name: ${bookName}` }
    };
  }
  
  const cacheKey = `chapters/${BIBLE_VERSION}/${bookId}`;
  
  // Try cache first
  const cachedData = await cacheService.get<Chapter[]>(cacheKey, { useFirestore: true });
  if (cachedData) {
    return { data: cachedData, error: null };
  }
  
  // Make API request
  const response = await makeApiRequest<Chapter[]>(
    `bibles/${BIBLE_VERSION}/books/${bookId}/chapters`
  );
  
  // Cache successful response
  if (response.data) {
    await cacheService.set(cacheKey, response.data, { useFirestore: true });
  }
  
  return response;
}

export async function getVerses(bookName: string, chapter: number): Promise<BibleApiResponse<Verse[]>> {
  const bookId = getApiBookId(bookName);
  if (!bookId) {
    return {
      data: null,
      error: { statusCode: 400, message: `Invalid book name: ${bookName}` }
    };
  }
  
  const chapterId = getApiChapterId(bookId, chapter);
  const cacheKey = `verses/${BIBLE_VERSION}/${chapterId}`;
  
  // Try cache first
  const cachedData = await cacheService.get<Verse[]>(cacheKey, { useFirestore: true });
  if (cachedData) {
    return { data: cachedData, error: null };
  }
  
  // Make API request
  const response = await makeApiRequest<Verse[]>(
    `bibles/${BIBLE_VERSION}/chapters/${chapterId}/verses`
  );
  
  // Cache successful response
  if (response.data) {
    await cacheService.set(cacheKey, response.data, { useFirestore: true });
  }
  
  return response;
}

export async function getVerse(
  bookName: string,
  chapter: number,
  verse: number
): Promise<BibleApiResponse<Verse>> {
  const bookId = getApiBookId(bookName);
  if (!bookId) {
    return {
      data: null,
      error: { statusCode: 400, message: `Invalid book name: ${bookName}` }
    };
  }
  
  const verseId = getApiVerseId(bookId, chapter, verse);
  const cacheKey = `verse/${BIBLE_VERSION}/${verseId}`;
  
  // Try cache first
  const cachedData = await cacheService.get<Verse>(cacheKey, { useFirestore: true });
  if (cachedData) {
    return { data: cachedData, error: null };
  }
  
  // Make API request
  const response = await makeApiRequest<Verse>(
    `bibles/${BIBLE_VERSION}/verses/${verseId}`
  );
  
  // Cache successful response
  if (response.data) {
    await cacheService.set(cacheKey, response.data, { useFirestore: true });
  }
  
  return response;
}

// Export version for components that need it
export const bibleVersion = BIBLE_VERSION; 
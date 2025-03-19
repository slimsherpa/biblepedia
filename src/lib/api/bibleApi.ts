/**
 * Bible API Service
 * Provides functions to interact with the Bible API
 * Based on https://github.com/wldeh/bible-api
 */

import { cacheBooks, cacheChapters, cacheVerses, cacheVerse } from './bibleCache';

// Cache for API responses to improve performance
const apiCache = new Map<string, any>();

// API configuration
const BASE_URL = (() => {
  // In production (Firebase hosting), use the Firebase Functions URL
  if (typeof window !== 'undefined' && 
      (window.location.hostname.includes('web.app') || 
       window.location.hostname.includes('firebaseapp.com'))) {
    return 'https://bibleapi-d3bzjj5vnq-uc.a.run.app';
  }
  // In development or other environments, use the local API
  return '/api/bible';
})();

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
  abbreviation?: string;
}

export interface Chapter {
  id?: string;
  number: number;
}

export interface Verse {
  number: number;
  text: string;
}

// Mock data for books
const BIBLE_BOOKS: Book[] = [
  // Old Testament
  { id: 'genesis', name: 'Genesis' },
  { id: 'exodus', name: 'Exodus' },
  { id: 'leviticus', name: 'Leviticus' },
  { id: 'numbers', name: 'Numbers' },
  { id: 'deuteronomy', name: 'Deuteronomy' },
  { id: 'joshua', name: 'Joshua' },
  { id: 'judges', name: 'Judges' },
  { id: 'ruth', name: 'Ruth' },
  { id: '1samuel', name: '1 Samuel' },
  { id: '2samuel', name: '2 Samuel' },
  { id: '1kings', name: '1 Kings' },
  { id: '2kings', name: '2 Kings' },
  { id: '1chronicles', name: '1 Chronicles' },
  { id: '2chronicles', name: '2 Chronicles' },
  { id: 'ezra', name: 'Ezra' },
  { id: 'nehemiah', name: 'Nehemiah' },
  { id: 'esther', name: 'Esther' },
  { id: 'job', name: 'Job' },
  { id: 'psalms', name: 'Psalms' },
  { id: 'proverbs', name: 'Proverbs' },
  { id: 'ecclesiastes', name: 'Ecclesiastes' },
  { id: 'songofsolomon', name: 'Song of Solomon' },
  { id: 'isaiah', name: 'Isaiah' },
  { id: 'jeremiah', name: 'Jeremiah' },
  { id: 'lamentations', name: 'Lamentations' },
  { id: 'ezekiel', name: 'Ezekiel' },
  { id: 'daniel', name: 'Daniel' },
  { id: 'hosea', name: 'Hosea' },
  { id: 'joel', name: 'Joel' },
  { id: 'amos', name: 'Amos' },
  { id: 'obadiah', name: 'Obadiah' },
  { id: 'jonah', name: 'Jonah' },
  { id: 'micah', name: 'Micah' },
  { id: 'nahum', name: 'Nahum' },
  { id: 'habakkuk', name: 'Habakkuk' },
  { id: 'zephaniah', name: 'Zephaniah' },
  { id: 'haggai', name: 'Haggai' },
  { id: 'zechariah', name: 'Zechariah' },
  { id: 'malachi', name: 'Malachi' },
  // New Testament
  { id: 'matthew', name: 'Matthew' },
  { id: 'mark', name: 'Mark' },
  { id: 'luke', name: 'Luke' },
  { id: 'john', name: 'John' },
  { id: 'acts', name: 'Acts' },
  { id: 'romans', name: 'Romans' },
  { id: '1corinthians', name: '1 Corinthians' },
  { id: '2corinthians', name: '2 Corinthians' },
  { id: 'galatians', name: 'Galatians' },
  { id: 'ephesians', name: 'Ephesians' },
  { id: 'philippians', name: 'Philippians' },
  { id: 'colossians', name: 'Colossians' },
  { id: '1thessalonians', name: '1 Thessalonians' },
  { id: '2thessalonians', name: '2 Thessalonians' },
  { id: '1timothy', name: '1 Timothy' },
  { id: '2timothy', name: '2 Timothy' },
  { id: 'titus', name: 'Titus' },
  { id: 'philemon', name: 'Philemon' },
  { id: 'hebrews', name: 'Hebrews' },
  { id: 'james', name: 'James' },
  { id: '1peter', name: '1 Peter' },
  { id: '2peter', name: '2 Peter' },
  { id: '1john', name: '1 John' },
  { id: '2john', name: '2 John' },
  { id: '3john', name: '3 John' },
  { id: 'jude', name: 'Jude' },
  { id: 'revelation', name: 'Revelation' }
];

// Chapter counts for each book
const CHAPTER_COUNTS: Record<string, number> = {
  'genesis': 50, 'exodus': 40, 'leviticus': 27, 'numbers': 36, 'deuteronomy': 34,
  'joshua': 24, 'judges': 21, 'ruth': 4, '1samuel': 31, '2samuel': 24,
  '1kings': 22, '2kings': 25, '1chronicles': 29, '2chronicles': 36, 'ezra': 10,
  'nehemiah': 13, 'esther': 10, 'job': 42, 'psalms': 150, 'proverbs': 31,
  'ecclesiastes': 12, 'songofsolomon': 8, 'isaiah': 66, 'jeremiah': 52, 'lamentations': 5,
  'ezekiel': 48, 'daniel': 12, 'hosea': 14, 'joel': 3, 'amos': 9,
  'obadiah': 1, 'jonah': 4, 'micah': 7, 'nahum': 3, 'habakkuk': 3,
  'zephaniah': 3, 'haggai': 2, 'zechariah': 14, 'malachi': 4, 'matthew': 28,
  'mark': 16, 'luke': 24, 'john': 21, 'acts': 28, 'romans': 16,
  '1corinthians': 16, '2corinthians': 13, 'galatians': 6, 'ephesians': 6, 'philippians': 4,
  'colossians': 4, '1thessalonians': 5, '2thessalonians': 3, '1timothy': 6, '2timothy': 4,
  'titus': 3, 'philemon': 1, 'hebrews': 13, 'james': 5, '1peter': 5,
  '2peter': 3, '1john': 5, '2john': 1, '3john': 1, 'jude': 1,
  'revelation': 22
};

/**
 * Map for converting from lowercase to API format
 */
const bookMap: Record<string, string> = {
  'genesis': 'GEN',
  'exodus': 'EXO',
  'leviticus': 'LEV',
  'numbers': 'NUM',
  'deuteronomy': 'DEU',
  'joshua': 'JOS',
  'judges': 'JDG',
  'ruth': 'RUT',
  '1samuel': '1SA',
  '2samuel': '2SA',
  '1kings': '1KI',
  '2kings': '2KI',
  '1chronicles': '1CH',
  '2chronicles': '2CH',
  'ezra': 'EZR',
  'nehemiah': 'NEH',
  'esther': 'EST',
  'job': 'JOB',
  'psalms': 'PSA',
  'proverbs': 'PRO',
  'ecclesiastes': 'ECC',
  'songofsolomon': 'SNG',
  'isaiah': 'ISA',
  'jeremiah': 'JER',
  'lamentations': 'LAM',
  'ezekiel': 'EZK',
  'daniel': 'DAN',
  'hosea': 'HOS',
  'joel': 'JOL',
  'amos': 'AMO',
  'obadiah': 'OBA',
  'jonah': 'JON',
  'micah': 'MIC',
  'nahum': 'NAM',
  'habakkuk': 'HAB',
  'zephaniah': 'ZEP',
  'haggai': 'HAG',
  'zechariah': 'ZEC',
  'malachi': 'MAL',
  'matthew': 'MAT',
  'mark': 'MRK',
  'luke': 'LUK',
  'john': 'JHN',
  'acts': 'ACT',
  'romans': 'ROM',
  '1corinthians': '1CO',
  '2corinthians': '2CO',
  'galatians': 'GAL',
  'ephesians': 'EPH',
  'philippians': 'PHP',
  'colossians': 'COL',
  '1thessalonians': '1TH',
  '2thessalonians': '2TH',
  '1timothy': '1TI',
  '2timothy': '2TI',
  'titus': 'TIT',
  'philemon': 'PHM',
  'hebrews': 'HEB',
  'james': 'JAS',
  '1peter': '1PE',
  '2peter': '2PE',
  '1john': '1JN',
  '2john': '2JN',
  '3john': '3JN',
  'jude': 'JUD',
  'revelation': 'REV'
};

/**
 * Fetches data from the Bible API with caching
 */
async function fetchWithCache(path: string, version?: string) {
  const cacheKey = path;
  
  if (apiCache.has(cacheKey)) {
    return apiCache.get(cacheKey);
  }
  
  try {
    // If version is provided, ensure path starts with /bibles/{versionId}
    let normalizedPath = path;
    if (version) {
      const versionId = getActualVersionId(version);
      if (!normalizedPath.startsWith(`/bibles/${versionId}`)) {
        normalizedPath = `/bibles/${versionId}${normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`}`;
      }
    }

    // Remove any leading slash for the query parameter
    const queryPath = normalizedPath.startsWith('/') ? normalizedPath.substring(1) : normalizedPath;

    console.log('Making Bible API request:', {
      baseUrl: BASE_URL,
      path: queryPath,
      environment: process.env.NODE_ENV
    });
    
    // Construct the full URL - always use the direct path
    const requestUrl = `${BASE_URL}/${queryPath}`;
    
    const response = await fetch(requestUrl, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    // Get response text first to properly handle both JSON and non-JSON responses
    const responseText = await response.text();
    
    // Log the actual response for debugging
    console.log('Bible API Response:', {
      status: response.status,
      contentType: response.headers.get('content-type'),
      responsePreview: responseText.substring(0, 200), // First 200 chars
      requestUrl // Log the full URL for debugging
    });
    
    if (!response.ok) {
      // Try to parse error response as JSON
      let errorDetails;
      try {
        errorDetails = JSON.parse(responseText);
      } catch (e) {
        // If parsing fails, use the raw text
        errorDetails = responseText;
      }
      
      console.error('Bible API Error:', {
        status: response.status,
        statusText: response.statusText,
        path: queryPath,
        errorDetails,
        requestUrl
      });
      
      throw new Error(
        `Bible API request failed: ${response.status} ${response.statusText}\n${
          typeof errorDetails === 'string' ? errorDetails : JSON.stringify(errorDetails)
        }`
      );
    }
    
    // Try to parse the response as JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse Bible API response as JSON:', {
        error: e,
        responseText: responseText.substring(0, 1000), // Log first 1000 chars
        requestUrl,
        contentType: response.headers.get('content-type')
      });
      throw new Error('Invalid JSON response from Bible API');
    }
    
    if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) {
      return null;
    }

    // Only cache successful responses
    if (data) {
      apiCache.set(cacheKey, data);
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching from Bible API:', {
      path,
      error: error instanceof Error ? error.message : 'Unknown error',
      baseUrl: BASE_URL,
      environment: process.env.NODE_ENV
    });
    throw error;
  }
}

/**
 * Gets the actual version ID to use
 */
function getActualVersionId(versionId: string): string {
  // Check for common version abbreviations
  const versionMap: Record<string, string> = {
    'kjv': 'de4e12af7f28f599-01',
    'nrsv': '9879dbb7cfe39e4d-01',
    'wlc': '0b262f1ed7f084a6-01',
    'gnt': '7644de2e4c5188e5-01',
    'lxx': 'c114c33098c4fef1-01',
    'en-kjv': 'de4e12af7f28f599-01',
    'en-nrsv': '9879dbb7cfe39e4d-01'
  };

  // If a mapped version is provided, use it
  if (versionId && versionMap[versionId.toLowerCase()]) {
    return versionMap[versionId.toLowerCase()];
  }

  // If exact version ID is provided and supported, use it
  const version = BIBLE_VERSIONS.find(v => v.id === versionId);
  if (version?.isSupported) {
    return versionId;
  }

  // If version not found, return null to indicate failure instead of defaulting
  console.warn(`Bible version ${versionId} not found`);
  return versionId; // Return the original ID and let the API handle the error
}

/**
 * Formats the book name for the API
 */
function formatBookName(book: string): string {
  // First convert the input to lowercase for consistent comparison
  const lowercaseBook = book.toLowerCase();

  // Also create a reverse map for uppercase input
  const reverseMap: Record<string, string> = {};
  Object.entries(bookMap).forEach(([key, value]) => {
    reverseMap[value.toLowerCase()] = value;
  });

  // Try to find the book in either map
  const formattedBook = bookMap[lowercaseBook] || reverseMap[lowercaseBook];
  
  if (!formattedBook) {
    console.error(`Unknown book: ${book}`);
    throw new Error(`Book "${book}" not found in supported books list`);
  }
  
  return formattedBook;
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
  try {
    const versionId = getActualVersionId(version);
    return await cacheBooks(versionId, async () => {
      const booksData = await fetchWithCache(`bibles/${versionId}/books`, version);
      
      if (!booksData?.data) {
        console.warn('Could not fetch books from API, using default list');
        return BIBLE_BOOKS;
      }
      
      // Create a set of supported book IDs for faster lookup
      const supportedBooks = new Set(
        Object.keys(bookMap).concat(Object.values(bookMap).map(v => v.toLowerCase()))
      );
      
      // Map the API response to our format, filtering out unsupported books
      return booksData.data
        .filter((book: any) => {
          // Check if the book ID is in our supported list
          const lowercaseId = book.id.toLowerCase();
          return supportedBooks.has(lowercaseId);
        })
        .map((book: any) => {
          try {
            const formattedId = formatBookName(book.id);
            return {
              id: formattedId.toLowerCase(), // Keep lowercase for UI consistency
              name: book.name,
              abbreviation: book.abbreviation
            };
          } catch (error) {
            console.debug(`Skipping unsupported book: ${book.id}`);
            return null;
          }
        })
        .filter((book: Book | null): book is Book => book !== null)
        .sort((a: Book, b: Book) => {
          // Sort books in canonical order using BIBLE_BOOKS as reference
          const aIndex = BIBLE_BOOKS.findIndex(book => book.id === a.id);
          const bIndex = BIBLE_BOOKS.findIndex(book => book.id === b.id);
          return aIndex - bIndex;
        });
    });
  } catch (error) {
    console.error('Error fetching books:', error);
    return BIBLE_BOOKS;
  }
}

/**
 * Fetches all chapters for a specific book
 */
export async function fetchChapters(version: string, book: string): Promise<Chapter[]> {
  try {
    const versionId = getActualVersionId(version);
    const formattedBook = formatBookName(book);
    
    return await cacheChapters(versionId, formattedBook, async () => {
      const chaptersData = await fetchWithCache(`bibles/${versionId}/books/${formattedBook}/chapters`, version);
      
      if (!chaptersData?.data) {
        throw new Error(`Could not fetch chapter data for ${book}`);
      }
      
      return chaptersData.data
        .filter((chapter: any) => chapter.number !== 'intro') // Skip intro chapters
        .map((chapter: any) => ({
          id: chapter.id,
          number: parseInt(chapter.number, 10)
        }))
        .sort((a: Chapter, b: Chapter) => a.number - b.number);
    });
  } catch (error) {
    console.error('Error fetching chapters:', error);
    throw error;
  }
}

/**
 * Fetches a specific chapter
 */
export async function fetchChapter(version: string, book: string, chapter: number) {
  try {
    const formattedBook = formatBookName(book);
    
    // Get chapters for the book
    const chaptersData = await fetchWithCache(`/books/${formattedBook}/chapters`, version);
    
    if (!chaptersData?.data) {
      throw new Error('Could not fetch chapter data');
    }
    
    // Find the chapter ID - note that chapter numbers are strings in the API
    const chapterData = chaptersData.data.find((c: any) => c.number === chapter.toString());
    if (!chapterData?.id) {
      throw new Error(`Chapter ${chapter} not found`);
    }
    
    // Get verses for the chapter using the actual chapter ID
    const versesData = await fetchWithCache(`/chapters/${chapterData.id}/verses`, version);
    
    if (!versesData?.data) {
      throw new Error('Could not fetch verses data');
    }

    // Map the verses with safe data extraction and ensure unique numbers
    const verses = versesData.data
      .map((verse: any) => ({
        number: parseVerseNumber(verse),
        text: extractVerseText(verse)
      }))
      .filter((verse: Verse) => verse.number > 0)
      .sort((a: Verse, b: Verse) => a.number - b.number);

    if (verses.length === 0) {
      return {
        book,
        chapter,
        verses: generateDefaultVerses(1)
      };
    }

    return {
      book,
      chapter,
      verses
    };
  } catch (error) {
    console.error('Error in fetchChapter:', error);
    return {
      book,
      chapter,
      verses: generateDefaultVerses(1)
    };
  }
}

/**
 * Fetches all verses for a specific chapter
 */
export async function fetchVerses(version: string, book: string, chapter: number): Promise<Verse[]> {
  try {
    const versionId = getActualVersionId(version);
    const formattedBook = formatBookName(book);
    
    return await cacheVerses(versionId, formattedBook, chapter.toString(), async () => {
      // Get chapters for the book to find the chapter ID
      const chaptersData = await fetchWithCache(`bibles/${versionId}/books/${formattedBook}/chapters`, version);
      
      if (!chaptersData?.data) {
        throw new Error('Could not fetch chapter data');
      }
      
      // Find the chapter ID - note that chapter numbers are strings in the API
      const chapterData = chaptersData.data.find((c: any) => c.number === chapter.toString());
      if (!chapterData?.id) {
        throw new Error(`Chapter ${chapter} not found`);
      }
      
      // Get verses for the chapter using the actual chapter ID
      const versesData = await fetchWithCache(`bibles/${versionId}/chapters/${chapterData.id}/verses`, version);
      
      if (!versesData?.data) {
        console.warn('Could not fetch verses data, using defaults');
        return generateDefaultVerses(1);
      }

      return versesData.data
        .map((verse: any) => ({
          number: parseVerseNumber(verse),
          text: extractVerseText(verse)
        }))
        .filter((verse: Verse) => verse.number > 0)
        .sort((a: Verse, b: Verse) => a.number - b.number);
    });
  } catch (error) {
    console.error('Error fetching verses:', error);
    return generateDefaultVerses(1);
  }
}

/**
 * Helper function to extract text from verse object
 */
export function extractVerseText(verse: any): string {
  try {
    if (!verse) return '';
    
    // Try to get text from various possible locations
    const text = verse.content || verse.text || verse.reference || '';
    
    // Clean up HTML and special characters
    return text
      .replace(/<\/?[^>]+(>|$)/g, '') // Remove HTML tags
      .replace(/&quot;/g, '"')        // Replace HTML entities
      .replace(/&apos;/g, "'")
      .replace(/&amp;/g, '&')
      .replace(/\s+/g, ' ')           // Replace multiple spaces with single space
      .trim();
  } catch (error) {
    console.error('Error extracting verse text:', error);
    return '';
  }
}

/**
 * Safely parses verse number
 */
function parseVerseNumber(verse: any): number {
  if (!verse) return 0;
  
  // Try to get verse number from the verse ID
  if (verse.id) {
    const match = verse.id.match(/\.(\d+)$/);
    if (match) {
      return parseInt(match[1], 10);
    }
  }
  
  // Try to get verse number from the verse number field
  if (verse.number) {
    const num = parseInt(verse.number, 10);
    if (!isNaN(num)) {
      return num;
    }
  }
  
  // Try to get verse number from reference
  if (verse.reference) {
    const match = verse.reference.match(/:(\d+)/);
    if (match) {
      return parseInt(match[1], 10);
    }
  }
  
  return 0;
}

/**
 * Fetches a specific verse
 */
export async function fetchVerse(version: string, book: string, chapter: number, verse: number): Promise<Verse> {
  try {
    const versionId = getActualVersionId(version);
    const formattedBook = formatBookName(book);
    
    return await cacheVerse(
      versionId,
      formattedBook,
      chapter.toString(),
      verse.toString(),
      async () => {
        // First get the chapter to find the verse ID
        const chaptersData = await fetchWithCache(`bibles/${versionId}/books/${formattedBook}/chapters`, version);
        
        if (!chaptersData?.data) {
          throw new Error('Could not fetch chapter data');
        }
        
        const chapterData = chaptersData.data.find((c: any) => c.number === chapter.toString());
        if (!chapterData?.id) {
          throw new Error(`Chapter ${chapter} not found`);
        }
        
        // Now get the verses to find the specific verse ID
        const versesData = await fetchWithCache(`bibles/${versionId}/chapters/${chapterData.id}/verses`, version);
        
        if (!versesData?.data) {
          throw new Error('Could not fetch verses data');
        }
        
        const verseData = versesData.data.find((v: any) => parseVerseNumber(v) === verse);
        if (!verseData) {
          throw new Error(`Verse ${verse} not found`);
        }

        return {
          number: verse,
          text: extractVerseText(verseData)
        };
      }
    );
  } catch (error) {
    console.error('Error fetching verse:', error);
    throw error;
  }
}

/**
 * Generates default verses for fallback
 */
function generateDefaultVerses(count: number): Verse[] {
  if (count <= 0) count = 1;
  return Array.from({ length: count }, (_, index) => ({
    number: index + 1,
    text: 'Unable to load from API'
  }));
} 
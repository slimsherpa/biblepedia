/**
 * Bible API Service
 * Provides functions to interact with the Bible API
 * Based on https://github.com/wldeh/bible-api
 */

// Cache for API responses to improve performance
const apiCache = new Map<string, any>();

// API configuration
const BASE_URL = process.env.NODE_ENV === 'development' ? 
  '/api/bible' : 
  `${process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL}/bibleApi`;

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
 * Fetches data from the Bible API with caching
 */
async function fetchWithCache(path: string) {
  const cacheKey = path;
  
  if (apiCache.has(cacheKey)) {
    return apiCache.get(cacheKey);
  }
  
  try {
    const response = await fetch(`${BASE_URL}?path=${encodeURIComponent(path)}`, {
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      // Only log 404s at debug level since they're expected for verse lookups
      if (response.status === 404) {
        console.debug(`Resource not found: ${path}`);
        return null;
      }
      
      // Log other errors at error level
      console.error('API Error:', {
        status: response.status,
        statusText: response.statusText,
        path
      });
      
      throw new Error(
        `API request failed with status ${response.status}`
      );
    }
    
    const data = await response.json();
    
    if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) {
      return null;
    }

    apiCache.set(cacheKey, data);
    return data;
  } catch (error) {
    // Only log non-404 errors
    if (!(error instanceof Error) || !error.message.includes('404')) {
      console.error('Error fetching from Bible API:', {
        path,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
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
  // API.Bible uses GEN, EXO, etc. format
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

  const formattedBook = bookMap[book.toLowerCase()];
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
    const booksData = await fetchWithCache('books');
    
    if (!booksData?.data) {
      console.warn('Could not fetch books from API, using default list');
      return BIBLE_BOOKS;
    }
    
    // Map the API response to our format
    return booksData.data.map((book: any) => ({
      id: book.id.toLowerCase(), // Convert to lowercase to match our existing code
      name: book.name,
      abbreviation: book.abbreviation
    }));
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
    const formattedBook = formatBookName(book);
    const chaptersData = await fetchWithCache(`books/${formattedBook}/chapters`);
    
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
    const actualVersionId = getActualVersionId(version);
    
    // First get the books list to get the book ID
    const booksEndpoint = `/bibles/${actualVersionId}/books`;
    const booksData = await fetchWithCache(booksEndpoint);
    
    if (!booksData?.data) {
      throw new Error('Could not fetch books data');
    }
    
    // Find the book ID
    const bookData = booksData.data.find((b: any) => b.id === formattedBook);
    if (!bookData?.id) {
      throw new Error(`Book ${book} not found`);
    }
    
    // Get chapters for the book
    const chaptersEndpoint = `/bibles/${actualVersionId}/books/${bookData.id}/chapters`;
    const chaptersData = await fetchWithCache(chaptersEndpoint);
    
    if (!chaptersData?.data) {
      throw new Error('Could not fetch chapter data');
    }
    
    // Find the chapter ID - note that chapter numbers are strings in the API
    const chapterData = chaptersData.data.find((c: any) => c.number === chapter.toString());
    if (!chapterData?.id) {
      throw new Error(`Chapter ${chapter} not found`);
    }
    
    // Get verses for the chapter using the actual chapter ID
    const versesEndpoint = `/bibles/${actualVersionId}/chapters/${chapterData.id}/verses`;
    const versesData = await fetchWithCache(versesEndpoint);
    
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
 * Safely extracts text content from a verse object
 */
function extractVerseText(verse: any): string {
  if (!verse) {
    console.debug('extractVerseText: verse object is null/undefined');
    return 'Verse text not available';
  }

  // Log the verse object to see its structure
  console.debug('Verse object:', verse);

  // Try different possible locations of the verse text
  const possibleFields = ['text', 'content', 'value'];
  
  for (const field of possibleFields) {
    const text = verse[field];
    if (typeof text === 'string' && text.trim()) {
      // Remove HTML tags if present and trim whitespace
      return text.replace(/<\/?[^>]+(>|$)/g, '').trim();
    }
  }

  // If we have a reference field, try to use that
  if (verse.reference && typeof verse.reference === 'string') {
    const parts = verse.reference.split(':');
    if (parts.length > 1) {
      return parts[1].trim();
    }
  }

  console.debug('extractVerseText: no valid text found in verse object');
  return 'Verse text not available';
}

/**
 * Safely parses verse number
 */
function parseVerseNumber(verse: any): number {
  if (!verse) return 0;
  
  // API.Bible uses the 'id' field which contains the verse number
  const id = verse.id || '';
  const match = id.match(/\.(\d+)$/);
  if (match) {
    return parseInt(match[1], 10);
  }
  
  // Fallback to number field
  if (verse.number && typeof verse.number === 'string') {
    return parseInt(verse.number, 10) || 0;
  }
  
  return 0;
}

/**
 * Fetches a specific verse
 */
export async function fetchVerse(version: string, book: string, chapter: number, verse: number): Promise<Verse> {
  try {
    const formattedBook = formatBookName(book);
    const verseData = await fetchWithCache(`verses/${formattedBook}.${chapter}.${verse}`);
    
    if (!verseData?.data) {
      throw new Error(`Could not fetch verse ${verse} from ${book} ${chapter}`);
    }

    return {
      number: verse,
      text: verseData.data.content || 'Verse text not available'
    };
  } catch (error) {
    console.error('Error fetching verse:', error);
    throw error;
  }
}

/**
 * Fetches all verses for a specific chapter
 */
export async function fetchVerses(version: string, book: string, chapter: number): Promise<Verse[]> {
  try {
    const formattedBook = formatBookName(book);
    const versesData = await fetchWithCache(`verses/${formattedBook}.${chapter}`);
    
    if (!versesData?.data) {
      console.warn('Could not fetch verses data, using defaults');
      return generateDefaultVerses(1);
    }

    return versesData.data
      .map((verse: any) => ({
        number: parseInt(verse.number, 10),
        text: verse.content
      }))
      .filter((verse: Verse) => verse.number > 0)
      .sort((a: Verse, b: Verse) => a.number - b.number);
  } catch (error) {
    console.error('Error fetching verses:', error);
    return generateDefaultVerses(1);
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
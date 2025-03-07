/**
 * Bible API Service
 * Provides functions to interact with the Bible API
 * Based on https://github.com/wldeh/bible-api
 */

// Cache for API responses to improve performance
const apiCache = new Map<string, any>();

// Define available Bible versions
// We're hardcoding these since the API endpoint for versions list might not be reliable
export const BIBLE_VERSIONS = [
  { id: 'en-kjv', name: 'King James Version', language: 'en' },
  { id: 'en-asv', name: 'American Standard Version', language: 'en' },
  { id: 'en-bbe', name: 'Bible in Basic English', language: 'en' },
  { id: 'en-web', name: 'World English Bible', language: 'en' },
  { id: 'en-ylt', name: 'Young\'s Literal Translation', language: 'en' },
  // NRSV is not available in the API, so we'll use KJV as default
  { id: 'en-nrsv', name: 'New Revised Standard Version', language: 'en', fallbackId: 'en-kjv' }
];

// Default version to use
export const DEFAULT_VERSION = 'en-kjv';

/**
 * Fetches data from the Bible API with caching
 */
async function fetchWithCache(url: string) {
  if (apiCache.has(url)) {
    return apiCache.get(url);
  }
  
  try {
    console.log('Fetching from URL:', url);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    apiCache.set(url, data);
    return data;
  } catch (error) {
    // Convert error to a simple string message to avoid rendering objects
    const errorMessage = error instanceof Error ? error.message : 'Unknown error fetching data';
    console.error('Error fetching from Bible API:', errorMessage);
    // Rethrow as a simple Error with a string message
    throw new Error(errorMessage);
  }
}

/**
 * Gets the actual version ID to use (handles fallbacks for versions not in the API)
 */
function getActualVersionId(versionId: string): string {
  const version = BIBLE_VERSIONS.find(v => v.id === versionId);
  if (version?.fallbackId) {
    console.log(`Version ${versionId} not available, using fallback ${version.fallbackId}`);
    return version.fallbackId;
  }
  return versionId;
}

/**
 * Fetches all available Bible versions
 * Returns an array of Bible versions or a default array if the API fails
 */
export async function fetchBibleVersions() {
  try {
    // Return our hardcoded versions instead of fetching from the API
    return BIBLE_VERSIONS;
  } catch (error) {
    console.error('Error fetching Bible versions:', error);
    // Return a default version if the API fails
    return BIBLE_VERSIONS;
  }
}

/**
 * Fetches all books for a specific Bible version
 * Returns an array of books or a default array if the API fails
 */
export async function fetchBooks(version: string) {
  try {
    // Use the actual version ID (with fallback if needed)
    const actualVersionId = getActualVersionId(version);
    
    // We'll just return the common books list directly
    // This is more reliable than trying to fetch Genesis first
    const commonBooks = [
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
    
    return commonBooks;
  } catch (error) {
    console.error('Error in fetchBooks:', error);
    // Return a minimal set of books if there's an error
    return [
      { id: 'genesis', name: 'Genesis' },
      { id: 'exodus', name: 'Exodus' },
      { id: 'matthew', name: 'Matthew' },
      { id: 'john', name: 'John' },
      { id: 'revelation', name: 'Revelation' }
    ];
  }
}

/**
 * Fetches all chapters for a specific book
 * Returns an array of chapters or a default array if there's an error
 */
export async function fetchChapters(version: string, book: string) {
  try {
    // Use the actual version ID (with fallback if needed)
    const actualVersionId = getActualVersionId(version);
    
    // The Bible API doesn't have a direct endpoint for chapters only
    // This is a workaround - we'll return a reasonable number of chapters based on the book
    const chapterCounts: Record<string, number> = {
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
    
    const count = chapterCounts[book.toLowerCase()] || 1;
    return Array.from({ length: count }, (_, i) => ({ number: i + 1 }));
  } catch (error) {
    console.error('Error in fetchChapters:', error);
    // Return a default array of 10 chapters if there's an error
    return Array.from({ length: 10 }, (_, i) => ({ number: i + 1 }));
  }
}

/**
 * Fetches a specific chapter
 * Returns the chapter data or a default object if there's an error
 */
export async function fetchChapter(version: string, book: string, chapter: number) {
  try {
    // Use the actual version ID (with fallback if needed)
    const actualVersionId = getActualVersionId(version);
    
    const url = `https://cdn.jsdelivr.net/gh/wldeh/bible-api/bibles/${actualVersionId}/books/${book}/chapters/${chapter}.json`;
    const data = await fetchWithCache(url);
    
    console.log('Chapter data:', data);
    
    // Handle different data formats
    
    // Format 1: data has a 'data' property that is an array
    if (data && data.data && Array.isArray(data.data)) {
      console.log('Found data array in chapter response');
      return {
        book: book,
        chapter: chapter,
        verses: data.data.map((item: any) => ({
          number: parseInt(item.verse || item.number || 0, 10),
          text: item.text || `Verse ${item.verse || item.number || 0}`
        }))
      };
    }
    
    // Format 2: data has a 'verses' property that is an array
    if (data && Array.isArray(data.verses)) {
      return {
        book: book,
        chapter: chapter,
        verses: data.verses
      };
    }
    
    // Format 3: data is an array itself
    if (Array.isArray(data)) {
      return {
        book: book,
        chapter: chapter,
        verses: data.map((item: any, index: number) => ({
          number: parseInt(item.verse || item.number || (index + 1), 10),
          text: item.text || `Verse ${index + 1}`
        }))
      };
    }
    
    // Format 4: data has a 'text' property that is a string
    if (data && typeof data.text === 'string') {
      return {
        book: book,
        chapter: chapter,
        verses: [{ number: 1, text: data.text }]
      };
    }
    
    console.error('Invalid chapter data format:', data);
    // Return default chapter if the data format is invalid
    return {
      book: book,
      chapter: chapter,
      verses: generateDefaultVerses(20)
    };
  } catch (error) {
    console.error('Error in fetchChapter:', error);
    // Return default chapter if there's an error
    return {
      book: book,
      chapter: chapter,
      verses: generateDefaultVerses(20)
    };
  }
}

/**
 * Fetches a specific verse
 * Returns the verse data or a default object if there's an error
 */
export async function fetchVerse(version: string, book: string, chapter: number, verse: number) {
  try {
    // Use the actual version ID (with fallback if needed)
    const actualVersionId = getActualVersionId(version);
    
    // First try to fetch the specific verse
    try {
      const url = `https://cdn.jsdelivr.net/gh/wldeh/bible-api/bibles/${actualVersionId}/books/${book}/chapters/${chapter}/verses/${verse}.json`;
      const data = await fetchWithCache(url);
      
      console.log('Verse data:', data);
      
      if (data && typeof data.text === 'string') {
        return {
          number: verse,
          text: data.text
        };
      }
    } catch (verseError) {
      console.log('Error fetching individual verse, falling back to chapter:', verseError);
      // If fetching the individual verse fails, we'll fall back to fetching the chapter
    }
    
    // If we couldn't get the individual verse, try to get it from the chapter
    const chapterData = await fetchChapter(actualVersionId, book, chapter);
    if (chapterData && Array.isArray(chapterData.verses)) {
      const verseData = chapterData.verses.find((v: { number: number }) => v.number === verse);
      if (verseData) {
        return verseData;
      }
    }
    
    console.error('Could not find verse in chapter data');
    // Return default verse if we couldn't find it
    return {
      number: verse,
      text: `This is placeholder text for ${book} ${chapter}:${verse}.`
    };
  } catch (error) {
    console.error('Error in fetchVerse:', error);
    // Return default verse if there's an error
    return {
      number: verse,
      text: `This is placeholder text for ${book} ${chapter}:${verse}.`
    };
  }
}

/**
 * Fetches all verses for a specific chapter
 * Returns an array of verses or a default array if there's an error
 */
export async function fetchVerses(version: string, book: string, chapter: number) {
  try {
    // Use the actual version ID (with fallback if needed)
    const actualVersionId = getActualVersionId(version);
    
    const chapterData = await fetchChapter(actualVersionId, book, chapter);
    
    // If we have verses in the chapter data, return them
    if (chapterData && Array.isArray(chapterData.verses)) {
      return chapterData.verses;
    }
    
    console.error('Invalid chapter data format in fetchVerses:', chapterData);
    // Return default verses if the data format is invalid
    return generateDefaultVerses(10);
  } catch (error) {
    console.error('Error in fetchVerses:', error);
    // Return default verses if there's an error
    return generateDefaultVerses(10);
  }
}

/**
 * Generates default verses for fallback
 */
function generateDefaultVerses(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    number: i + 1,
    text: `This is placeholder text for verse ${i + 1}.`
  }));
}

/**
 * Test function to directly fetch from the API and log the results
 * This is useful for debugging
 */
export async function testBibleApi() {
  try {
    console.log('Testing Bible API...');
    
    // Test fetching a chapter
    const kjvGenesis1Url = 'https://cdn.jsdelivr.net/gh/wldeh/bible-api/bibles/en-kjv/books/genesis/chapters/1.json';
    console.log(`Fetching KJV Genesis 1 from ${kjvGenesis1Url}`);
    
    try {
      const response = await fetch(kjvGenesis1Url);
      if (!response.ok) {
        console.error(`API request failed with status ${response.status}`);
      } else {
        const data = await response.json();
        console.log('KJV Genesis 1 data:', data);
      }
    } catch (error) {
      console.error('Error fetching KJV Genesis 1:', error);
    }
    
    // Test fetching a verse
    const kjvJohn316Url = 'https://cdn.jsdelivr.net/gh/wldeh/bible-api/bibles/en-kjv/books/john/chapters/3/verses/16.json';
    console.log(`Fetching KJV John 3:16 from ${kjvJohn316Url}`);
    
    try {
      const response = await fetch(kjvJohn316Url);
      if (!response.ok) {
        console.error(`API request failed with status ${response.status}`);
      } else {
        const data = await response.json();
        console.log('KJV John 3:16 data:', data);
      }
    } catch (error) {
      console.error('Error fetching KJV John 3:16:', error);
    }
    
    // Test fetching available versions
    const versionsUrl = 'https://cdn.jsdelivr.net/gh/wldeh/bible-api/bibles/bibles.json';
    console.log(`Fetching available versions from ${versionsUrl}`);
    
    try {
      const response = await fetch(versionsUrl);
      if (!response.ok) {
        console.error(`API request failed with status ${response.status}`);
      } else {
        const data = await response.json();
        console.log('Available versions data:', data);
      }
    } catch (error) {
      console.error('Error fetching available versions:', error);
    }
    
    console.log('Bible API test complete');
  } catch (error) {
    console.error('Error in testBibleApi:', error);
  }
} 
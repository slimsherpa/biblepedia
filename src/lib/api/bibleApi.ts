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
  try {
    const fullUrl = `${BASE_URL}/${path}`;
    console.log('Fetching from Bible API:', { url: fullUrl });
    
    if (!API_KEY) {
      throw new Error('Bible API key not found');
    }
    
    const response = await fetch(fullUrl, {
      headers: {
        'api-key': API_KEY,
        'Accept': 'application/json'
      }
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

    const responseData = await response.json();
    
    // The Bible API always returns data in a 'data' property
    if (!responseData.data) {
      console.error('Unexpected API response structure:', responseData);
      throw new Error('Unexpected API response structure');
    }

    return responseData.data;
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
 * Note: This only returns verse metadata. To get content, use fetchVerse for each verse.
 */
export async function fetchVerses(version: string, chapterId: string): Promise<Verse[]> {
  try {
    // First get the verse metadata
    console.log(`Fetching verses for chapter ${chapterId}`);
    const verses = await fetchFromBibleApi(`bibles/${version}/chapters/${chapterId}/verses`);
    
    if (!Array.isArray(verses)) {
      console.error('Expected verses to be an array:', verses);
      throw new Error('Invalid verses response from API');
    }

    console.log(`Found ${verses.length} verses, fetching content for each...`);
    
    // Parse the chapterId to get book and chapter
    const [bookId, chapterNum] = chapterId.split('.');
    
    // Then fetch the actual content for each verse
    const versesWithContent = await Promise.all(
      verses.map(async (verse: any) => {
        try {
          // Extract verse number from verse.id (format: BOOK.CHAPTER.VERSE)
          const verseNum = parseInt(verse.id.split('.')[2]);
          console.log(`Fetching content for verse ${verse.id}`);
          // Get the actual verse content using the verse ID
          const verseData = await fetchVerse(version, bookId, parseInt(chapterNum), verseNum);
          return {
            ...verse,
            ...verseData
          };
        } catch (error: any) {
          console.error(`Error fetching verse content for ${verse.id}:`, error);
          return {
            ...verse,
            content: `Error loading verse content: ${error?.message || 'Unknown error'}`,
            reference: verse.reference || '',
            verseCount: 1,
            copyright: ''
          };
        }
      })
    );

    console.log(`Successfully fetched content for ${versesWithContent.length} verses`);
    return versesWithContent;
  } catch (error: any) {
    console.error('Error in fetchVerses:', error);
    throw error;
  }
}

/**
 * Fetches a specific verse with its content
 * Following the API documentation at https://docs.api.bible/tutorials/getting-a-specific-verse
 */
export async function fetchVerse(version: string, bookId: string, chapter: number, verse: number): Promise<Verse> {
  try {
    // Construct the verse ID in the format required by the API
    const verseId = `${bookId}.${chapter}.${verse}`;
    
    const data = await fetchFromBibleApi(
      `bibles/${version}/verses/${verseId}?content-type=text&include-notes=false&include-titles=false&include-chapter-numbers=false&include-verse-numbers=false&include-verse-spans=false&use-org-id=false`
    );
    
    // Ensure we have the required fields
    if (!data.content) {
      console.error('Missing verse content in response:', data);
      throw new Error('Missing verse content in API response');
    }

    return {
      id: data.id,
      orgId: data.orgId || data.id,
      bibleId: data.bibleId,
      bookId: data.bookId,
      chapterId: data.chapterId,
      content: data.content,
      reference: data.reference,
      verseCount: 1,
      copyright: data.copyright || ''
    };
  } catch (error) {
    console.error('Error fetching verse:', { version, bookId, chapter, verse, error });
    throw error;
  }
} 
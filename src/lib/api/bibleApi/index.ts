import { BibleBook, BibleChapter, BibleVerse, APIResponse } from '../../types/bible';
import { bibleCache } from '../../utils/cache';
import { endpoints, BASE_URL, DEFAULT_VERSION, getActualVersionId } from './endpoints';

// Helper to generate consistent cache keys
const generateCacheKey = (parts: string[]): string => {
  return parts.filter(Boolean).join(':');
};

async function fetchFromAPI<T>(path: string): Promise<APIResponse<T>> {
  const url = `${BASE_URL}?path=${encodeURIComponent(path)}`;
  console.log('Fetching from API:', { url, path });
  
  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', {
        status: response.status,
        statusText: response.statusText,
        url,
        path,
        response: errorText
      });
      throw new Error(`API request failed: ${response.status} ${response.statusText}\n${errorText}`);
    }

    const data = await response.json();
    console.log('API Response:', {
      path,
      status: 'success',
      dataType: data.data ? typeof data.data : 'no data',
      hasData: !!data.data,
      responseStructure: {
        hasData: 'data' in data,
        dataType: typeof data.data,
        isArray: Array.isArray(data.data),
        length: Array.isArray(data.data) ? data.data.length : 'not an array',
        sample: data.data ? JSON.stringify(data.data).slice(0, 100) + '...' : 'no data'
      }
    });
    return data;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
}

async function fetchWithCache<T>(path: string, cacheKey: string, expiry?: number): Promise<T | null> {
  // Try cache first
  const cached = await bibleCache.get<T>(cacheKey);
  if (cached) {
    console.log('Cache hit:', { cacheKey, path });
    return cached;
  }
  
  console.log('Cache miss:', { cacheKey, path });

  try {
    const response = await fetchFromAPI<T>(path);
    if (response.data) {
      await bibleCache.set(cacheKey, response.data, expiry);
      return response.data;
    }
    return null;
  } catch (error) {
    console.error('API Error:', { error, path, cacheKey });
    throw error;
  }
}

export const bibleApi = {
  async getBooks(version: string = DEFAULT_VERSION): Promise<BibleBook[]> {
    const versionId = getActualVersionId(version);
    const path = endpoints.books(versionId);
    const cacheKey = generateCacheKey(['books', versionId]);
    
    try {
      const books = await fetchWithCache<BibleBook[]>(path, cacheKey);
      return books || [];
    } catch (error) {
      console.error('Failed to get books:', error);
      return [];
    }
  },

  async getChapters(version: string, bookId: string): Promise<BibleChapter[]> {
    const versionId = getActualVersionId(version);
    const path = endpoints.chapters(versionId, bookId);
    const cacheKey = generateCacheKey(['chapters', versionId, bookId]);
    
    try {
      const chapters = await fetchWithCache<BibleChapter[]>(path, cacheKey);
      return chapters || [];
    } catch (error) {
      console.error('Failed to get chapters:', error);
      return [];
    }
  },

  async getVerses(version: string, chapterId: string): Promise<{ verses: BibleVerse[]; meta: { fumsId: string } }> {
    const versionId = getActualVersionId(version);
    const path = endpoints.verses(versionId, chapterId);
    const cacheKey = generateCacheKey(['verses', versionId, chapterId]);
    
    try {
      console.log('Fetching verses:', { versionId, chapterId, path });
      const response = await fetchFromAPI<BibleVerse[]>(path);
      
      // Log the raw response for debugging
      console.log('Raw verses response:', response);
      
      // The Bible API returns verses in response.data
      const verses = Array.isArray(response.data) ? response.data : [];
      const fumsId = response.meta?.fumsId || '';
      
      console.log('Processed verses:', { 
        success: verses.length > 0,
        count: verses.length,
        firstVerse: verses[0],
        fumsId,
        path
      });
      
      return { verses, meta: { fumsId } };
    } catch (error) {
      console.error('Failed to get verses:', {
        error,
        versionId,
        chapterId,
        path
      });
      return { verses: [], meta: { fumsId: '' } };
    }
  },

  async getVerse(version: string, reference: string): Promise<BibleVerse | null> {
    const versionId = getActualVersionId(version);
    const path = endpoints.verse(versionId, reference);
    const cacheKey = generateCacheKey(['verse', versionId, reference]);
    
    try {
      return await fetchWithCache<BibleVerse>(path, cacheKey);
    } catch (error) {
      console.error('Failed to get verse:', error);
      return null;
    }
  },

  async getChapterVerses(version: string, book: string, chapter: number): Promise<{ verses: BibleVerse[]; meta: { fumsId: string } }> {
    const versionId = getActualVersionId(version);
    console.log('Getting verses for:', { versionId, book, chapter });
    
    try {
      // First get chapters to find chapter ID
      const chapters = await this.getChapters(versionId, book);
      console.log('Found chapters:', chapters);
      
      // Convert chapter number to string for comparison since API returns string numbers
      const chapterStr = String(chapter);
      const chapterData = chapters.find(c => String(c.number) === chapterStr);
      
      if (!chapterData?.id) {
        console.error('Chapter not found:', {
          book,
          chapter,
          chapterType: typeof chapter,
          availableChapters: chapters.map(c => ({ id: c.id, number: c.number, numberType: typeof c.number }))
        });
        return { verses: [], meta: { fumsId: '' } };
      }
      
      console.log('Found chapter:', chapterData);
      const response = await this.getVerses(versionId, chapterData.id);
      console.log('Chapter verses response:', response);
      return response;
    } catch (error) {
      console.error('Failed to get chapter verses:', error);
      return { verses: [], meta: { fumsId: '' } };
    }
  },

  clearCache() {
    return bibleCache.clear();
  }
}; 
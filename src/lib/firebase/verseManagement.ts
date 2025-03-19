import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { bibleApi } from '../api/bibleApi/index';
import { BibleVerse } from '../types/bible';

interface VerseData {
  number: number;
  content: string;
}

interface ChapterVerses {
  version: string;
  book: string;
  chapter: number;
  verses: VerseData[];
  timestamp: number;
}

const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

export async function getVerses(version: string, book: string, chapter: number): Promise<VerseData[]> {
  try {
    // Check Firebase cache first
    const docRef = doc(db, 'verses', `${version}_${book}_${chapter}`);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data() as ChapterVerses;
      
      // Check if cache is still valid
      if (Date.now() - data.timestamp < CACHE_EXPIRY) {
        console.log('Using cached verses');
        return data.verses;
      }
    }
    
    // If not in cache or expired, fetch from API
    console.log('Fetching verses from API');
    const verses = await bibleApi.getChapterVerses(version, book, chapter);
    
    // Transform verses to match expected format
    const verseData: VerseData[] = verses.map((verse: BibleVerse) => ({
      number: verse.number as number, // We know it's a number in this context
      content: verse.text
    }));
    
    // Cache the verses
    const chapterVerses: ChapterVerses = {
      version,
      book,
      chapter,
      verses: verseData,
      timestamp: Date.now()
    };
    
    await setDoc(docRef, chapterVerses);
    
    return verseData;
  } catch (error) {
    console.error('Error in getVerses:', error);
    throw error;
  }
}

export async function getVerseCommentary(reference: string): Promise<string | null> {
  try {
    const docRef = doc(db, 'commentary', reference);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data().content;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting verse commentary:', error);
    return null;
  }
} 
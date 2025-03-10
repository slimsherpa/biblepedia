import { db } from './firebase';
import { collection, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { BookSummary, ChapterSummary } from '../types/summaryTypes';

const BOOK_SUMMARIES_COLLECTION = 'bookSummaries';
const CHAPTER_SUMMARIES_COLLECTION = 'chapterSummaries';

export async function getBookSummary(bookId: string): Promise<BookSummary | null> {
  try {
    const docRef = doc(db, BOOK_SUMMARIES_COLLECTION, bookId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as BookSummary;
    }
    return null;
  } catch (error) {
    console.error('Error fetching book summary:', error);
    return null;
  }
}

export async function getChapterSummary(bookId: string, chapterNumber: number): Promise<ChapterSummary | null> {
  try {
    const docRef = doc(db, CHAPTER_SUMMARIES_COLLECTION, `${bookId}_${chapterNumber}`);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as ChapterSummary;
    }
    return null;
  } catch (error) {
    console.error('Error fetching chapter summary:', error);
    return null;
  }
}

export async function createOrUpdateBookSummary(bookId: string, data: Partial<BookSummary>): Promise<boolean> {
  try {
    const docRef = doc(db, BOOK_SUMMARIES_COLLECTION, bookId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      // Create new summary with default values
      const defaultSummary: BookSummary = {
        bookId,
        content: `${bookId} summary coming soon.`,
        lastEditId: '',
        edits: [],
        debate: [],
        contributors: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        ...data
      };
      await setDoc(docRef, defaultSummary);
    } else {
      // Update existing summary
      await updateDoc(docRef, {
        ...data,
        updatedAt: Date.now()
      });
    }
    return true;
  } catch (error) {
    console.error('Error creating/updating book summary:', error);
    return false;
  }
}

export async function createOrUpdateChapterSummary(
  bookId: string, 
  chapterNumber: number, 
  data: Partial<ChapterSummary>
): Promise<boolean> {
  try {
    const docRef = doc(db, CHAPTER_SUMMARIES_COLLECTION, `${bookId}_${chapterNumber}`);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      // Create new summary with default values
      const defaultSummary: ChapterSummary = {
        bookId,
        chapterNumber,
        content: `${bookId} Chapter ${chapterNumber} summary coming soon.`,
        lastEditId: '',
        edits: [],
        debate: [],
        contributors: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        ...data
      };
      await setDoc(docRef, defaultSummary);
    } else {
      // Update existing summary
      await updateDoc(docRef, {
        ...data,
        updatedAt: Date.now()
      });
    }
    return true;
  } catch (error) {
    console.error('Error creating/updating chapter summary:', error);
    return false;
  }
} 
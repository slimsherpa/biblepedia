import { db } from '@/lib/firebase/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Book, Chapter, Verse } from './bibleApi';

// Helper function to create a valid Firestore document path
function createValidDocPath(segments: string[]): string {
  return segments
    .map(segment => segment.replace(/[~*/[\]]/g, '_')) // Replace invalid characters
    .join('_');
}

// Helper function to safely read from Firestore
async function safeFirestoreRead(path: string) {
  try {
    const docRef = doc(db, 'bible-cache', path);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      // Check if cache is still valid (24 hours)
      if (data.timestamp && (Date.now() - data.timestamp) < 24 * 60 * 60 * 1000) {
        return data.content;
      }
    }
    return null;
  } catch (error) {
    console.warn('Error reading from cache:', error);
    return null;
  }
}

// Helper function to safely write to Firestore
async function safeFirestoreWrite(path: string, content: any) {
  try {
    const docRef = doc(db, 'bible-cache', path);
    await setDoc(docRef, {
      content,
      timestamp: Date.now()
    });
    return true;
  } catch (error) {
    console.warn('Error writing to cache:', error);
    return false;
  }
}

export async function cacheBooks(versionId: string, fetcher: () => Promise<Book[]>): Promise<Book[]> {
  const path = createValidDocPath(['books', versionId]);
  
  // Try to get from cache first
  const cached = await safeFirestoreRead(path);
  if (cached) {
    console.log('Cache hit - books:', versionId);
    return cached;
  }

  // Fetch fresh data
  console.log('Fetching fresh data:', { type: 'book', key: versionId });
  const books = await fetcher();
  
  // Try to cache the result
  await safeFirestoreWrite(path, books);
  
  return books;
}

export async function cacheChapters(
  versionId: string,
  bookId: string,
  fetcher: () => Promise<Chapter[]>
): Promise<Chapter[]> {
  const path = createValidDocPath(['chapters', versionId, bookId]);
  
  // Try to get from cache first
  const cached = await safeFirestoreRead(path);
  if (cached) {
    console.log('Cache hit - chapters:', { version: versionId, book: bookId });
    return cached;
  }

  // Fetch fresh data
  console.log('Fetching fresh data:', { type: 'chapter', key: `${versionId}-${bookId}` });
  const chapters = await fetcher();
  
  // Try to cache the result
  await safeFirestoreWrite(path, chapters);
  
  return chapters;
}

export async function cacheVerses(
  versionId: string,
  bookId: string,
  chapterId: string,
  fetcher: () => Promise<Verse[]>
): Promise<Verse[]> {
  const path = createValidDocPath(['verses', versionId, bookId, chapterId]);
  
  // Try to get from cache first
  const cached = await safeFirestoreRead(path);
  if (cached) {
    console.log('Cache hit - verses:', { version: versionId, book: bookId, chapter: chapterId });
    return cached;
  }

  // Fetch fresh data
  console.log('Fetching fresh data:', { type: 'verses', key: `${versionId}-${bookId}-${chapterId}` });
  const verses = await fetcher();
  
  // Try to cache the result
  await safeFirestoreWrite(path, verses);
  
  return verses;
}

export async function cacheVerse(
  versionId: string,
  bookId: string,
  chapterId: string,
  verseId: string,
  fetcher: () => Promise<Verse>
): Promise<Verse> {
  const path = createValidDocPath(['verse', versionId, bookId, chapterId, verseId]);
  
  // Try to get from cache first
  const cached = await safeFirestoreRead(path);
  if (cached) {
    console.log('Cache hit - verse:', { version: versionId, book: bookId, chapter: chapterId, verse: verseId });
    return cached;
  }

  // Fetch fresh data
  console.log('Fetching fresh data:', { type: 'verse', key: `${versionId}-${bookId}-${chapterId}-${verseId}` });
  const verse = await fetcher();
  
  // Try to cache the result
  await safeFirestoreWrite(path, verse);
  
  return verse;
} 
import { db } from '../lib/firebase/firebase';
import { collection, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

// Bible book data with chapter counts
const bibleBooks = [
  { id: 'GEN', name: 'Genesis', chapters: 50 },
  { id: 'EXO', name: 'Exodus', chapters: 40 },
  { id: 'LEV', name: 'Leviticus', chapters: 27 },
  { id: 'NUM', name: 'Numbers', chapters: 36 },
  { id: 'DEU', name: 'Deuteronomy', chapters: 34 },
  { id: 'JOS', name: 'Joshua', chapters: 24 },
  { id: 'JDG', name: 'Judges', chapters: 21 },
  { id: 'RUT', name: 'Ruth', chapters: 4 },
  { id: '1SA', name: '1 Samuel', chapters: 31 },
  { id: '2SA', name: '2 Samuel', chapters: 24 },
  { id: '1KI', name: '1 Kings', chapters: 22 },
  { id: '2KI', name: '2 Kings', chapters: 25 },
  { id: '1CH', name: '1 Chronicles', chapters: 29 },
  { id: '2CH', name: '2 Chronicles', chapters: 36 },
  { id: 'EZR', name: 'Ezra', chapters: 10 },
  { id: 'NEH', name: 'Nehemiah', chapters: 13 },
  { id: 'EST', name: 'Esther', chapters: 10 },
  { id: 'JOB', name: 'Job', chapters: 42 },
  { id: 'PSA', name: 'Psalms', chapters: 150 },
  { id: 'PRO', name: 'Proverbs', chapters: 31 },
  { id: 'ECC', name: 'Ecclesiastes', chapters: 12 },
  { id: 'SNG', name: 'Song of Solomon', chapters: 8 },
  { id: 'ISA', name: 'Isaiah', chapters: 66 },
  { id: 'JER', name: 'Jeremiah', chapters: 52 },
  { id: 'LAM', name: 'Lamentations', chapters: 5 },
  { id: 'EZK', name: 'Ezekiel', chapters: 48 },
  { id: 'DAN', name: 'Daniel', chapters: 12 },
  { id: 'HOS', name: 'Hosea', chapters: 14 },
  { id: 'JOL', name: 'Joel', chapters: 3 },
  { id: 'AMO', name: 'Amos', chapters: 9 },
  { id: 'OBA', name: 'Obadiah', chapters: 1 },
  { id: 'JON', name: 'Jonah', chapters: 4 },
  { id: 'MIC', name: 'Micah', chapters: 7 },
  { id: 'NAM', name: 'Nahum', chapters: 3 },
  { id: 'HAB', name: 'Habakkuk', chapters: 3 },
  { id: 'ZEP', name: 'Zephaniah', chapters: 3 },
  { id: 'HAG', name: 'Haggai', chapters: 2 },
  { id: 'ZEC', name: 'Zechariah', chapters: 14 },
  { id: 'MAL', name: 'Malachi', chapters: 4 },
  { id: 'MAT', name: 'Matthew', chapters: 28 },
  { id: 'MRK', name: 'Mark', chapters: 16 },
  { id: 'LUK', name: 'Luke', chapters: 24 },
  { id: 'JHN', name: 'John', chapters: 21 },
  { id: 'ACT', name: 'Acts', chapters: 28 },
  { id: 'ROM', name: 'Romans', chapters: 16 },
  { id: '1CO', name: '1 Corinthians', chapters: 16 },
  { id: '2CO', name: '2 Corinthians', chapters: 13 },
  { id: 'GAL', name: 'Galatians', chapters: 6 },
  { id: 'EPH', name: 'Ephesians', chapters: 6 },
  { id: 'PHP', name: 'Philippians', chapters: 4 },
  { id: 'COL', name: 'Colossians', chapters: 4 },
  { id: '1TH', name: '1 Thessalonians', chapters: 5 },
  { id: '2TH', name: '2 Thessalonians', chapters: 3 },
  { id: '1TI', name: '1 Timothy', chapters: 6 },
  { id: '2TI', name: '2 Timothy', chapters: 4 },
  { id: 'TIT', name: 'Titus', chapters: 3 },
  { id: 'PHM', name: 'Philemon', chapters: 1 },
  { id: 'HEB', name: 'Hebrews', chapters: 13 },
  { id: 'JAS', name: 'James', chapters: 5 },
  { id: '1PE', name: '1 Peter', chapters: 5 },
  { id: '2PE', name: '2 Peter', chapters: 3 },
  { id: '1JN', name: '1 John', chapters: 5 },
  { id: '2JN', name: '2 John', chapters: 1 },
  { id: '3JN', name: '3 John', chapters: 1 },
  { id: 'JUD', name: 'Jude', chapters: 1 },
  { id: 'REV', name: 'Revelation', chapters: 22 }
];

const BOOK_SUMMARIES_COLLECTION = 'bookSummaries';
const CHAPTER_SUMMARIES_COLLECTION = 'chapterSummaries';

interface Summary {
  content: string;
  lastEditId: string;
  edits: any[];
  debate: any[];
  contributors: string[];
  createdAt: number;
  updatedAt: number;
}

interface BookSummary extends Summary {
  bookId: string;
}

interface ChapterSummary extends Summary {
  bookId: string;
  chapterNumber: number;
}

async function createOrUpdateBookSummary(bookId: string, data: Partial<BookSummary>): Promise<boolean> {
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

async function createOrUpdateChapterSummary(
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

async function initializeSummaries() {
  console.log('Starting summary initialization...');
  
  for (const book of bibleBooks) {
    // Initialize book summary
    console.log(`Initializing summary for ${book.name}...`);
    await createOrUpdateBookSummary(book.id, {
      content: `${book.name} summary coming soon.`,
      contributors: []
    });

    // Initialize chapter summaries
    for (let chapter = 1; chapter <= book.chapters; chapter++) {
      console.log(`Initializing summary for ${book.name} Chapter ${chapter}...`);
      await createOrUpdateChapterSummary(book.id, chapter, {
        content: `${book.name} Chapter ${chapter} summary coming soon.`,
        contributors: []
      });
    }
  }

  console.log('Summary initialization complete!');
}

// Run the initialization
console.log('Starting the summary initialization process...');

initializeSummaries()
  .then(() => {
    console.log('Successfully initialized all summaries!');
    process.exit(0);
  })
  .catch((error: unknown) => {
    console.error('Failed to initialize summaries:', error);
    process.exit(1);
  }); 
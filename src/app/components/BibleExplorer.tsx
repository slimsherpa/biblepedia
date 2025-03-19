'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { getBooks, getChapters, getVerses } from '@/lib/api/bibleApi';
import { DEFAULT_VERSION } from '@/lib/api/bibleConfig';
import BooksColumn from './BooksColumn';
import ChaptersColumn from './ChaptersColumn';
import VersesColumn from './VersesColumn';
import VerseCommentaryDisplay from './VerseCommentaryDisplay';
import EditCommentaryModal from './EditCommentaryModal';
import LoadingSpinner from './LoadingSpinner';
import ErrorBoundary from './ErrorBoundary';
import Header from './Header';

// API Response Types
interface ApiBook {
  id: string;
  name: string;
  nameLong: string;
  abbreviation: string;
}

interface ApiChapter {
  id: string;
  number: string;
  bookId: string;
  reference: string;
}

interface ApiVerse {
  id: string;
  orgId: string;
  bookId: string;
  chapterId: string;
  reference: string;
  text: string;
}

// Component Types
export interface Book {
  id: string;
  name: string;
  testament: 'OT' | 'NT';
}

export interface Chapter {
  id: string;
  number: number;
  reference: string;
}

export interface Verse {
  id: string;
  orgId: string;
  bookId: string;
  chapterId: string;
  reference: string;
  text: string;
}

export interface Commentary {
  text: string;
  author: string;
  timestamp: number;
  references?: string[];
  tags?: string[];
}

export default function BibleExplorer() {
  const { user } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [selectedVerse, setSelectedVerse] = useState<Verse | null>(null);
  const [commentary, setCommentary] = useState<Commentary | null>(null);
  const [isEditingCommentary, setIsEditingCommentary] = useState(false);
  const [loading, setLoading] = useState({
    books: true,
    chapters: false,
    verses: false,
  });
  const [error, setError] = useState<string | null>(null);

  // Load books on mount
  useEffect(() => {
    loadBooks();
  }, []);

  // Load chapters when book is selected
  useEffect(() => {
    if (selectedBook) {
      loadChapters(selectedBook.name);
    } else {
      setChapters([]);
      setSelectedChapter(null);
    }
  }, [selectedBook]);

  // Load verses when chapter is selected
  useEffect(() => {
    if (selectedBook && selectedChapter) {
      loadVerses(selectedBook.name, selectedChapter.number);
    } else {
      setVerses([]);
      setSelectedVerse(null);
    }
  }, [selectedBook, selectedChapter]);

  const loadBooks = async () => {
    try {
      setLoading(prev => ({ ...prev, books: true }));
      setError(null);
      const response = await getBooks();
      if (response.error) {
        throw new Error(response.error.message);
      }
      if (response.data) {
        // Map API Book type to our Book type
        const mappedBooks = response.data.map(book => ({
          id: book.id,
          name: book.name,
          testament: book.id.startsWith('GEN') || book.id.startsWith('MAL') ? ('OT' as const) : ('NT' as const)
        }));
        setBooks(mappedBooks);
      }
    } catch (err) {
      setError('Failed to load books. Please try again.');
      console.error('Error loading books:', err);
    } finally {
      setLoading(prev => ({ ...prev, books: false }));
    }
  };

  const loadChapters = async (bookName: string) => {
    try {
      setLoading(prev => ({ ...prev, chapters: true }));
      setError(null);
      const response = await getChapters(bookName);
      if (response.error) {
        throw new Error(response.error.message);
      }
      if (response.data) {
        // Map API Chapter type to our Chapter type
        const mappedChapters = response.data.map(chapter => ({
          id: chapter.id,
          number: parseInt(chapter.number, 10),
          reference: chapter.reference
        }));
        setChapters(mappedChapters);
      }
    } catch (err) {
      setError('Failed to load chapters. Please try again.');
      console.error('Error loading chapters:', err);
    } finally {
      setLoading(prev => ({ ...prev, chapters: false }));
    }
  };

  const loadVerses = async (bookName: string, chapter: number) => {
    try {
      setLoading(prev => ({ ...prev, verses: true }));
      setError(null);
      const response = await getVerses(bookName, chapter);
      if (response.error) {
        throw new Error(response.error.message);
      }
      if (response.data) {
        setVerses(response.data);
      }
    } catch (err) {
      setError('Failed to load verses. Please try again.');
      console.error('Error loading verses:', err);
    } finally {
      setLoading(prev => ({ ...prev, verses: false }));
    }
  };

  const handleBookSelect = (book: Book) => {
    setSelectedBook(book);
    setSelectedChapter(null);
    setSelectedVerse(null);
  };

  const handleChapterSelect = (chapter: Chapter) => {
    setSelectedChapter(chapter);
    setSelectedVerse(null);
  };

  const handleVerseSelect = (verse: Verse) => {
    setSelectedVerse(verse);
  };

  const handleSaveCommentary = (newCommentary: Commentary) => {
    setCommentary(newCommentary);
    setIsEditingCommentary(false);
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={loadBooks}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Books Column */}
      <div className="w-1/4 border-r border-gray-200 dark:border-gray-700">
        {loading.books ? (
          <LoadingSpinner />
        ) : (
          <BooksColumn
            books={books}
            selectedBook={selectedBook}
            onSelect={handleBookSelect}
          />
        )}
      </div>

      {/* Chapters Column */}
      <div className="w-1/4 border-r border-gray-200 dark:border-gray-700">
        {loading.chapters ? (
          <LoadingSpinner />
        ) : selectedBook ? (
          <ChaptersColumn
            chapters={chapters}
            selectedChapter={selectedChapter}
            onSelect={handleChapterSelect}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Select a book to view chapters
          </div>
        )}
      </div>

      {/* Verses Column */}
      <div className="w-1/4 border-r border-gray-200 dark:border-gray-700">
        {loading.verses ? (
          <LoadingSpinner />
        ) : selectedChapter ? (
          <VersesColumn
            verses={verses}
            selectedVerse={selectedVerse}
            onSelect={handleVerseSelect}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Select a chapter to view verses
          </div>
        )}
      </div>

      {/* Commentary Column */}
      <div className="w-1/4 p-4">
        {selectedVerse ? (
          <VerseCommentaryDisplay
            reference={selectedVerse.reference}
            text={selectedVerse.text}
            commentary={commentary}
            canEdit={!!user}
            onEdit={() => setIsEditingCommentary(true)}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Select a verse to view commentary
          </div>
        )}
      </div>

      {/* Edit Commentary Modal */}
      <EditCommentaryModal
        isOpen={isEditingCommentary}
        onClose={() => setIsEditingCommentary(false)}
        onSave={handleSaveCommentary}
        initialCommentary={commentary}
        reference={selectedVerse?.reference || ''}
        text={selectedVerse?.text || ''}
      />
    </div>
  );
} 
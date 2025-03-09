'use client';

import { useState, useEffect } from 'react';
import { fetchBooks } from '@/lib/api/bibleApi';
import { getErrorMessage } from '@/lib/utils/errorHandling';
import { motion } from 'framer-motion';

interface Book {
  id: string;
  name: string;
}

interface BooksColumnProps {
  version: string;
  selectedBook: string | null;
  onSelectBook: (book: string) => void;
}

// Default books to use if API fails
const DEFAULT_BOOKS: Book[] = [
  { id: 'genesis', name: 'Genesis' },
  { id: 'exodus', name: 'Exodus' },
  { id: 'leviticus', name: 'Leviticus' },
  { id: 'matthew', name: 'Matthew' },
  { id: 'john', name: 'John' },
  { id: 'revelation', name: 'Revelation' }
];

export default function BooksColumn({ version, selectedBook, onSelectBook }: BooksColumnProps) {
  const [books, setBooks] = useState<Book[]>(DEFAULT_BOOKS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function loadBooks() {
      try {
        setLoading(true);
        const data = await fetchBooks(version);
        if (Array.isArray(data) && data.length > 0) {
          setBooks(data);
          setError(null);
        } else {
          console.error('Invalid data format from Bible API:', data);
          setError('Failed to load books: Invalid data format');
          // Keep the default books
        }
      } catch (err) {
        const errorMessage = getErrorMessage(err);
        setError(errorMessage);
        console.error('Error loading books:', errorMessage);
        // Keep the default books
      } finally {
        setLoading(false);
      }
    }

    loadBooks();
  }, [version]);

  // Safely filter books
  const getFilteredBooks = () => {
    try {
      return books.filter(book => 
        typeof book.name === 'string' && 
        book.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    } catch (err) {
      console.error('Error filtering books:', err);
      return DEFAULT_BOOKS;
    }
  };

  const filteredBooks = getFilteredBooks();

  // Group books by testament
  const oldTestamentBooks = filteredBooks.slice(0, Math.min(39, filteredBooks.length));
  const newTestamentBooks = filteredBooks.slice(Math.min(39, filteredBooks.length));

  // Safely render a book button
  const renderBookButton = (book: Book) => {
    try {
      const id = typeof book.id === 'string' ? book.id : 'unknown';
      const name = typeof book.name === 'string' ? book.name : 'Unknown';
      
      return (
        <motion.button
          key={id}
          className={`w-full py-2 px-3 text-left transition-all font-sans text-sm ${
            selectedBook === id 
              ? 'bg-blue-50 text-blue-700 font-medium' 
              : 'hover:bg-gray-50 text-gray-700'
          }`}
          onClick={() => onSelectBook(id)}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          {name}
        </motion.button>
      );
    } catch (err) {
      console.error('Error rendering book button:', err);
      return null;
    }
  };

  return (
    <div className="w-[145px] min-w-[145px] border-r h-full flex flex-col bg-white">
      <div className="p-2 border-b bg-white">
        <h2 className="text-sm font-semibold text-gray-900 font-sans">Books</h2>
        <input
          type="text"
          placeholder="Search..."
          className="w-full mt-2 px-2 py-1 text-sm border rounded-md focus:outline-none focus:border-blue-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      <div className="flex-1 overflow-y-auto bg-white custom-scrollbar">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-700"></div>
          </div>
        ) : error ? (
          <div className="text-sm text-red-500 font-sans p-2">{error}</div>
        ) : filteredBooks.length === 0 ? (
          <div className="text-sm text-gray-500 font-sans p-2">No books found</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredBooks.map((book) => (
              <motion.button
                key={book.id}
                className={`w-full py-2 px-3 text-left transition-all font-sans text-sm ${
                  selectedBook === book.id 
                    ? 'bg-blue-50 text-blue-700 font-medium' 
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
                onClick={() => onSelectBook(book.id)}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                {book.name}
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 
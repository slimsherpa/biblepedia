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
          className={`w-full text-left p-2 text-xs hover:bg-blue-50 transition-colors ${
            selectedBook === id ? 'bg-blue-100 font-medium' : ''
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
    <div className="w-[100px] min-w-[100px] border-r h-full flex flex-col">
      <div className="p-2 border-b bg-white">
        <h2 className="text-sm font-semibold mb-1">Books</h2>
        <input
          type="text"
          placeholder="Search..."
          className="w-full p-1 text-xs border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      <div className="flex-1 overflow-y-auto bg-gray-50">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-700"></div>
          </div>
        ) : error ? (
          <div className="p-2 text-xs text-red-500">{error}</div>
        ) : (
          <div className="divide-y">
            {searchTerm === '' && (
              <>
                <div className="sticky top-0 bg-gray-100 p-1 text-xs font-medium text-gray-600">
                  Old Testament
                </div>
                {oldTestamentBooks.map(renderBookButton)}
                
                <div className="sticky top-0 bg-gray-100 p-1 text-xs font-medium text-gray-600">
                  New Testament
                </div>
                {newTestamentBooks.map(renderBookButton)}
              </>
            )}
            
            {searchTerm !== '' && filteredBooks.length === 0 && (
              <div className="p-2 text-xs text-gray-500">No books found matching "{searchTerm}"</div>
            )}
            
            {searchTerm !== '' && filteredBooks.map(renderBookButton)}
          </div>
        )}
      </div>
    </div>
  );
} 
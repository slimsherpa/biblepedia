'use client';

import { useState } from 'react';
import { Book } from './BibleExplorer';

interface BooksColumnProps {
  books: Book[];
  selectedBook: Book | null;
  onSelect: (book: Book) => void;
}

export default function BooksColumn({ books, selectedBook, onSelect }: BooksColumnProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter books by search term
  const filteredBooks = books.filter(book => 
    book.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group books by testament
  const oldTestamentBooks = filteredBooks.filter(book => book.testament === 'OT');
  const newTestamentBooks = filteredBooks.filter(book => book.testament === 'NT');

  return (
    <div className="h-full flex flex-col">
      {/* Search input */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search books..."
          className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Books list */}
      <div className="flex-1 overflow-y-auto">
        {/* Old Testament */}
        {oldTestamentBooks.length > 0 && (
          <div className="p-2">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 px-4 py-2">
              Old Testament
            </h3>
            <div className="grid grid-cols-1 gap-1">
              {oldTestamentBooks.map((book) => (
                <button
                  key={book.id}
                  onClick={() => onSelect(book)}
                  className={`
                    text-left px-4 py-2 rounded-lg transition-colors
                    ${selectedBook?.id === book.id
                      ? 'bg-blue-500 text-white'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }
                  `}
                >
                  {book.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* New Testament */}
        {newTestamentBooks.length > 0 && (
          <div className="p-2">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 px-4 py-2">
              New Testament
            </h3>
            <div className="grid grid-cols-1 gap-1">
              {newTestamentBooks.map((book) => (
                <button
                  key={book.id}
                  onClick={() => onSelect(book)}
                  className={`
                    text-left px-4 py-2 rounded-lg transition-colors
                    ${selectedBook?.id === book.id
                      ? 'bg-blue-500 text-white'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }
                  `}
                >
                  {book.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* No results */}
        {filteredBooks.length === 0 && (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            No books found
          </div>
        )}
      </div>
    </div>
  );
} 
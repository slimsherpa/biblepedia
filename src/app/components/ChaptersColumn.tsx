'use client';

import { useState, useEffect } from 'react';
import { fetchChapters } from '@/lib/api/bibleApi';
import { getErrorMessage } from '@/lib/utils/errorHandling';
import { motion } from 'framer-motion';

interface Chapter {
  number: number;
}

interface ChaptersColumnProps {
  version: string;
  book: string | null;
  selectedChapter: number | null;
  onSelectChapter: (chapter: number) => void;
}

// Default chapters to use if API fails
const DEFAULT_CHAPTERS: Chapter[] = Array.from({ length: 10 }, (_, i) => ({ number: i + 1 }));

export default function ChaptersColumn({ 
  version, 
  book, 
  selectedChapter, 
  onSelectChapter 
}: ChaptersColumnProps) {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadChapters() {
      if (!book) {
        setChapters([]);
        return;
      }

      try {
        setLoading(true);
        const data = await fetchChapters(version, book);
        if (Array.isArray(data) && data.length > 0) {
          setChapters(data);
          setError(null);
        } else {
          console.error('Invalid data format from Bible API:', data);
          setError('Failed to load chapters: Invalid data format');
          setChapters(DEFAULT_CHAPTERS);
        }
      } catch (err) {
        const errorMessage = getErrorMessage(err);
        setError(errorMessage);
        console.error('Error loading chapters:', errorMessage);
        setChapters(DEFAULT_CHAPTERS);
      } finally {
        setLoading(false);
      }
    }

    loadChapters();
  }, [version, book]);

  // Safely render a chapter button
  const renderChapterButton = (chapter: Chapter) => {
    try {
      const number = typeof chapter.number === 'number' ? chapter.number : 0;
      
      return (
        <motion.button
          key={number}
          className={`aspect-square flex items-center justify-center rounded-md border text-sm ${
            selectedChapter === number 
              ? 'bg-blue-100 border-blue-200 font-medium' 
              : 'bg-white hover:bg-blue-50 border-gray-200'
          }`}
          onClick={() => onSelectChapter(number)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {number}
        </motion.button>
      );
    } catch (err) {
      console.error('Error rendering chapter button:', err);
      return null;
    }
  };

  return (
    <div className="w-[50px] min-w-[50px] border-r h-full flex flex-col">
      <div className="p-2 border-b bg-white">
        <h2 className="text-sm font-semibold text-center">Chapters</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto bg-gray-50 p-2">
        {!book ? (
          <div className="flex justify-center items-center h-full text-gray-500 text-xs">
            Select a book
          </div>
        ) : loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-700"></div>
          </div>
        ) : error ? (
          <div className="text-xs text-red-500">{error}</div>
        ) : chapters.length === 0 ? (
          <div className="text-xs text-gray-500">No chapters</div>
        ) : (
          <div className="flex flex-col gap-1">
            {chapters.map(renderChapterButton)}
          </div>
        )}
      </div>
    </div>
  );
} 
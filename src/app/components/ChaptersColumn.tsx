'use client';

import { useState, useEffect } from 'react';
import { fetchChapters } from '@/lib/api/bibleApi';
import { getErrorMessage } from '@/lib/utils/errorHandling';

interface Chapter {
  number: number | 'S';
}

interface ChaptersColumnProps {
  version: string;
  book: string | null;
  selectedChapter: number | 'S' | null;
  onSelectChapter: (chapter: number | 'S') => void;
}

// Default chapters to use if API fails
const DEFAULT_CHAPTERS: Chapter[] = [
  { number: 'S' },
  ...Array.from({ length: 10 }, (_, i) => ({ number: i + 1 }))
];

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
          // Add summary chapter 'S' at the beginning
          setChapters([{ number: 'S' }, ...data]);
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

  return (
    <div className="w-[75px] min-w-[75px] border-r h-full flex flex-col bg-white">
      <div className="p-2 border-b bg-white">
        <h2 className="text-sm font-semibold text-gray-900 font-sans">Chapters</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto bg-white custom-scrollbar">
        {!book ? (
          <div className="flex justify-center items-center h-full text-gray-500 text-sm font-sans">
            Select a book
          </div>
        ) : loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-700"></div>
          </div>
        ) : error ? (
          <div className="text-sm text-red-500 font-sans p-2">{error}</div>
        ) : chapters.length === 0 ? (
          <div className="text-sm text-gray-500 font-sans p-2">No chapters</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {chapters.map((chapter) => (
              <button
                key={chapter.number}
                className={`w-full py-2 px-3 text-center transition-all duration-200 transform hover:scale-[1.01] active:scale-[0.99] font-sans text-sm ${
                  selectedChapter === chapter.number
                    ? 'bg-blue-50 text-blue-700 font-medium' 
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
                onClick={() => onSelectChapter(chapter.number)}
              >
                {chapter.number}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 
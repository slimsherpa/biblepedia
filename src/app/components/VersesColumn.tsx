'use client';

import { useState, useEffect } from 'react';
import { fetchVerses } from '@/lib/api/bibleApi';
import { getErrorMessage } from '@/lib/utils/errorHandling';
import { motion } from 'framer-motion';

interface Verse {
  number: number;
  text: string;
}

interface VersesColumnProps {
  version: string;
  book: string | null;
  chapter: number | null;
  selectedVerse: number | null;
  onSelectVerse: (verse: number) => void;
}

// Default verses to use if API fails
const DEFAULT_VERSES: Verse[] = Array.from({ length: 10 }, (_, i) => ({ 
  number: i + 1, 
  text: `This is placeholder text for verse ${i + 1}.` 
}));

export default function VersesColumn({ 
  version, 
  book, 
  chapter, 
  selectedVerse, 
  onSelectVerse 
}: VersesColumnProps) {
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Mock data for verses with commentary
  const versesWithCommentary = [1, 5, 10, 15, 20, 25];

  useEffect(() => {
    async function loadVerses() {
      if (!book || !chapter) {
        setVerses([]);
        return;
      }

      try {
        setLoading(true);
        const data = await fetchVerses(version, book, chapter);
        if (Array.isArray(data) && data.length > 0) {
          setVerses(data);
          setError(null);
        } else {
          console.error('Invalid data format from Bible API:', data);
          setError('Failed to load verses: Invalid data format');
          setVerses(DEFAULT_VERSES);
        }
      } catch (err) {
        const errorMessage = getErrorMessage(err);
        setError(errorMessage);
        console.error('Error loading verses:', errorMessage);
        setVerses(DEFAULT_VERSES);
      } finally {
        setLoading(false);
      }
    }

    loadVerses();
  }, [version, book, chapter]);

  // Safely render a verse button
  const renderVerseButton = (verse: Verse) => {
    try {
      const number = typeof verse.number === 'number' ? verse.number : 0;
      const text = typeof verse.text === 'string' ? verse.text : 'No text available';
      
      return (
        <motion.button
          key={number}
          className={`w-full text-left p-2 hover:bg-blue-50 transition-colors flex items-start ${
            selectedVerse === number ? 'bg-blue-100' : ''
          }`}
          onClick={() => onSelectVerse(number)}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          <span className={`mr-2 font-semibold text-sm ${
            versesWithCommentary.includes(number) 
              ? 'text-blue-600' 
              : 'text-gray-500'
          }`}>
            {number}
            {versesWithCommentary.includes(number) && (
              <span className="ml-1 text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded-full">
                ✓
              </span>
            )}
          </span>
          <span className="text-sm">{text}</span>
        </motion.button>
      );
    } catch (err) {
      console.error('Error rendering verse button:', err);
      return null;
    }
  };

  return (
    <div className="flex-1 w-1/2 border-r h-full flex flex-col">
      <div className="p-2 border-b bg-white">
        <h2 className="text-sm font-semibold">Verses</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto bg-gray-50">
        {!book || !chapter ? (
          <div className="flex justify-center items-center h-full text-gray-500 text-sm">
            Select a chapter to view verses
          </div>
        ) : loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-700"></div>
          </div>
        ) : error ? (
          <div className="p-2 text-sm text-red-500">{error}</div>
        ) : verses.length === 0 ? (
          <div className="p-2 text-sm text-gray-500">No verses available</div>
        ) : (
          <div className="divide-y">
            {verses.map(renderVerseButton)}
          </div>
        )}
      </div>
    </div>
  );
} 
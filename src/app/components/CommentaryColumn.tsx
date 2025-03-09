'use client';

import { useState, useEffect } from 'react';
import { fetchVerse } from '@/lib/api/bibleApi';
import { getErrorMessage } from '@/lib/utils/errorHandling';
import { motion } from 'framer-motion';

interface CommentaryColumnProps {
  version: string;
  book: string | null;
  chapter: number | null;
  verse: number | null;
}

export default function CommentaryColumn({ 
  version, 
  book, 
  chapter, 
  verse 
}: CommentaryColumnProps) {
  const [verseText, setVerseText] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadVerse() {
      if (!book || !chapter || !verse) {
        setVerseText('');
        return;
      }

      try {
        setLoading(true);
        const data = await fetchVerse(version, book, chapter, verse);
        if (data && typeof data.text === 'string') {
          setVerseText(data.text);
          setError(null);
        } else {
          console.error('Invalid data format from Bible API:', data);
          setError('Failed to load verse: Invalid data format');
          setVerseText(`This is placeholder text for ${book} ${chapter}:${verse}.`);
        }
      } catch (err) {
        const errorMessage = getErrorMessage(err);
        setError(errorMessage);
        console.error('Error loading verse:', errorMessage);
        setVerseText(`This is placeholder text for ${book} ${chapter}:${verse}.`);
      } finally {
        setLoading(false);
      }
    }

    loadVerse();
  }, [version, book, chapter, verse]);

  // Format the book name for display (capitalize first letter)
  const formatBookName = (bookName: string | null) => {
    if (!bookName) return '';
    try {
      return bookName.charAt(0).toUpperCase() + bookName.slice(1);
    } catch (err) {
      console.error('Error formatting book name:', err);
      return bookName || '';
    }
  };

  // Safely render the commentary content
  const renderCommentaryContent = () => {
    try {
      return (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h3 className="text-xl font-biblepedia font-semibold text-blue-900 mb-4">
            {formatBookName(book)} {chapter}{verse ? `:${verse}` : ''}
          </h3>
          
          <div className="space-y-6">
            {/* Chapter Overview */}
            {!verse && (
              <div className="bg-white rounded-lg border p-4 shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold mr-3">
                    C
                  </div>
                  <div>
                    <h4 className="font-medium">Chapter Overview</h4>
                    <p className="text-sm text-gray-500">Historical and Cultural Context</p>
                  </div>
                </div>
                <div className="prose prose-sm max-w-none">
                  <p>This chapter provides important context about [chapter theme]. Key events include...</p>
                  <button className="mt-4 text-blue-600 hover:text-blue-800 font-medium text-sm">
                    + Add Chapter Commentary
                  </button>
                </div>
              </div>
            )}

            {/* Verse Commentary */}
            {verse && (
              <div className="bg-white rounded-lg border p-4 shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold mr-3">
                    D
                  </div>
                  <div>
                    <h4 className="font-medium">Dr. Dan McClellan</h4>
                    <p className="text-sm text-gray-500">Biblical Scholar, Ph.D. in Theology</p>
                  </div>
                </div>
                <div className="prose prose-sm max-w-none">
                  <p>{verseText}</p>
                  <div className="mt-4 space-y-2">
                    <h5 className="font-medium">Commentary:</h5>
                    <p>This verse demonstrates...</p>
                    <button className="text-blue-600 hover:text-blue-800 font-medium text-sm">
                      + Add Verse Commentary
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Cross References */}
            <div className="bg-white rounded-lg border p-4 shadow-sm">
              <h4 className="font-medium mb-3">Cross References</h4>
              <ul className="space-y-2 text-blue-600 hover:text-blue-800 cursor-pointer">
                <li className="flex items-center">
                  <span className="mr-2">→</span> Matthew 5:17
                </li>
                <li className="flex items-center">
                  <span className="mr-2">→</span> Romans 8:28
                </li>
              </ul>
            </div>
          </div>
        </motion.div>
      );
    } catch (err) {
      console.error('Error rendering commentary content:', err);
      return null;
    }
  };

  return (
    <div className="flex-1 h-full flex flex-col bg-white">
      <div className="p-2 border-b bg-white">
        <h2 className="text-sm font-semibold text-gray-900 font-sans">Commentary</h2>
      </div>
      
      <div className="commentary-container">
        {!book || !chapter ? (
          <div className="flex justify-center items-center h-full text-gray-500 text-sm font-sans">
            Select a verse to view commentary
          </div>
        ) : loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-700"></div>
          </div>
        ) : error ? (
          <div className="text-sm text-red-500 font-sans">{error}</div>
        ) : (
          <div className="space-y-6">
            {/* Verse Text */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-500 font-sans mb-2">
                {formatBookName(book)} {chapter}:{verse}
              </div>
              <div className="text-sm font-sans">
                {verseText}
              </div>
            </div>

            {/* Scholar Commentary */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-medium">
                  D
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">Dr. Dan McClellan</div>
                  <div className="text-xs text-gray-500">Biblical Scholar, Ph.D. in Theology</div>
                </div>
              </div>
              
              <div className="text-sm text-gray-700 leading-relaxed">
                This verse demonstrates important theological concepts...
              </div>
            </div>

            {/* Cross References */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">Cross References</h3>
              <div className="space-y-2">
                <button className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-2">
                  <span>→</span>
                  <span>Matthew 5:17</span>
                </button>
                <button className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-2">
                  <span>→</span>
                  <span>Romans 8:28</span>
                </button>
              </div>
            </div>

            {/* Add Commentary Button */}
            <button className="w-full py-2 px-4 border border-blue-600 text-blue-600 hover:bg-blue-50 rounded-md text-sm font-medium transition-colors">
              + Add Commentary
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 
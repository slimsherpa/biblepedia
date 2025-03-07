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
          <h3 className="text-xl font-serif font-semibold text-blue-900 mb-4">
            {formatBookName(book)} {chapter}:{verse}
          </h3>
          
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
            
            <div className="prose prose-blue">
              <p>
                Dan can say whatever he wants here. This is a placeholder for scholarly commentary on this verse.
              </p>
              
              <p>
                The commentary would include historical context, linguistic analysis, theological interpretations,
                and cross-references to other relevant passages.
              </p>
              
              <h4>Historical Context</h4>
              <p>
                Understanding the historical and cultural setting of this passage helps illuminate its original meaning
                and significance to its first audience.
              </p>
              
              <h4>Linguistic Analysis</h4>
              <p>
                The original Hebrew/Greek terms used here carry nuanced meanings that enrich our understanding
                beyond what is apparent in translation.
              </p>
              
              <h4>Theological Significance</h4>
              <p>
                This passage contributes to broader biblical themes and has been interpreted in various ways
                throughout church history.
              </p>
            </div>
          </div>
        </motion.div>
      );
    } catch (err) {
      console.error('Error rendering commentary content:', err);
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <h2 className="text-lg font-semibold text-red-700 mb-2">Error displaying commentary</h2>
          <p className="text-red-600">There was an error rendering the commentary content.</p>
        </div>
      );
    }
  };

  return (
    <div className="flex-1 w-1/2 h-full flex flex-col">
      <div className="p-2 border-b bg-white">
        <h2 className="text-sm font-semibold">Commentary</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto bg-white p-4">
        {!book || !chapter || !verse ? (
          <div className="flex flex-col justify-center items-center h-full text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <p className="text-sm">Select a verse to view scholarly commentary</p>
          </div>
        ) : loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-700"></div>
          </div>
        ) : error ? (
          <div className="text-red-500 text-sm">{error}</div>
        ) : (
          renderCommentaryContent()
        )}
      </div>
    </div>
  );
} 
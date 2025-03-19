'use client';

import { useState, useEffect } from 'react';
import { getVerseCommentary } from '@/lib/firebase/verseManagement';

interface VersesColumnProps {
  version: string;
  book: string | null;
  chapter: number | 'S' | null;
  selectedVerse: number | 'S' | null;
  onSelectVerse: (verse: number | 'S') => void;
  verses: { number: number | 'S'; content: string; reference: string }[];
  loading: boolean;
  error: string | null;
}

interface Verse {
  number: number | 'S';
  text: string;
  reference: string;
  hasCommentary?: boolean;
}

// Default verses to use if API fails
const DEFAULT_VERSES: Verse[] = [
  { number: 'S', text: 'Summary text summary text summary text summary text', reference: 'DEFAULT.1.S' },
  ...Array.from({ length: 10 }, (_, i) => ({ 
    number: i + 1, 
    text: `This is placeholder text for verse ${i + 1}.`,
    reference: `DEFAULT.1.${i + 1}`
  }))
];

export default function VersesColumn({ 
  version, 
  book, 
  chapter, 
  selectedVerse, 
  onSelectVerse,
  verses: incomingVerses,
  loading,
  error: incomingError
}: VersesColumnProps) {
  const [error, setError] = useState<string | null>(null);
  const [versesWithCommentary, setVersesWithCommentary] = useState<Verse[]>([]);

  // Process verses to add commentary status
  useEffect(() => {
    let isCancelled = false;

    async function addCommentaryStatus() {
      console.log('Processing verses:', { incomingVerses, chapter });
      
      // Clear verses immediately
      setVersesWithCommentary([]);

      if (!incomingVerses.length || !book || !chapter) {
        return;
      }

      try {
        const processed = await Promise.all(
          incomingVerses.map(async (verse) => {
            // Use the provided reference or generate one
            const reference = verse.reference || `${book.toUpperCase()}.${chapter}.${verse.number}`;
            const hasCommentary = await getVerseCommentary(reference) !== null;
            
            return {
              number: verse.number,
              text: verse.content,
              reference,
              hasCommentary
            } as Verse;
          })
        );

        if (!isCancelled) {
          console.log('Setting processed verses:', processed.length);
          setVersesWithCommentary(processed);
        }
      } catch (err) {
        console.error('Error processing verses:', err);
      }
    }

    addCommentaryStatus();

    return () => {
      isCancelled = true;
    };
  }, [incomingVerses, book, chapter]);

  useEffect(() => {
    setError(incomingError);
  }, [incomingError]);

  return (
    <div className="flex-1 border-r h-full flex flex-col bg-white">
      <div className="p-2 border-b bg-white">
        <h2 className="text-sm font-semibold text-gray-900 font-sans">Verses</h2>
      </div>
      
      <div className="verses-container overflow-y-auto">
        {!book || !chapter ? (
          <div className="flex justify-center items-center h-full text-gray-500 text-sm font-sans">
            Select a chapter
          </div>
        ) : loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-700"></div>
          </div>
        ) : error ? (
          <div className="text-sm text-red-500 font-sans">{error}</div>
        ) : versesWithCommentary.length === 0 ? (
          <div className="text-sm text-gray-500 font-sans">No verses available</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {versesWithCommentary.map((verse) => (
              <button
                key={verse.reference}
                className={`w-full py-2 px-3 text-left transition-all duration-200 transform hover:scale-[1.01] active:scale-[0.99] font-sans text-sm flex items-start group ${
                  selectedVerse === verse.number
                    ? 'bg-blue-50 text-blue-700 font-medium' 
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
                onClick={() => onSelectVerse(verse.number)}
              >
                <span className={`mr-3 font-medium ${
                  selectedVerse === verse.number 
                    ? 'text-blue-700' 
                    : verse.number === 'S'
                    ? 'text-green-600'
                    : 'text-gray-500 group-hover:text-gray-700'
                }`}>
                  {verse.number === 'S' ? 'S' : verse.number}
                </span>
                <span className="flex-1">{verse.text}</span>
                {verse.hasCommentary && (
                  <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full flex-shrink-0">
                    ✓
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 
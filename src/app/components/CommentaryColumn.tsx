'use client';

import { useState, useEffect } from 'react';
import { fetchVerse, BIBLE_VERSIONS } from '@/lib/api/bibleApi';
import { getErrorMessage } from '@/lib/utils/errorHandling';
import { motion } from 'framer-motion';
import VerseCommentaryDisplay from './VerseCommentaryDisplay';

interface CommentaryColumnProps {
  version: string;
  book: string | null;
  chapter: number | null;
  verse: number | null;
}

interface VerseData {
  version: string;
  displayName: string;
  text: string;
  language: string;
  type: 'modern' | 'classical' | 'original';
}

// Extend the BibleVersion interface from bibleApi.ts
interface ExtendedBibleVersion {
  id: string;
  name: string;
  abbreviation: string;
  language: string;
  isSupported: boolean;
  type: 'modern' | 'classical' | 'original';
  displayName: string;
}

// Map the API versions to our extended version with type and display info
const EXTENDED_VERSIONS: ExtendedBibleVersion[] = BIBLE_VERSIONS.map(v => ({
  ...v,
  type: v.language === 'en' ? 
        (v.id === '9879dbb7cfe39e4d-01' ? 'modern' : 'classical') :
        'original',
  displayName: v.name
}));

// Helper function to determine original language
function getOriginalLanguage(book: string): string {
  // Map of abbreviated book names to full names
  const bookAbbreviations: Record<string, string> = {
    // Old Testament
    'GEN': 'genesis',
    'EXO': 'exodus',
    'LEV': 'leviticus',
    'NUM': 'numbers',
    'DEU': 'deuteronomy',
    'JOS': 'joshua',
    'JDG': 'judges',
    'RUT': 'ruth',
    '1SA': '1samuel',
    '2SA': '2samuel',
    '1KI': '1kings',
    '2KI': '2kings',
    '1CH': '1chronicles',
    '2CH': '2chronicles',
    'EZR': 'ezra',
    'NEH': 'nehemiah',
    'EST': 'esther',
    'JOB': 'job',
    'PSA': 'psalms',
    'PRO': 'proverbs',
    'ECC': 'ecclesiastes',
    'SNG': 'songofsolomon',
    'ISA': 'isaiah',
    'JER': 'jeremiah',
    'LAM': 'lamentations',
    'EZK': 'ezekiel',
    'DAN': 'daniel',
    'HOS': 'hosea',
    'JOL': 'joel',
    'AMO': 'amos',
    'OBA': 'obadiah',
    'JON': 'jonah',
    'MIC': 'micah',
    'NAM': 'nahum',
    'HAB': 'habakkuk',
    'ZEP': 'zephaniah',
    'HAG': 'haggai',
    'ZEC': 'zechariah',
    'MAL': 'malachi',
    // New Testament
    'MAT': 'matthew',
    'MRK': 'mark',
    'LUK': 'luke',
    'JHN': 'john',
    'ACT': 'acts',
    'ROM': 'romans',
    '1CO': '1corinthians',
    '2CO': '2corinthians',
    'GAL': 'galatians',
    'EPH': 'ephesians',
    'PHP': 'philippians',
    'COL': 'colossians',
    '1TH': '1thessalonians',
    '2TH': '2thessalonians',
    '1TI': '1timothy',
    '2TI': '2timothy',
    'TIT': 'titus',
    'PHM': 'philemon',
    'HEB': 'hebrews',
    'JAS': 'james',
    '1PE': '1peter',
    '2PE': '2peter',
    '1JN': '1john',
    '2JN': '2john',
    '3JN': '3john',
    'JUD': 'jude',
    'REV': 'revelation'
  };

  const hebrewBooks = ['genesis', 'exodus', 'leviticus', 'numbers', 'deuteronomy', 'joshua', 'judges', 'ruth', '1samuel', '2samuel', '1kings', '2kings', '1chronicles', '2chronicles', 'ezra', 'nehemiah', 'esther', 'job', 'psalms', 'proverbs', 'ecclesiastes', 'songofsolomon', 'isaiah', 'jeremiah', 'lamentations', 'ezekiel', 'daniel', 'hosea', 'joel', 'amos', 'obadiah', 'jonah', 'micah', 'nahum', 'habakkuk', 'zephaniah', 'haggai', 'zechariah', 'malachi'];
  const aramaicSections = ['ezra', 'daniel']; // Parts of these books
  const greekBooks = ['matthew', 'mark', 'luke', 'john', 'acts', 'romans', '1corinthians', '2corinthians', 'galatians', 'ephesians', 'philippians', 'colossians', '1thessalonians', '2thessalonians', '1timothy', '2timothy', 'titus', 'philemon', 'hebrews', 'james', '1peter', '2peter', '1john', '2john', '3john', 'jude', 'revelation'];
  
  // Convert book name to lowercase and handle both full names and abbreviations
  const normalizedBook = book?.toLowerCase() || '';
  const fullBookName = bookAbbreviations[normalizedBook.toUpperCase()] || normalizedBook;
  
  console.log('Normalized book name:', {
    original: book,
    normalized: normalizedBook,
    full: fullBookName
  });
  
  if (hebrewBooks.includes(fullBookName)) {
    if (aramaicSections.includes(fullBookName)) {
      return 'Hebrew and Aramaic';
    }
    return 'Hebrew';
  }
  if (greekBooks.includes(fullBookName)) {
    return 'Greek';
  }
  return 'Unknown';
}

// Helper function to check if a version is available
function isVersionAvailable(version: ExtendedBibleVersion): boolean {
  return true; // All versions in BIBLE_VERSIONS are immediately available
}

// Helper function to get available versions based on book
function getAvailableVersions(book: string): ExtendedBibleVersion[] {
  const language = getOriginalLanguage(book);
  
  // Start with modern and classical versions
  const baseVersions = EXTENDED_VERSIONS.filter(v => 
    v.language === 'en'
  );
  
  // Add appropriate original language versions
  const originalVersions = EXTENDED_VERSIONS.filter(v => {
    if (language === 'Hebrew' || language === 'Hebrew and Aramaic') {
      return v.language === 'heb';
    } else if (language === 'Greek') {
      return v.language === 'grc';
    }
    return false;
  });
  
  return [...baseVersions, ...originalVersions];
}

export default function CommentaryColumn({ 
  version, 
  book, 
  chapter, 
  verse 
}: CommentaryColumnProps) {
  const [verses, setVerses] = useState<VerseData[]>([]);
  const [showAllTranslations, setShowAllTranslations] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadVerse() {
      if (!book || !chapter || !verse) {
        setVerses([]);
        return;
      }

      try {
        setLoading(true);
        
        // Get available versions for this book
        const availableVersions = getAvailableVersions(book);
        console.log('Available versions for fetching:', availableVersions);
        
        // Always fetch current version first
        const currentVersion = availableVersions.find(v => v.id === version) || availableVersions[0];
        if (!currentVersion) {
          throw new Error('Current version not found');
        }
        
        const currentData = await fetchVerse(currentVersion.id, book, chapter, verse);
        let verses: VerseData[] = [{
          version: currentVersion.abbreviation,
          displayName: currentVersion.displayName,
          text: currentData.text,
          language: currentVersion.language,
          type: currentVersion.type
        }];
        
        // If showing all translations, fetch the rest
        if (showAllTranslations) {
          const otherVersionPromises = availableVersions
            .filter(v => v.id !== currentVersion.id)
            .map(async (v) => {
              try {
                const data = await fetchVerse(v.id, book, chapter, verse);
                return {
                  version: v.abbreviation,
                  displayName: v.displayName,
                  text: data.text,
                  language: v.language,
                  type: v.type
                };
              } catch (err) {
                console.error(`Error fetching version ${v.name}:`, err);
                return null;
              }
            });

          const results = await Promise.all(otherVersionPromises);
          const successfulResults = results.filter((v): v is VerseData => v !== null);
          verses = [...verses, ...successfulResults];
        }
        
        // Sort verses by type: modern -> classical -> original
        verses.sort((a, b) => {
          const typeOrder = { modern: 0, classical: 1, original: 2 };
          return typeOrder[a.type] - typeOrder[b.type];
        });
        
        setVerses(verses);
        setError(null);
      } catch (err) {
        const errorMessage = getErrorMessage(err);
        setError(errorMessage);
        console.error('Error loading verse:', errorMessage);
      } finally {
        setLoading(false);
      }
    }

    loadVerse();
  }, [version, book, chapter, verse, showAllTranslations]);

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

  return (
    <div className="flex-1 h-full flex flex-col bg-white">
      <div className="p-2 border-b bg-white">
        <h2 className="text-sm font-semibold text-gray-900 font-sans">Commentary</h2>
      </div>
      
      <div className="commentary-container overflow-y-auto">
        {!book || !chapter || !verse ? (
          <div className="flex justify-center items-center h-full text-gray-500 text-sm font-sans">
            Select a verse to view commentary
          </div>
        ) : loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-700"></div>
          </div>
        ) : error ? (
          <div className="text-sm text-red-500 font-sans p-4">{error}</div>
        ) : (
          <div className="p-4">
            {/* Translations Section */}
            <div className="space-y-4 mb-8">
              {verses.map((verseData, index) => (
                <motion.div
                  key={verseData.version}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className={`rounded-lg p-4 ${
                    verseData.type === 'original' 
                      ? 'bg-blue-50' 
                      : verseData.type === 'classical'
                      ? 'bg-gray-50'
                      : 'bg-white border border-gray-200'
                  }`}
                >
                  <div className="text-sm text-gray-500 font-sans mb-2 flex justify-between items-center">
                    <span>{formatBookName(book)} {chapter}:{verse}</span>
                    <div className="flex items-center gap-2">
                      {verseData.type === 'original' && (
                        <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                          {verseData.language === 'heb' ? 'Hebrew' : 'Greek'}
                        </span>
                      )}
                      <span className="text-blue-600 font-medium">{verseData.displayName}</span>
                    </div>
                  </div>
                  <div className="text-sm font-sans">
                    {verseData.text}
                  </div>
                </motion.div>
              ))}
              
              {!showAllTranslations && (
                <button 
                  onClick={() => setShowAllTranslations(true)}
                  className="w-full py-2 px-4 border border-blue-600 text-blue-600 hover:bg-blue-50 rounded-md text-sm font-medium transition-colors"
                >
                  SEE ADDITIONAL TRANSLATIONS
                </button>
              )}
            </div>

            {/* Commentary Section */}
            <VerseCommentaryDisplay verseId={`${book?.toUpperCase()}.${chapter}.${verse}`} />
          </div>
        )}
      </div>
    </div>
  );
} 
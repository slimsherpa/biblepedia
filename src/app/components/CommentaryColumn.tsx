'use client';

import { useState, useEffect } from 'react';
import { fetchVerse, BIBLE_VERSIONS } from '@/lib/api/bibleApi';
import { getErrorMessage } from '@/lib/utils/errorHandling';
import VerseCommentaryDisplay from './VerseCommentaryDisplay';

interface CommentaryColumnProps {
  version: string;
  book: string | null;
  chapter: number | 'S' | null;
  verse: number | 'S' | null;
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
    'GEN': 'genesis', 'EXO': 'exodus', 'LEV': 'leviticus', 'NUM': 'numbers',
    'DEU': 'deuteronomy', 'JOS': 'joshua', 'JDG': 'judges', 'RUT': 'ruth',
    '1SA': '1samuel', '2SA': '2samuel', '1KI': '1kings', '2KI': '2kings',
    '1CH': '1chronicles', '2CH': '2chronicles', 'EZR': 'ezra', 'NEH': 'nehemiah',
    'EST': 'esther', 'JOB': 'job', 'PSA': 'psalms', 'PRO': 'proverbs',
    'ECC': 'ecclesiastes', 'SNG': 'songofsolomon', 'ISA': 'isaiah', 'JER': 'jeremiah',
    'LAM': 'lamentations', 'EZK': 'ezekiel', 'DAN': 'daniel', 'HOS': 'hosea',
    'JOL': 'joel', 'AMO': 'amos', 'OBA': 'obadiah', 'JON': 'jonah',
    'MIC': 'micah', 'NAM': 'nahum', 'HAB': 'habakkuk', 'ZEP': 'zephaniah',
    'HAG': 'haggai', 'ZEC': 'zechariah', 'MAL': 'malachi',
    // New Testament
    'MAT': 'matthew', 'MRK': 'mark', 'LUK': 'luke', 'JHN': 'john',
    'ACT': 'acts', 'ROM': 'romans', '1CO': '1corinthians', '2CO': '2corinthians',
    'GAL': 'galatians', 'EPH': 'ephesians', 'PHP': 'philippians', 'COL': 'colossians',
    '1TH': '1thessalonians', '2TH': '2thessalonians', '1TI': '1timothy', '2TI': '2timothy',
    'TIT': 'titus', 'PHM': 'philemon', 'HEB': 'hebrews', 'JAS': 'james',
    '1PE': '1peter', '2PE': '2peter', '1JN': '1john', '2JN': '2john',
    '3JN': '3john', 'JUD': 'jude', 'REV': 'revelation'
  };

  const hebrewBooks = ['genesis', 'exodus', 'leviticus', 'numbers', 'deuteronomy', 'joshua', 'judges', 'ruth', '1samuel', '2samuel', '1kings', '2kings', '1chronicles', '2chronicles', 'ezra', 'nehemiah', 'esther', 'job', 'psalms', 'proverbs', 'ecclesiastes', 'songofsolomon', 'isaiah', 'jeremiah', 'lamentations', 'ezekiel', 'daniel', 'hosea', 'joel', 'amos', 'obadiah', 'jonah', 'micah', 'nahum', 'habakkuk', 'zephaniah', 'haggai', 'zechariah', 'malachi'];
  const aramaicSections = ['ezra', 'daniel']; // Parts of these books
  const greekBooks = ['matthew', 'mark', 'luke', 'john', 'acts', 'romans', '1corinthians', '2corinthians', 'galatians', 'ephesians', 'philippians', 'colossians', '1thessalonians', '2thessalonians', '1timothy', '2timothy', 'titus', 'philemon', 'hebrews', 'james', '1peter', '2peter', '1john', '2john', '3john', 'jude', 'revelation'];
  
  // Convert book name to lowercase and handle both full names and abbreviations
  const normalizedBook = book?.toLowerCase() || '';
  const fullBookName = bookAbbreviations[normalizedBook.toUpperCase()] || normalizedBook;
  
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

// Helper function to get available versions based on book
function getAvailableVersions(book: string): ExtendedBibleVersion[] {
  const language = getOriginalLanguage(book);
  
  // Get English versions
  const englishVersions = EXTENDED_VERSIONS.filter(v => v.language === 'en');
  
  // Get original language versions based on the book
  const originalVersions = EXTENDED_VERSIONS.filter(v => {
    if (language === 'Hebrew' || language === 'Hebrew and Aramaic') {
      return v.language === 'heb';
    } else if (language === 'Greek') {
      return v.language === 'grc';
    }
    return false;
  });
  
  // Return versions in order: modern English, classical English, original language
  return [
    ...englishVersions.filter(v => v.type === 'modern'),
    ...englishVersions.filter(v => v.type === 'classical'),
    ...originalVersions
  ];
}

export default function CommentaryColumn({ 
  version, 
  book, 
  chapter, 
  verse 
}: CommentaryColumnProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verseData, setVerseData] = useState<VerseData[]>([]);
  const [showAllTranslations, setShowAllTranslations] = useState(true); // Always show all translations

  useEffect(() => {
    async function loadVerseData() {
      if (!book || !chapter || !verse || chapter === 'S' || verse === 'S') {
        setVerseData([]);
        return;
      }

      setLoading(true);
      try {
        // Get appropriate versions for this book
        const versionsToLoad = getAvailableVersions(book);

        const versePromises = versionsToLoad.map(async (v) => {
          try {
            const data = await fetchVerse(v.id, book, chapter, verse);
            return {
              version: v.id,
              displayName: v.displayName,
              text: data.text,
              language: v.language,
              type: v.type
            };
          } catch (err) {
            console.error(`Error loading verse for version ${v.id}:`, err);
            return null;
          }
        });

        const results = await Promise.all(versePromises);
        const validResults = results.filter((r): r is VerseData => r !== null);
        
        // Group and sort translations
        const groupedResults = {
          modern: validResults.filter(r => r.type === 'modern'),
          classical: validResults.filter(r => r.type === 'classical'),
          original: validResults.filter(r => r.type === 'original')
        };
        
        // Combine in preferred order
        const sortedResults = [
          ...groupedResults.modern,
          ...groupedResults.classical,
          ...groupedResults.original
        ];
        
        setVerseData(sortedResults);
        setError(null);
      } catch (err) {
        const errorMessage = getErrorMessage(err);
        setError(errorMessage);
        console.error('Error loading verse data:', errorMessage);
      } finally {
        setLoading(false);
      }
    }

    loadVerseData();
  }, [book, chapter, verse, version]);

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
        ) : chapter === 'S' || verse === 'S' ? (
          <div className="p-4">
            <VerseCommentaryDisplay
              book={book}
              chapter={typeof chapter === 'number' ? chapter : 0}
              verse={typeof verse === 'number' ? verse : 0}
              verseText="Summary text"
              isSummary={true}
              translations={[]}
            />
          </div>
        ) : loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-700"></div>
          </div>
        ) : error ? (
          <div className="text-sm text-red-500 font-sans p-4">{error}</div>
        ) : (
          <div className="p-4">
            <VerseCommentaryDisplay
              book={book}
              chapter={chapter}
              verse={verse}
              verseText={verseData[0]?.text || ''}
              isSummary={false}
              translations={verseData.map(v => ({
                version: v.version,
                text: v.text,
                type: v.type,
                displayName: v.displayName
              }))}
            />
          </div>
        )}
      </div>
    </div>
  );
} 
// Bible version configuration
export interface BibleVersion {
  id: string;
  name: string;
  abbreviation: string;
  language: string;
  isSupported: boolean;
}

export const BIBLE_VERSIONS: BibleVersion[] = [
  { 
    id: '9879dbb7cfe39e4d-01', 
    name: 'New Revised Standard Version', 
    abbreviation: 'NRSV',
    language: 'en',
    isSupported: true
  },
  { 
    id: 'de4e12af7f28f599-01', 
    name: 'King James Version', 
    abbreviation: 'KJV',
    language: 'en',
    isSupported: true
  },
  {
    id: '0b262f1ed7f084a6-01',
    name: 'Hebrew Bible',
    abbreviation: 'WLC',
    language: 'heb',
    isSupported: true
  },
  {
    id: '7644de2e4c5188e5-01',
    name: 'Text-Critical Greek New Testament',
    abbreviation: 'GNT',
    language: 'grc',
    isSupported: true
  },
  {
    id: 'c114c33098c4fef1-01',
    name: 'Brenton Greek Septuagint',
    abbreviation: 'LXX',
    language: 'grc',
    isSupported: true
  }
];

// Default version to use
export const DEFAULT_VERSION = BIBLE_VERSIONS[0].id;

// Cache configuration
export const CACHE_CONFIG = {
  ttl: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  prefix: {
    memory: 'mem:bible:',
    local: 'bible:',
    firestore: 'bible-cache'
  }
};

// Bible version to use
export const BIBLE_VERSION = DEFAULT_VERSION;

// Book ID mapping (our format to API format)
export const bookIdMap: Record<string, string> = {
  'genesis': 'GEN',
  'exodus': 'EXO',
  'leviticus': 'LEV',
  'numbers': 'NUM',
  'deuteronomy': 'DEU',
  'joshua': 'JOS',
  'judges': 'JDG',
  'ruth': 'RUT',
  '1 samuel': '1SA',
  '2 samuel': '2SA',
  '1 kings': '1KI',
  '2 kings': '2KI',
  '1 chronicles': '1CH',
  '2 chronicles': '2CH',
  'ezra': 'EZR',
  'nehemiah': 'NEH',
  'esther': 'EST',
  'job': 'JOB',
  'psalms': 'PSA',
  'proverbs': 'PRO',
  'ecclesiastes': 'ECC',
  'song of solomon': 'SNG',
  'isaiah': 'ISA',
  'jeremiah': 'JER',
  'lamentations': 'LAM',
  'ezekiel': 'EZK',
  'daniel': 'DAN',
  'hosea': 'HOS',
  'joel': 'JOL',
  'amos': 'AMO',
  'obadiah': 'OBA',
  'jonah': 'JON',
  'micah': 'MIC',
  'nahum': 'NAM',
  'habakkuk': 'HAB',
  'zephaniah': 'ZEP',
  'haggai': 'HAG',
  'zechariah': 'ZEC',
  'malachi': 'MAL',
  'matthew': 'MAT',
  'mark': 'MRK',
  'luke': 'LUK',
  'john': 'JHN',
  'acts': 'ACT',
  'romans': 'ROM',
  '1 corinthians': '1CO',
  '2 corinthians': '2CO',
  'galatians': 'GAL',
  'ephesians': 'EPH',
  'philippians': 'PHP',
  'colossians': 'COL',
  '1 thessalonians': '1TH',
  '2 thessalonians': '2TH',
  '1 timothy': '1TI',
  '2 timothy': '2TI',
  'titus': 'TIT',
  'philemon': 'PHM',
  'hebrews': 'HEB',
  'james': 'JAS',
  '1 peter': '1PE',
  '2 peter': '2PE',
  '1 john': '1JN',
  '2 john': '2JN',
  '3 john': '3JN',
  'jude': 'JUD',
  'revelation': 'REV'
};

// Helper functions for API ID formatting
export function getApiBookId(bookName: string): string | null {
  const lowercaseBook = bookName.toLowerCase();
  return bookIdMap[lowercaseBook] || null;
}

export function getApiChapterId(bookId: string, chapter: number): string {
  return `${bookId}.${chapter}`;
}

export function getApiVerseId(bookId: string, chapter: number, verse: number): string {
  return `${bookId}.${chapter}.${verse}`;
}

// API URL helpers
export function getBooksUrl(bibleId: string = BIBLE_VERSION): string {
  return `bibles/${bibleId}/books`;
}

export function getChaptersUrl(bibleId: string, bookId: string): string {
  return `bibles/${bibleId}/books/${bookId}/chapters`;
}

export function getVersesUrl(bibleId: string, chapterId: string): string {
  return `bibles/${bibleId}/chapters/${chapterId}/verses`;
}

export function getVerseUrl(bibleId: string, verseId: string): string {
  return `bibles/${bibleId}/verses/${verseId}`;
} 
export const BASE_URL = '/api/bible';

export const endpoints = {
  books: (version: string) => `/bibles/${version}/books`,
  chapters: (version: string, bookId: string) => `/bibles/${version}/books/${bookId}/chapters`,
  verses: (version: string, chapterId: string) => `/bibles/${version}/chapters/${chapterId}/verses?include-notes=false&include-titles=true&include-chapter-numbers=false&include-verse-numbers=true&include-verse-spans=false`,
  verse: (version: string, reference: string) => `/bibles/${version}/verses/${reference}`,
  search: (version: string, query: string) => `/bibles/${version}/search?query=${encodeURIComponent(query)}`
} as const;

export const DEFAULT_VERSION = 'de4e12af7f28f599-01'; // KJV

export function getActualVersionId(version: string): string {
  // Add any version ID mappings here
  const versionMap: Record<string, string> = {
    'KJV': 'de4e12af7f28f599-01',
    'ASV': '06125adad2d5898a-01',
    'WEB': '9879dbb7cfe39e4d-01'
  };

  return versionMap[version] || version;
} 
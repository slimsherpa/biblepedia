'use client';

import { useState, useEffect, useCallback } from 'react';
import { getBooks, getChapters, getVerses, getVerse } from '@/lib/api/bibleApi';
import { BIBLE_VERSIONS } from '@/lib/api/bibleConfig';

interface VerseMetadata {
  id: string;
  orgId: string;
  bookId: string;
  chapterId: string;
  bibleId: string;
  reference: string;
}

interface Verse extends VerseMetadata {
  content: string;
}

export default function DebugPage() {
  const [version] = useState('de4e12af7f28f599-01');
  const [book, setBook] = useState('GEN');
  const [chapter, setChapter] = useState('1');
  const [verses, setVerses] = useState<Verse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadVerses = useCallback(async () => {
    if (!book || !chapter) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // First get list of verses
      const listPath = `/bibles/${version}/chapters/${book}.${chapter}/verses`;
      console.log('Fetching verse list:', { listPath });

      const listResponse = await fetch(`/api/bible?path=${encodeURIComponent(listPath)}`);
      const listText = await listResponse.text();
      console.log('Raw verse list response:', listText);

      const listData = JSON.parse(listText);

      if (!listResponse.ok) {
        throw new Error(listData.error || 'Failed to fetch verses');
      }

      if (!listData.data || !Array.isArray(listData.data)) {
        throw new Error('Invalid response format from API');
      }

      // Define loadVerseContent inside useCallback
      const loadVerseContent = async (verseMetadata: VerseMetadata): Promise<Verse> => {
        const path = `/bibles/${version}/verses/${verseMetadata.id}?content-type=text&include-notes=false&include-verse-numbers=false&include-chapter-numbers=false`;
        const response = await fetch(`/api/bible?path=${encodeURIComponent(path)}`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch verse content');
        }

        // Log the verse data to see its structure
        console.log('Verse data:', data.data);

        return {
          ...verseMetadata,
          content: data.data.content || ''
        };
      };

      // Then get content for each verse
      const versePromises = listData.data.map((verseMetadata: VerseMetadata) => 
        loadVerseContent(verseMetadata)
      );

      console.log('Fetching content for verses...');
      const versesWithContent = await Promise.all(versePromises);
      console.log('Verses with content:', versesWithContent);

      setVerses(versesWithContent);
    } catch (err) {
      console.error('Error loading verses:', err);
      setError(err instanceof Error ? err.message : 'Failed to load verses');
      setVerses([]);
    } finally {
      setLoading(false);
    }
  }, [version, book, chapter]);

  useEffect(() => {
    loadVerses();
  }, [loadVerses]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Bible API Test</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Book</label>
          <select
            value={book}
            onChange={(e) => setBook(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            <option value="GEN">Genesis</option>
            <option value="EXO">Exodus</option>
            <option value="LEV">Leviticus</option>
            {/* Add more books as needed */}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Chapter</label>
          <select
            value={chapter}
            onChange={(e) => setChapter(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            {[...Array(50)].map((_, i) => (
              <option key={i + 1} value={i + 1}>
                Chapter {i + 1}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <h3 className="font-medium mb-2">Verses</h3>
          <div className="space-y-2">
            {verses.map((verse) => (
              <div key={verse.id} className="p-2 bg-white rounded shadow">
                <span className="font-medium text-gray-700">{verse.reference}:</span>{' '}
                <span className="text-gray-900">{verse.content}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded shadow-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-gray-700">Loading verses...</p>
          </div>
        </div>
      )}
    </div>
  );
} 
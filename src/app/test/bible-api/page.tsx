'use client';

import { useState, useEffect } from 'react';
import { getVerses } from '@/lib/firebase/verseManagement';

interface Verse {
  number: number | 'S';
  content: string;
  reference?: string;
}

export default function TestBibleAPI() {
  const [version] = useState('de4e12af7f28f599-01');
  const [book, setBook] = useState('GEN');
  const [chapter, setChapter] = useState('1');
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load verses when chapter changes
  useEffect(() => {
    async function loadVerses() {
      if (!book || !chapter) return;
      
      try {
        setLoading(true);
        const data = await getVerses(version, book, parseInt(chapter));
        setVerses(data);
        setError(null);
      } catch (err) {
        console.error('Error loading verses:', err);
        setError(err instanceof Error ? err.message : 'Failed to load verses');
        setVerses([]);
      } finally {
        setLoading(false);
      }
    }

    loadVerses();
  }, [version, book, chapter]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Bible API Test Page</h1>
      
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
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
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
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
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
              <div key={verse.reference || `${verse.number}`} className="p-2 bg-white rounded shadow">
                <span className="font-medium text-gray-700">
                  {verse.reference || `Verse ${verse.number}`}:
                </span>{' '}
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
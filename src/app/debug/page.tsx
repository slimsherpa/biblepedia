'use client';

import { useState } from 'react';
import { fetchBibleVersions, fetchBooks, fetchChapters, fetchVerses, fetchVerse } from '@/lib/api/bibleApi';

export default function DebugPage() {
  const [version, setVersion] = useState('');
  const [book, setBook] = useState('');
  const [chapter, setChapter] = useState('');
  const [verse, setVerse] = useState('');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testEndpoint = async (endpoint: string) => {
    try {
      setError(null);
      let data;

      switch (endpoint) {
        case 'versions':
          data = await fetchBibleVersions();
          break;
        case 'books':
          if (!version) throw new Error('Version is required');
          data = await fetchBooks(version);
          break;
        case 'chapters':
          if (!version || !book) throw new Error('Version and book are required');
          data = await fetchChapters(version, book);
          break;
        case 'verses':
          if (!version || !book || !chapter) throw new Error('Version, book, and chapter are required');
          data = await fetchVerses(version, book, parseInt(chapter));
          break;
        case 'verse':
          if (!version || !book || !chapter || !verse) throw new Error('Version, book, chapter, and verse are required');
          data = await fetchVerse(version, book, parseInt(chapter), parseInt(verse));
          break;
        default:
          throw new Error('Invalid endpoint');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setResult(null);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Bible API Debug</h1>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Version ID:</label>
          <input
            type="text"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            placeholder="e.g. de4e12af7f28f599-01"
            className="border p-2 rounded w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Book:</label>
          <input
            type="text"
            value={book}
            onChange={(e) => setBook(e.target.value)}
            placeholder="e.g. Genesis"
            className="border p-2 rounded w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Chapter:</label>
          <input
            type="text"
            value={chapter}
            onChange={(e) => setChapter(e.target.value)}
            placeholder="e.g. 1"
            className="border p-2 rounded w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Verse:</label>
          <input
            type="text"
            value={verse}
            onChange={(e) => setVerse(e.target.value)}
            placeholder="e.g. 1"
            className="border p-2 rounded w-full"
          />
        </div>

        <div className="space-x-2">
          <button
            onClick={() => testEndpoint('versions')}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Test Versions
          </button>
          <button
            onClick={() => testEndpoint('books')}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Test Books
          </button>
          <button
            onClick={() => testEndpoint('chapters')}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Test Chapters
          </button>
          <button
            onClick={() => testEndpoint('verses')}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Test Verses
          </button>
          <button
            onClick={() => testEndpoint('verse')}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Test Single Verse
          </button>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {result && (
          <div className="mt-4">
            <h2 className="text-xl font-semibold mb-2">Result:</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
} 
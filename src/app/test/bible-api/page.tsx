'use client';

import { useState, useEffect } from 'react';
import { bibleApi } from '@/lib/api/bibleApi';
import { BibleBook, BibleChapter, BibleVerse } from '@/lib/types/bible';

export default function TestBibleAPI() {
  const [version, setVersion] = useState('KJV');
  const [book, setBook] = useState('GEN');
  const [chapter, setChapter] = useState(1);
  const [books, setBooks] = useState<BibleBook[]>([]);
  const [chapters, setChapters] = useState<BibleChapter[]>([]);
  const [verses, setVerses] = useState<BibleVerse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load books on mount
  useEffect(() => {
    async function loadBooks() {
      try {
        setLoading(true);
        const data = await bibleApi.getBooks(version);
        setBooks(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load books');
      } finally {
        setLoading(false);
      }
    }

    loadBooks();
  }, [version]);

  // Load chapters when book changes
  useEffect(() => {
    async function loadChapters() {
      if (!book) return;
      
      try {
        setLoading(true);
        const data = await bibleApi.getChapters(version, book);
        setChapters(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load chapters');
      } finally {
        setLoading(false);
      }
    }

    loadChapters();
  }, [version, book]);

  // Load verses when chapter changes
  useEffect(() => {
    async function loadVerses() {
      if (!book || !chapter) return;
      
      try {
        setLoading(true);
        const data = await bibleApi.getChapterVerses(version, book, chapter);
        setVerses(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load verses');
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
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h2 className="text-xl font-semibold mb-2">Raw Data</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium">Books</h3>
              <pre className="bg-gray-100 p-2 rounded text-sm">
                {JSON.stringify(books, null, 2)}
              </pre>
            </div>
            
            <div>
              <h3 className="font-medium">Chapters</h3>
              <pre className="bg-gray-100 p-2 rounded text-sm">
                {JSON.stringify(chapters, null, 2)}
              </pre>
            </div>
            
            <div>
              <h3 className="font-medium">Verses</h3>
              <pre className="bg-gray-100 p-2 rounded text-sm">
                {JSON.stringify(verses, null, 2)}
              </pre>
            </div>
          </div>
        </div>
        
        <div>
          <h2 className="text-xl font-semibold mb-2">Formatted Display</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Version</label>
              <select
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              >
                <option value="KJV">King James Version</option>
                <option value="ASV">American Standard Version</option>
                <option value="WEB">World English Bible</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Book</label>
              <select
                value={book}
                onChange={(e) => setBook(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              >
                {books.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Chapter</label>
              <select
                value={chapter}
                onChange={(e) => setChapter(Number(e.target.value))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              >
                {chapters.map((c) => (
                  <option key={c.id} value={c.number}>
                    Chapter {c.number}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <h3 className="font-medium">Verses</h3>
              <div className="space-y-2">
                {verses.map((verse) => (
                  <div key={verse.id} className="flex">
                    <span className="font-medium mr-2">{verse.number}.</span>
                    <span dangerouslySetInnerHTML={{ __html: verse.text }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded">Loading...</div>
        </div>
      )}
    </div>
  );
} 
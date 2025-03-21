'use client';

import { useState, useEffect } from 'react';
import { fetchBibleVersions, DEFAULT_VERSION } from '@/lib/api/bibleApi';
import { getErrorMessage } from '@/lib/utils/errorHandling';
import BooksColumn from './BooksColumn';
import ChaptersColumn from './ChaptersColumn';
import VersesColumn from './VersesColumn';
import CommentaryColumn from './CommentaryColumn';
import ErrorBoundary from './ErrorBoundary';
import Header from './Header';
import { getVerses } from '@/lib/firebase/verseManagement';

interface BibleVersion {
  id: string;
  name: string;
  language: string;
  fallbackId?: string;
}

interface Verse {
  number: number | 'S';
  content: string;
  reference: string;
}

interface Book {
  id: string;
  name: string;
}

// Default versions to use if API fails
const DEFAULT_VERSIONS: BibleVersion[] = [
  { id: 'en-kjv', name: 'King James Version', language: 'en' },
  { id: 'en-asv', name: 'American Standard Version', language: 'en' }
];

// Wrapper component for version selector to isolate potential errors
function VersionSelector({ 
  versions, 
  selectedVersion, 
  onChange, 
  loading 
}: { 
  versions: BibleVersion[], 
  selectedVersion: string, 
  onChange: (version: string) => void, 
  loading: boolean 
}) {
  // Safely render version options
  const renderVersionOptions = () => {
    try {
      if (loading) {
        return <option>Loading versions...</option>;
      }
      
      return versions.map((version) => {
        try {
          const id = typeof version.id === 'string' ? version.id : 'unknown';
          const name = typeof version.name === 'string' ? version.name : 'Unknown';
          const language = typeof version.language === 'string' ? version.language : 'en';
          
          return (
            <option key={id} value={id}>
              {name} ({language})
            </option>
          );
        } catch (err) {
          console.error('Error rendering version option:', err);
          return null;
        }
      }).filter(Boolean);
    } catch (err) {
      console.error('Error rendering version options:', err);
      return <option value="en-kjv">King James Version (en)</option>;
    }
  };

  return (
    <select
      id="version-select"
      value={selectedVersion}
      onChange={(e) => onChange(e.target.value)}
      className="bg-white bg-opacity-10 border border-blue-400 text-white rounded-md px-3 py-1 focus:outline-none focus:ring-1 focus:ring-blue-300 text-sm"
      disabled={loading}
    >
      {renderVersionOptions()}
    </select>
  );
}

export default function BibleExplorer() {
  const [versions, setVersions] = useState<BibleVersion[]>(DEFAULT_VERSIONS);
  const [selectedVersion, setSelectedVersion] = useState<string>(DEFAULT_VERSION);
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | 'S' | null>(null);
  const [selectedVerse, setSelectedVerse] = useState<number | 'S' | null>(null);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadVersions() {
      try {
        setLoading(true);
        
        const data = await fetchBibleVersions();
        
        // Make sure data is an array before setting it
        if (Array.isArray(data) && data.length > 0) {
          setVersions(data);
          setError(null);
        } else {
          // If data is not an array, set an error
          console.error('Invalid data format from Bible API:', data);
          setError('Failed to load Bible versions: Invalid data format');
          // Keep the default versions
        }
      } catch (err) {
        // Use our utility to safely get the error message
        const errorMessage = getErrorMessage(err);
        setError(errorMessage);
        console.error('Error loading Bible versions:', errorMessage);
        // Keep the default versions
      } finally {
        setLoading(false);
      }
    }

    loadVersions();
  }, []);

  // Load verses when chapter changes
  useEffect(() => {
    let isCancelled = false;

    async function loadVerses() {
      if (!selectedBookId || !selectedChapter || selectedChapter === 'S') {
        // Only clear verses if we don't have valid selection
        setVerses([]);
        return;
      }

      setLoading(true);
      try {
        console.log('Loading regular chapter');
        // Use Firebase cache system which will handle API fallback
        const data = await getVerses(selectedVersion, selectedBookId, selectedChapter);
        if (!isCancelled) {
          // Map the verses directly without adding another summary verse
          const newVerses = data.map(verse => ({
            number: verse.number,
            content: verse.content,
            reference: verse.reference
          }));
          console.log('Setting verses:', newVerses.length);
          setVerses(newVerses);
          setError(null);
        }
      } catch (err) {
        if (!isCancelled) {
          const errorMessage = getErrorMessage(err);
          setError(errorMessage);
          console.error('Error loading verses:', errorMessage);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    loadVerses();

    return () => {
      isCancelled = true;
    };
  }, [selectedBookId, selectedChapter, selectedVersion]);

  // Reset verse when chapter changes, but only if chapter is actually different
  useEffect(() => {
    if (selectedVerse !== null) {
      setSelectedVerse(null);
    }
  }, [selectedChapter]);

  // Reset chapter and verse when book changes, but only if book is actually different
  useEffect(() => {
    if (selectedChapter !== null) {
      setSelectedChapter(null);
    }
    if (selectedVerse !== null) {
      setSelectedVerse(null);
    }
  }, [selectedBookId]);

  return (
    <div className="flex flex-col h-screen bg-white">
      <ErrorBoundary>
        <Header 
          version={selectedVersion}
          onVersionChange={setSelectedVersion}
          versions={versions}
          loading={loading}
        />
      </ErrorBoundary>

      {/* Main content with four columns */}
      <div className="flex-1 flex overflow-hidden">
        <ErrorBoundary>
          <BooksColumn
            version={selectedVersion}
            selectedBook={selectedBookId}
            onSelectBook={setSelectedBookId}
          />
        </ErrorBoundary>
        
        <ErrorBoundary>
          <ChaptersColumn
            version={selectedVersion}
            book={selectedBookId}
            selectedChapter={selectedChapter}
            onSelectChapter={setSelectedChapter}
          />
        </ErrorBoundary>
        
        <ErrorBoundary>
          <VersesColumn
            version={selectedVersion}
            book={selectedBookId}
            chapter={selectedChapter}
            selectedVerse={selectedVerse}
            onSelectVerse={setSelectedVerse}
            verses={verses}
            loading={loading}
            error={error}
          />
        </ErrorBoundary>
        
        <ErrorBoundary>
          <CommentaryColumn
            version={selectedVersion}
            book={selectedBookId}
            chapter={selectedChapter}
            verse={selectedVerse}
          />
        </ErrorBoundary>
      </div>
      
      {/* Footer */}
      <footer className="bg-gray-100 border-t p-2 text-center text-gray-600 text-xs">
        <p>biblepedia.io © {new Date().getFullYear()} - A scholarly Bible wiki for academic study and research</p>
      </footer>
    </div>
  );
} 
'use client';

import { useState, useEffect } from 'react';
import { fetchBibleVersions, DEFAULT_VERSION } from '@/lib/api/bibleApi';
import { getErrorMessage } from '@/lib/utils/errorHandling';
import BooksColumn from './BooksColumn';
import ChaptersColumn from './ChaptersColumn';
import VersesColumn from './VersesColumn';
import CommentaryColumn from './CommentaryColumn';
import ErrorBoundary from './ErrorBoundary';

interface BibleVersion {
  id: string;
  name: string;
  language: string;
  fallbackId?: string;
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
  const [selectedVersion, setSelectedVersion] = useState<string>('en-nrsv');
  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [selectedVerse, setSelectedVerse] = useState<number | null>(null);
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

  // Reset selections when changing higher-level selections
  useEffect(() => {
    setSelectedChapter(null);
    setSelectedVerse(null);
  }, [selectedBook]);

  useEffect(() => {
    setSelectedVerse(null);
  }, [selectedChapter]);

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header with version selector */}
      <header className="bg-gradient-to-r from-blue-800 to-indigo-900 text-white p-3 shadow-md">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
          <h1 className="text-2xl font-bold mb-2 md:mb-0 flex items-center">
            <span className="font-biblepedia lowercase">biblepedia.io</span>
            <span className="text-blue-300 ml-2 text-xs uppercase tracking-wider font-light">Scholarly Wiki</span>
          </h1>
          
          <div className="flex items-center">
            <label htmlFor="version-select" className="mr-2 text-blue-100 text-sm">
              Bible Version:
            </label>
            <ErrorBoundary fallback={
              <select className="bg-white text-gray-900 border border-blue-400 rounded-md px-3 py-1 text-sm">
                <option value="en-kjv">King James Version (en)</option>
              </select>
            }>
              <VersionSelector 
                versions={versions} 
                selectedVersion={selectedVersion} 
                onChange={setSelectedVersion} 
                loading={loading} 
              />
            </ErrorBoundary>
          </div>
        </div>
      </header>

      {/* Main content with four columns */}
      <div className="flex-1 flex overflow-hidden">
        <ErrorBoundary>
          <BooksColumn
            version={selectedVersion}
            selectedBook={selectedBook}
            onSelectBook={setSelectedBook}
          />
        </ErrorBoundary>
        
        <ErrorBoundary>
          <ChaptersColumn
            version={selectedVersion}
            book={selectedBook}
            selectedChapter={selectedChapter}
            onSelectChapter={setSelectedChapter}
          />
        </ErrorBoundary>
        
        <ErrorBoundary>
          <VersesColumn
            version={selectedVersion}
            book={selectedBook}
            chapter={selectedChapter}
            selectedVerse={selectedVerse}
            onSelectVerse={setSelectedVerse}
          />
        </ErrorBoundary>
        
        <ErrorBoundary>
          <CommentaryColumn
            version={selectedVersion}
            book={selectedBook}
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
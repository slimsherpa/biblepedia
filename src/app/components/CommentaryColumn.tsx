'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { getVerseCommentary } from '@/lib/firebase/verseManagement';
import { BIBLE_VERSIONS } from '@/lib/api/bibleConfig';
import EditCommentaryModal from './EditCommentaryModal';
import VerseCommentaryDisplay from './VerseCommentaryDisplay';

interface Verse {
  id: string;
  orgId: string;
  bookId: string;
  chapterId: string;
  reference: string;
  text: string;
}

interface Commentary {
  text: string;
  author: string;
  timestamp: number;
  references?: string[];
  tags?: string[];
}

interface CommentaryColumnProps {
  book: string | null;
  chapter: number | null;
  verse: number | null;
  version: string;
  currentVerse: Verse | null;
}

export default function CommentaryColumn({ 
  book, 
  chapter, 
  verse, 
  version,
  currentVerse
}: CommentaryColumnProps) {
  const { user } = useAuth();
  const [commentary, setCommentary] = useState<Commentary | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load commentary when verse changes
  useEffect(() => {
    async function loadCommentary() {
      if (!book || !chapter || !verse || !currentVerse) {
        setCommentary(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await getVerseCommentary(currentVerse.reference);
        if (data) {
          setCommentary(data as Commentary);
        } else {
          setCommentary(null);
        }
      } catch (error) {
        console.error('Error loading commentary:', error);
        setError('Failed to load commentary');
      } finally {
        setLoading(false);
      }
    }

    loadCommentary();
  }, [book, chapter, verse, currentVerse]);

  return (
    <div className="overflow-y-auto h-full">
      {!currentVerse ? (
        <div className="flex justify-center items-center h-full text-gray-500">
          Select a verse to view or add commentary
        </div>
      ) : loading ? (
        <div className="flex justify-center items-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="p-4 text-red-500">{error}</div>
      ) : (
        <div className="p-4">
          {/* Verse text */}
          <div className="mb-6 text-lg">
            {currentVerse.text}
          </div>

          {/* Commentary section */}
          {isEditing ? (
            <EditCommentaryModal
              reference={currentVerse.reference}
              text={currentVerse.text}
              initialCommentary={commentary}
              onSave={(newCommentary: Commentary) => {
                setCommentary(newCommentary);
                setIsEditing(false);
              }}
              onCancel={() => setIsEditing(false)}
            />
          ) : (
            <VerseCommentaryDisplay
              reference={currentVerse.reference}
              text={currentVerse.text}
              commentary={commentary}
              canEdit={!!user}
              onEdit={() => setIsEditing(true)}
            />
          )}
        </div>
      )}
    </div>
  );
} 
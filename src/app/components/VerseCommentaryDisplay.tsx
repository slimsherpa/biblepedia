'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { getVerseCommentary, createCommentaryEdit } from '@/lib/firebase/commentaryManagement';
import { VerseCommentary } from '@/lib/types/commentary';
import { canAddCommentary } from '@/lib/types/user';
import DebateSection from './DebateSection';
import EditHistory from './EditHistory';
import EditCommentaryModal from './EditCommentaryModal';
import { marked } from 'marked'; // For Markdown rendering

interface VerseCommentaryDisplayProps {
  book: string;
  chapter: number;
  verse: number;
  verseText: string;
  isSummary: boolean;
  translations: Array<{
    version: string;
    text: string;
    type: 'modern' | 'classical' | 'original';
    displayName: string;
  }>;
}

export default function VerseCommentaryDisplay({ 
  book, 
  chapter, 
  verse, 
  verseText,
  isSummary,
  translations
}: VerseCommentaryDisplayProps) {
  const { userProfile } = useAuth();
  const [commentary, setCommentary] = useState<VerseCommentary | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [editSummary, setEditSummary] = useState('');
  const [showDebate, setShowDebate] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setLoading] = useState(true);

  // Generate the verse ID based on the props
  const verseId = `${book.toUpperCase()}.${chapter}.${verse}${isSummary ? '.S' : ''}`;

  useEffect(() => {
    loadCommentary();
  }, [verseId]);

  async function loadCommentary() {
    setLoading(true);
    const data = await getVerseCommentary(verseId);
    setCommentary(data);
    setLoading(false);
  }

  async function handleSaveEdit() {
    if (!userProfile || !canAddCommentary(userProfile)) return;

    const success = await createCommentaryEdit(
      verseId,
      editContent,
      editSummary,
      userProfile
    );

    if (success) {
      await loadCommentary();
      setIsEditing(false);
      setEditContent('');
      setEditSummary('');
    }
  }

  function handleStartEdit() {
    if (!commentary) {
      setEditContent('');
    } else {
      setEditContent(commentary.currentContent || '');
    }
    setIsEditing(true);
  }

  function handleCancelEdit() {
    setIsEditing(false);
    setEditContent('');
    setEditSummary('');
  }

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Remove the duplicate Verse Text section */}
      {isSummary && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-500 mb-2">
            Summary
          </h3>
          <p className="text-gray-800">{verseText}</p>
        </div>
      )}

      {/* Commentary Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-700">
            {isSummary ? 'Summary Commentary' : 'Commentary'}
          </h3>
          {userProfile && canAddCommentary(userProfile) && (
            <button
              onClick={handleStartEdit}
              className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-md"
            >
              Edit
            </button>
          )}
        </div>

        <div>
          <div 
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ 
              __html: marked(commentary?.currentContent || 'No commentary yet.') 
            }} 
          />
          {commentary?.contributors && commentary.contributors.length > 0 && (
            <div className="mt-4 text-sm text-gray-500">
              {commentary.contributors.length} contributor{commentary.contributors.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>

      {/* Edit History and Debate Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="flex-1 py-2 px-4 text-sm text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-md"
        >
          History ({commentary?.edits?.length || 0})
        </button>
        <button
          onClick={() => setShowDebate(!showDebate)}
          className="flex-1 py-2 px-4 text-sm text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-md"
        >
          Debate ({commentary?.debate?.length || 0})
        </button>
      </div>

      {/* Edit History */}
      {showHistory && commentary && (
        <EditHistory
          edits={commentary.edits || []}
          onClose={() => setShowHistory(false)}
        />
      )}

      {/* Debate Section */}
      {showDebate && (
        <DebateSection
          verseId={verseId}
          onClose={() => setShowDebate(false)}
          debate={commentary?.debate || []}
          onUpdate={loadCommentary}
        />
      )}

      {/* Edit Commentary Modal */}
      <EditCommentaryModal
        isOpen={isEditing}
        onClose={handleCancelEdit}
        content={editContent}
        setContent={setEditContent}
        onSave={handleSaveEdit}
        book={book}
        chapter={chapter}
        verse={verse}
        verseText={verseText}
        translations={translations}
        debate={commentary?.debate || []}
        verseId={verseId}
        onDebateUpdate={loadCommentary}
      />
    </div>
  );
} 
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { getVerseCommentary, createCommentaryEdit } from '@/lib/firebase/commentaryManagement';
import { VerseCommentary } from '@/lib/types/commentary';
import { canAddCommentary } from '@/lib/types/user';
import DebateSection from './DebateSection';
import EditHistory from './EditHistory';
import { marked } from 'marked'; // For Markdown rendering

interface VerseCommentaryDisplayProps {
  verseId: string;
}

export default function VerseCommentaryDisplay({ verseId }: VerseCommentaryDisplayProps) {
  const { userProfile } = useAuth();
  const [commentary, setCommentary] = useState<VerseCommentary | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [editSummary, setEditSummary] = useState('');
  const [showDebate, setShowDebate] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Main Commentary Display */}
      <div className="prose max-w-none">
        {isEditing ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">Editing Commentary</h3>
              <div className="text-sm text-gray-500">
                Supports Markdown formatting
              </div>
            </div>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full h-64 p-4 border rounded font-mono text-sm"
              placeholder="Enter commentary using Markdown..."
            />
            <div className="bg-gray-50 p-4 rounded">
              <h4 className="text-sm font-semibold mb-2">Preview:</h4>
              <div 
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: marked(editContent) }}
              />
            </div>
            <input
              type="text"
              value={editSummary}
              onChange={(e) => setEditSummary(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Edit summary (briefly describe your changes)"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        ) : (
          <>
            <div 
              className="mb-4"
              dangerouslySetInnerHTML={{ 
                __html: commentary?.currentContent ? 
                  marked(commentary.currentContent) : 
                  '<em>No commentary available yet.</em>'
              }}
            />
            {userProfile && canAddCommentary(userProfile) && (
              <button
                onClick={() => {
                  setEditContent(commentary?.currentContent || '');
                  setIsEditing(true);
                }}
                className="text-blue-600 hover:text-blue-800"
              >
                Edit
              </button>
            )}
          </>
        )}
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex items-center justify-between border-t pt-4">
        <div className="flex space-x-4">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="text-gray-600 hover:text-gray-800 flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            View History
          </button>
          <button
            onClick={() => setShowDebate(!showDebate)}
            className="text-gray-600 hover:text-gray-800 flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Scholarly Debate
          </button>
        </div>
        {commentary?.contributors?.length > 0 && (
          <div className="text-sm text-gray-500">
            {commentary.contributors.length} contributor{commentary.contributors.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Edit History */}
      {showHistory && commentary && (
        <EditHistory
          edits={commentary.edits}
          onClose={() => setShowHistory(false)}
        />
      )}

      {/* Debate Section */}
      {showDebate && commentary && (
        <DebateSection
          verseId={verseId}
          debate={commentary.debate}
          onClose={() => setShowDebate(false)}
          onUpdate={loadCommentary}
        />
      )}
    </div>
  );
} 
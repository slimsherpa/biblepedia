'use client';

import { useState, useEffect, useCallback } from 'react';
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

// Helper function to format book name
function formatBookName(book: string): string {
  // Convert abbreviation to proper name
  const bookNames: Record<string, string> = {
    'GEN': 'Genesis', 'EXO': 'Exodus', 'LEV': 'Leviticus', 'NUM': 'Numbers',
    'DEU': 'Deuteronomy', 'JOS': 'Joshua', 'JDG': 'Judges', 'RUT': 'Ruth',
    '1SA': '1 Samuel', '2SA': '2 Samuel', '1KI': '1 Kings', '2KI': '2 Kings',
    '1CH': '1 Chronicles', '2CH': '2 Chronicles', 'EZR': 'Ezra', 'NEH': 'Nehemiah',
    'EST': 'Esther', 'JOB': 'Job', 'PSA': 'Psalms', 'PRO': 'Proverbs',
    'ECC': 'Ecclesiastes', 'SNG': 'Song of Solomon', 'ISA': 'Isaiah', 'JER': 'Jeremiah',
    'LAM': 'Lamentations', 'EZK': 'Ezekiel', 'DAN': 'Daniel', 'HOS': 'Hosea',
    'JOL': 'Joel', 'AMO': 'Amos', 'OBA': 'Obadiah', 'JON': 'Jonah',
    'MIC': 'Micah', 'NAM': 'Nahum', 'HAB': 'Habakkuk', 'ZEP': 'Zephaniah',
    'HAG': 'Haggai', 'ZEC': 'Zechariah', 'MAL': 'Malachi',
    'MAT': 'Matthew', 'MRK': 'Mark', 'LUK': 'Luke', 'JHN': 'John',
    'ACT': 'Acts', 'ROM': 'Romans', '1CO': '1 Corinthians', '2CO': '2 Corinthians',
    'GAL': 'Galatians', 'EPH': 'Ephesians', 'PHP': 'Philippians', 'COL': 'Colossians',
    '1TH': '1 Thessalonians', '2TH': '2 Thessalonians', '1TI': '1 Timothy', '2TI': '2 Timothy',
    'TIT': 'Titus', 'PHM': 'Philemon', 'HEB': 'Hebrews', 'JAS': 'James',
    '1PE': '1 Peter', '2PE': '2 Peter', '1JN': '1 John', '2JN': '2 John',
    '3JN': '3 John', 'JUD': 'Jude', 'REV': 'Revelation'
  };
  
  return bookNames[book.toUpperCase()] || book;
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

  const loadCommentary = useCallback(async () => {
    setLoading(true);
    const data = await getVerseCommentary(verseId);
    setCommentary(data);
    setLoading(false);
  }, [verseId]);

  useEffect(() => {
    loadCommentary();
  }, [loadCommentary]);

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

  // Group translations by type
  const groupedTranslations = {
    modern: translations.filter(t => t.type === 'modern'),
    classical: translations.filter(t => t.type === 'classical'),
    original: translations.filter(t => t.type === 'original')
  };

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
    <div className="space-y-6">
      {/* Translations Section */}
      {translations.length > 0 && (
        <div>
          {/* Verse Reference */}
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {formatBookName(book)} {chapter}:{verse}
            </h2>
          </div>

          <div className="space-y-3">
            {/* Modern Translations */}
            {groupedTranslations.modern.map((translation) => (
              <div key={translation.version} className="bg-white rounded-lg border border-gray-200 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    Modern
                  </span>
                  <span className="text-sm font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                    {translation.displayName === 'New Revised Standard Version' ? 'NRSV' : translation.displayName}
                  </span>
                </div>
                <div 
                  className="text-gray-800 prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ 
                    __html: translation.text.replace(/<span[^>]*data-number[^>]*>[^<]*<\/span>/g, '')
                  }}
                />
              </div>
            ))}

            {/* Classical Translations */}
            {groupedTranslations.classical.map((translation) => (
              <div key={translation.version} className="bg-white rounded-lg border border-gray-200 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                    Classical
                  </span>
                  <span className="text-sm font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                    {translation.displayName === 'King James Version' ? 'KJV' : translation.displayName}
                  </span>
                </div>
                <div 
                  className="text-gray-800 prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ 
                    __html: translation.text.replace(/<span[^>]*data-number[^>]*>[^<]*<\/span>/g, '')
                  }}
                />
              </div>
            ))}

            {/* Original Language */}
            {groupedTranslations.original.map((translation) => (
              <div key={translation.version} className="bg-white rounded-lg border border-gray-200 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                    Original
                  </span>
                  <span className="text-sm font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                    {translation.displayName === 'Hebrew Bible' ? 'Hebrew' : 
                     translation.displayName === 'Text-Critical Greek New Testament' ? 'Greek NT' :
                     translation.displayName === 'Brenton Greek Septuagint' ? 'LXX' :
                     translation.displayName}
                  </span>
                </div>
                <div 
                  className="text-gray-800 prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ 
                    __html: translation.text.replace(/<span[^>]*data-number[^>]*>[^<]*<\/span>/g, '')
                  }}
                />
              </div>
            ))}
          </div>
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
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

interface Commentary {
  text: string;
  author: string;
  timestamp: number;
  references?: string[];
  tags?: string[];
}

interface VerseCommentaryDisplayProps {
  reference: string;
  text: string;
  commentary: Commentary | null;
  canEdit: boolean;
  onEdit: () => void;
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
  reference,
  text,
  commentary,
  canEdit,
  onEdit
}: VerseCommentaryDisplayProps) {
  return (
    <div className="space-y-4">
      {/* Commentary content */}
      {commentary ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="prose dark:prose-invert max-w-none">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              By {commentary.author} • {new Date(commentary.timestamp).toLocaleDateString()}
            </div>
            <div className="whitespace-pre-wrap">{commentary.text}</div>
            {commentary.references && commentary.references.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-semibold mb-2">References</h4>
                <ul className="list-disc pl-5">
                  {commentary.references.map((ref, index) => (
                    <li key={index} className="text-sm">{ref}</li>
                  ))}
                </ul>
              </div>
            )}
            {commentary.tags && commentary.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {commentary.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
          No commentary available for this verse yet.
        </div>
      )}

      {/* Edit button */}
      {canEdit && (
        <button
          onClick={onEdit}
          className="w-full py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
        >
          {commentary ? 'Edit Commentary' : 'Add Commentary'}
        </button>
      )}
    </div>
  );
} 
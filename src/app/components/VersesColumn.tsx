'use client';

import { useState, useEffect } from 'react';
import { Verse } from './BibleExplorer';

interface VersesColumnProps {
  verses: Verse[];
  selectedVerse: Verse | null;
  onSelect: (verse: Verse) => void;
}

export default function VersesColumn({ verses, selectedVerse, onSelect }: VersesColumnProps) {
  return (
    <div className="overflow-y-auto h-full">
      <div className="grid grid-cols-4 gap-1 p-2">
        {verses.map((verse) => (
          <button
            key={verse.id}
            onClick={() => onSelect(verse)}
            className={`
              text-center px-4 py-2 rounded-lg transition-colors
              ${selectedVerse?.id === verse.id
                ? 'bg-blue-500 text-white'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }
            `}
          >
            {verse.reference.split(':')[1]}
          </button>
        ))}
      </div>
    </div>
  );
} 
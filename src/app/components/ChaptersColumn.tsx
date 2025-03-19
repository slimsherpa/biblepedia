'use client';

import { Chapter } from './BibleExplorer';

interface ChaptersColumnProps {
  chapters: Chapter[];
  selectedChapter: Chapter | null;
  onSelect: (chapter: Chapter) => void;
}

export default function ChaptersColumn({ chapters, selectedChapter, onSelect }: ChaptersColumnProps) {
  return (
    <div className="overflow-y-auto h-full">
      <div className="grid grid-cols-4 gap-1 p-2">
        {chapters.map((chapter) => (
          <button
            key={chapter.id}
            onClick={() => onSelect(chapter)}
            className={`
              text-center px-4 py-2 rounded-lg transition-colors
              ${selectedChapter?.id === chapter.id
                ? 'bg-blue-500 text-white'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }
            `}
          >
            {chapter.number}
          </button>
        ))}
      </div>
    </div>
  );
} 
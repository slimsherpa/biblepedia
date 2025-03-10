import { CommentaryEdit } from './commentaryTypes';
import { DebatePost } from './debateTypes';

export interface Summary {
  content: string;
  lastEditId: string;
  edits: CommentaryEdit[];
  debate: DebatePost[];
  contributors: string[];
  createdAt: number;
  updatedAt: number;
}

export interface BookSummary extends Summary {
  bookId: string;
}

export interface ChapterSummary extends Summary {
  bookId: string;
  chapterNumber: number;
}

export type SummaryType = 'book' | 'chapter'; 
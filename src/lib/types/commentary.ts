import { FieldValue } from 'firebase/firestore';
import { UserProfileMinimal } from './user';

export interface CommentaryEdit {
  id: string;
  content: string;
  summary: string;
  author: UserProfileMinimal;
  timestamp: number;
  parentEditId?: string;
}

export interface DebatePost {
  id: string;
  content: string;
  author: UserProfileMinimal;
  timestamp: number;
  likes: number;
  replies?: DebatePost[];
  votes: {
    up: string[];
    down: string[];
  };
  references: string[];
  parentPostId?: string;
}

export interface VerseCommentary {
  id: string;
  currentContent: string;
  contributors: string[];
  edits: CommentaryEdit[];
  debate: DebatePost[];
  createdAt: number;
  updatedAt: number;
  lastEditId?: string;
  verseId: string;
  lastUpdated: FieldValue;
} 
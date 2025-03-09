import { FieldValue } from 'firebase/firestore';
import { UserProfile } from './user';

export interface CommentaryEdit {
  id: string;
  content: string;
  editor: {
    uid: string;
    displayName: string;
    role: string;
  };
  timestamp: number;
  summary: string; // Edit summary like Wikipedia
  parentEditId?: string | null; // For tracking edit history, can be omitted or null
}

export interface DebatePost {
  id: string;
  content: string;
  author: {
    uid: string;
    displayName: string;
    role: string;
  };
  timestamp: number;
  references: string[]; // Citations
  parentPostId?: string | null; // For threading discussions, can be omitted or null
  votes: {
    up: string[]; // Array of user IDs
    down: string[];
  };
}

export interface VerseCommentary {
  verseId: string; // Format: "GEN.1.1" (BOOK.CHAPTER.VERSE)
  currentContent: string; // The current "approved" content
  lastEditId: string; // Reference to the most recent edit
  edits: CommentaryEdit[]; // Edit history
  debate: DebatePost[]; // Scholarly debate
  contributors: string[]; // Array of user IDs
  lastUpdated: FieldValue | number;
} 
import { FieldValue } from 'firebase/firestore';
import { UserProfile, UserProfileMinimal } from './user';

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
  votes: {
    up: string[];  // Array of user IDs who upvoted
    down: string[]; // Array of user IDs who downvoted
  };
  references: string[];  // Array of reference URLs
  parentPostId?: string; // Optional ID of the parent post for replies
  replies?: DebatePost[];
}

export interface VerseCommentary {
  id: string;
  currentContent: string;
  contributors: UserProfileMinimal[];
  edits: CommentaryEdit[];
  debate: DebatePost[];
  createdAt: number;
  updatedAt: number;
  lastEditId: string;
} 
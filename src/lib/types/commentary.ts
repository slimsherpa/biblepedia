import { FieldValue } from 'firebase/firestore';
import { UserProfile } from './user';

export interface CommentaryEdit {
  id: string;
  content: string;
  summary: string;
  author: UserProfile;
  timestamp: number;
}

export interface DebatePost {
  id: string;
  content: string;
  author: UserProfile;
  timestamp: number;
  likes: number;
  replies?: DebatePost[];
}

export interface VerseCommentary {
  id: string;
  currentContent: string;
  contributors: UserProfile[];
  edits: CommentaryEdit[];
  debate: DebatePost[];
  createdAt: number;
  updatedAt: number;
} 
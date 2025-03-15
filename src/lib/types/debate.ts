import { UserProfile } from './user'

export interface DebatePost {
  id: string
  content: string
  author: UserProfile
  timestamp: number
  likes: number
  replies?: DebatePost[]
  votes: {
    up: string[]
    down: string[]
  }
  references: string[]
  parentPostId?: string
}

export interface DebateThread {
  posts: DebatePost[]
  totalPosts: number
} 
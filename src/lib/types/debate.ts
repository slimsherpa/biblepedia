import { UserProfile } from './user'

export interface DebatePost {
  id: string
  content: string
  author: UserProfile
  timestamp: number
  likes: number
  replies?: DebatePost[]
}

export interface DebateThread {
  posts: DebatePost[]
  totalPosts: number
} 
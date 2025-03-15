import { UserProfile, UserProfileMinimal } from './user'

export interface DebatePost {
  id: string
  content: string
  author: UserProfileMinimal
  timestamp: number
  likes: number
  votes: {
    up: string[]  // Array of user IDs who upvoted
    down: string[] // Array of user IDs who downvoted
  }
  references: string[]  // Array of reference URLs
  parentPostId?: string // Optional ID of the parent post for replies
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
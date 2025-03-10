import { db } from './firebase'
import { collection, addDoc, serverTimestamp, query, orderBy, getDocs } from 'firebase/firestore'
import { DebatePost } from '../types/debate'
import { UserProfile } from '../types/user'

export async function createDebatePost(
  verseId: string,
  content: string,
  author: UserProfile
): Promise<boolean> {
  try {
    const debateRef = collection(db, 'verses', verseId, 'debate')
    await addDoc(debateRef, {
      content,
      author,
      timestamp: serverTimestamp(),
      likes: 0
    })
    return true
  } catch (error) {
    console.error('Error creating debate post:', error)
    return false
  }
}

export async function getDebatePosts(verseId: string): Promise<DebatePost[]> {
  try {
    const debateRef = collection(db, 'verses', verseId, 'debate')
    const q = query(debateRef, orderBy('timestamp', 'desc'))
    const snapshot = await getDocs(q)
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as DebatePost[]
  } catch (error) {
    console.error('Error getting debate posts:', error)
    return []
  }
} 
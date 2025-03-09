import { db } from './firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  arrayUnion,
  serverTimestamp,
  query,
  where,
  orderBy,
  limit,
  getDocs
} from 'firebase/firestore';
import { VerseCommentary, CommentaryEdit, DebatePost } from '../types/commentary';
import { UserProfile } from '../types/user';
import { canAddCommentary } from '../types/user';

const COMMENTARY_COLLECTION = 'commentaries';
const EDITS_COLLECTION = 'commentary_edits';
const DEBATES_COLLECTION = 'commentary_debates';

export async function getVerseCommentary(verseId: string): Promise<VerseCommentary | null> {
  const commentaryRef = doc(db, COMMENTARY_COLLECTION, verseId);
  const commentaryDoc = await getDoc(commentaryRef);
  
  if (!commentaryDoc.exists()) return null;
  return commentaryDoc.data() as VerseCommentary;
}

export async function getRecentCommentaries(limitCount: number = 10): Promise<VerseCommentary[]> {
  const q = query(
    collection(db, COMMENTARY_COLLECTION),
    orderBy('lastUpdated', 'desc'),
    limit(limitCount)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as VerseCommentary);
}

export async function createCommentaryEdit(
  verseId: string,
  content: string,
  summary: string,
  editor: UserProfile
): Promise<boolean> {
  if (!canAddCommentary(editor)) return false;

  try {
    const editId = `${verseId}_${Date.now()}`;
    const editRef = doc(db, EDITS_COLLECTION, editId);
    
    const now = Date.now();
    const edit: CommentaryEdit = {
      id: editId,
      content,
      editor: {
        uid: editor.uid,
        displayName: editor.displayName,
        role: editor.role
      },
      timestamp: now,
      summary,
    };

    // Get current commentary
    const commentaryRef = doc(db, COMMENTARY_COLLECTION, verseId);
    const commentaryDoc = await getDoc(commentaryRef);

    if (commentaryDoc.exists()) {
      const commentary = commentaryDoc.data() as VerseCommentary;
      if (commentary.lastEditId) {
        edit.parentEditId = commentary.lastEditId;
      }
      
      // Update existing commentary
      await updateDoc(commentaryRef, {
        currentContent: content,
        lastEditId: editId,
        edits: arrayUnion(edit),
        contributors: arrayUnion(editor.uid),
        lastUpdated: serverTimestamp()
      });
    } else {
      // Create new commentary
      const newCommentary: VerseCommentary = {
        verseId,
        currentContent: content,
        lastEditId: editId,
        edits: [edit],
        debate: [],
        contributors: [editor.uid],
        lastUpdated: serverTimestamp()
      };
      await setDoc(commentaryRef, newCommentary);
    }

    await setDoc(editRef, edit);
    return true;
  } catch (error) {
    console.error('Error creating commentary edit:', error);
    return false;
  }
}

export async function addDebatePost(
  verseId: string,
  content: string,
  references: string[],
  author: UserProfile,
  parentPostId?: string
): Promise<boolean> {
  if (!canAddCommentary(author)) return false;

  try {
    const postId = `${verseId}_debate_${Date.now()}`;
    const post: DebatePost = {
      id: postId,
      content,
      author: {
        uid: author.uid,
        displayName: author.displayName,
        role: author.role
      },
      timestamp: Date.now(),
      references,
      votes: { up: [], down: [] }
    };

    // Only add parentPostId if it exists
    if (parentPostId) {
      post.parentPostId = parentPostId;
    }

    const commentaryRef = doc(db, COMMENTARY_COLLECTION, verseId);
    await updateDoc(commentaryRef, {
      debate: arrayUnion(post),
      lastUpdated: serverTimestamp()
    });

    return true;
  } catch (error) {
    console.error('Error adding debate post:', error);
    return false;
  }
}

export async function voteOnDebatePost(
  verseId: string,
  postId: string,
  userId: string,
  voteType: 'up' | 'down'
): Promise<boolean> {
  try {
    const commentaryRef = doc(db, COMMENTARY_COLLECTION, verseId);
    const commentaryDoc = await getDoc(commentaryRef);
    
    if (!commentaryDoc.exists()) return false;
    
    const commentary = commentaryDoc.data() as VerseCommentary;
    const postIndex = commentary.debate.findIndex(post => post.id === postId);
    
    if (postIndex === -1) return false;
    
    const post = commentary.debate[postIndex];
    
    // Remove user from both vote arrays
    post.votes.up = post.votes.up.filter(id => id !== userId);
    post.votes.down = post.votes.down.filter(id => id !== userId);
    
    // Add user to selected vote array
    post.votes[voteType].push(userId);
    
    await updateDoc(commentaryRef, {
      debate: commentary.debate
    });
    
    return true;
  } catch (error) {
    console.error('Error voting on debate post:', error);
    return false;
  }
}

export async function getCommentaryEditHistory(verseId: string): Promise<CommentaryEdit[]> {
  const commentaryRef = doc(db, COMMENTARY_COLLECTION, verseId);
  const commentaryDoc = await getDoc(commentaryRef);
  
  if (!commentaryDoc.exists()) return [];
  
  const commentary = commentaryDoc.data() as VerseCommentary;
  return commentary.edits.sort((a, b) => {
    const timeA = (a.timestamp as any)?.seconds || 0;
    const timeB = (b.timestamp as any)?.seconds || 0;
    return timeB - timeA;
  });
} 
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
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { VerseCommentary, CommentaryEdit, DebatePost } from '../types/commentary';
import { UserProfile } from '../types/user';
import { canAddCommentary } from '../types/user';
import { v4 as uuidv4 } from 'uuid';

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
    const now = Date.now();
    const commentaryRef = doc(db, COMMENTARY_COLLECTION, verseId);
    const commentaryDoc = await getDoc(commentaryRef);

    const editData: CommentaryEdit = {
      id: editId,
      content,
      author: {
        uid: editor.uid,
        displayName: editor.displayName || '',
        role: editor.role || 'user',
        photoURL: editor.photoURL || '',
        email: editor.email || ''
      },
      timestamp: now,
      summary: summary || 'Updated commentary',
      parentEditId: commentaryDoc.exists() ? commentaryDoc.data()?.lastEditId : null
    };

    // Store the edit in its own document
    const editRef = doc(db, EDITS_COLLECTION, editId);
    await setDoc(editRef, editData);

    // Update or create the commentary document
    if (!commentaryDoc.exists()) {
      // Create new commentary document
      await setDoc(commentaryRef, {
        id: verseId,
        currentContent: content,
        edits: [editData],
        contributors: [{
          uid: editor.uid,
          displayName: editor.displayName || '',
          role: editor.role || 'user',
          photoURL: editor.photoURL || '',
          email: editor.email || ''
        }],
        createdAt: now,
        updatedAt: now,
        lastEditId: editId,
        debate: []
      });
    } else {
      // Get existing data
      const existingData = commentaryDoc.data();
      const existingEdits = existingData?.edits || [];
      const existingContributors = existingData?.contributors || [];
      
      // Check if contributor already exists
      const contributorExists = existingContributors.some(
        (c: any) => c.uid === editor.uid
      );

      // Update existing commentary document
      await updateDoc(commentaryRef, {
        currentContent: content,
        edits: [...existingEdits, editData],
        contributors: contributorExists ? existingContributors : [
          ...existingContributors,
          {
            uid: editor.uid,
            displayName: editor.displayName || '',
            role: editor.role || 'user',
            photoURL: editor.photoURL || '',
            email: editor.email || ''
          }
        ],
        updatedAt: now,
        lastEditId: editId
      });
    }

    return true;
  } catch (error) {
    console.error('Error creating commentary edit:', error);
    return false;
  }
}

export async function addDebatePost(
  verseId: string,
  content: string,
  author: UserProfile,
  parentPostId?: string
): Promise<boolean> {
  try {
    const now = Date.now();
    const post = {
      id: `${verseId}_${now}`,
      content,
      author: {
        uid: author.uid,
        displayName: author.displayName || '',
        role: author.role || 'user',
        photoURL: author.photoURL || '',
        email: author.email || ''
      },
      timestamp: now,
      likes: 0,
      votes: {
        up: [],
        down: []
      },
      references: [],
      parentPostId: parentPostId || null
    };

    const commentaryRef = doc(db, COMMENTARY_COLLECTION, verseId);
    const commentaryDoc = await getDoc(commentaryRef);

    if (!commentaryDoc.exists()) {
      // Create the commentary document if it doesn't exist
      await setDoc(commentaryRef, {
        id: verseId,
        currentContent: '',
        debate: [post],
        edits: [],
        contributors: [],
        createdAt: now,
        updatedAt: now,
        lastEditId: null
      });
    } else {
      // Update existing commentary document
      await updateDoc(commentaryRef, {
        debate: arrayUnion(post),
        updatedAt: now
      });
    }

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
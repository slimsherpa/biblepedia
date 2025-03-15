import { db } from './firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  setDoc, 
  updateDoc,
  serverTimestamp,
  Timestamp,
  FieldValue
} from 'firebase/firestore';
import { UserProfile, UserRole, SUPER_ADMIN_EMAIL } from '../types/user';

const USERS_COLLECTION = 'users';

export async function createUserProfile(
  uid: string,
  email: string,
  displayName: string | null,
  photoURL: string | null
): Promise<UserProfile> {
  const userRef = doc(db, USERS_COLLECTION, uid);
  
  try {
    // Check if user already exists
    const userDoc = await getDoc(userRef);
    
    // If user exists and is superadmin, ensure role is correct
    if (userDoc.exists()) {
      const existingProfile = userDoc.data() as UserProfile;
      if (email === SUPER_ADMIN_EMAIL && existingProfile.role !== 'superadmin') {
        await updateDoc(userRef, {
          role: 'superadmin',
          updatedAt: serverTimestamp()
        });
        return { ...existingProfile, role: 'superadmin' };
      }
      return existingProfile;
    }

    // Create new user profile
    const newProfile: UserProfile = {
      uid,
      email,
      name: displayName || email.split('@')[0],
      displayName: displayName || email.split('@')[0],
      photoURL: photoURL || undefined,
      role: email === SUPER_ADMIN_EMAIL ? 'superadmin' : 'user',
      createdAt: serverTimestamp() as FieldValue,
      lastLogin: Date.now(),
      updatedAt: serverTimestamp() as FieldValue,
      academicHistory: [],
      workHistory: [],
      achievements: [],
      websites: [],
      socialMedia: [],
      products: [],
      bio: ''
    };

    await setDoc(userRef, newProfile);
    return newProfile;
  } catch (error) {
    console.error('Error creating/updating user profile:', error);
    throw error;
  }
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const userRef = doc(db, USERS_COLLECTION, uid);
  const userDoc = await getDoc(userRef);
  
  if (!userDoc.exists()) {
    return null;
  }

  return userDoc.data() as UserProfile;
}

export async function updateUserProfile(
  uid: string,
  updates: Partial<UserProfile>
): Promise<boolean> {
  try {
    const userRef = doc(db, USERS_COLLECTION, uid);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error updating user profile:', error);
    return false;
  }
}

export async function getUsersByRole(role: UserRole): Promise<UserProfile[]> {
  const usersRef = collection(db, USERS_COLLECTION);
  const q = query(usersRef, where('role', '==', role));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => doc.data() as UserProfile);
}

export async function updateUserRole(
  adminProfile: UserProfile,
  targetUid: string,
  newRole: UserRole
): Promise<boolean> {
  // Only superadmin can manage admins
  if (newRole === 'admin' && adminProfile.role !== 'superadmin') {
    return false;
  }

  // Only superadmin can demote admins
  if (adminProfile.role !== 'superadmin') {
    const targetUser = await getUserProfile(targetUid);
    if (targetUser?.role === 'admin') {
      return false;
    }
  }

  // Cannot change superadmin role
  const targetUser = await getUserProfile(targetUid);
  if (targetUser?.role === 'superadmin') {
    return false;
  }

  return updateUserProfile(targetUid, { role: newRole });
} 
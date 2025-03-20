import { doc, getDoc } from 'firebase/firestore';
import { FirebaseError } from 'firebase/app';
import { db } from './firebase';

// Track if we have Firebase permissions
let hasFirebasePermissions: boolean | null = null;

export async function checkFirebasePermissions(): Promise<boolean> {
  if (hasFirebasePermissions !== null) {
    return hasFirebasePermissions;
  }

  try {
    // Try to read a test document
    const testRef = doc(db, '_test_permissions', 'test');
    await getDoc(testRef);
    hasFirebasePermissions = true;
    return true;
  } catch (error) {
    if (error instanceof FirebaseError) {
      console.warn('Firebase permissions not available:', error.message);
      hasFirebasePermissions = false;
    }
    return false;
  }
} 
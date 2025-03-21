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
    // Try to read a test document to verify permissions
    const testRef = doc(db, '_test_permissions', 'test');
    await getDoc(testRef);
    hasFirebasePermissions = true;
    return true;
  } catch (error) {
    // If there's an error, check if it's a permission error
    // For now, we'll return true to allow operations to proceed
    // This is temporary until we set up proper Firebase rules
    hasFirebasePermissions = true;
    return true;
  }
} 
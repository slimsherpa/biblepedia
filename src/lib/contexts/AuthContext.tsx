"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as firebaseSignOut,
  getAuth,
  setPersistence,
  browserLocalPersistence,
  User
} from "firebase/auth";
import { auth } from "../firebase/firebase";
import { UserProfile } from "../types/user";
import { createUserProfile, getUserProfile } from "../firebase/userManagement";

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
  signInWithGoogle: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set persistence to LOCAL (instead of SESSION) to persist the auth state
    setPersistence(auth, browserLocalPersistence).catch(console.error);

    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setUser(user);
      
      if (user) {
        // Get or create user profile
        let profile = await getUserProfile(user.uid);
        
        if (!profile) {
          profile = await createUserProfile(
            user.uid,
            user.email || '',
            user.displayName || 'Anonymous User',
            user.photoURL || undefined
          );
        }
        
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      // Clear any existing popup sessions
      const auth = getAuth();
      await auth.signOut();
      
      // Try to sign in
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      // Only log errors that aren't user cancellations
      if (error.code !== 'auth/cancelled-popup-request' && 
          error.code !== 'auth/popup-closed-by-user') {
        console.error("Error signing in with Google:", error);
      }
    }
  };

  const signOutUser = async () => {
    try {
      await firebaseSignOut(auth);
      setUserProfile(null);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      userProfile,
      loading, 
      signInWithGoogle, 
      signOut: signOutUser 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

export { AuthContext };

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCAGWJxBrHjnK3wSpxTOM2p2Vd8ugEpET8",
  authDomain: "biblepediaio.firebaseapp.com",
  projectId: "biblepediaio",
  storageBucket: "biblepediaio.firebasestorage.app",
  messagingSenderId: "136201813768",
  appId: "1:136201813768:web:57a5509b26d8bb752bb6bd",
  measurementId: "G-R2XN5X47TE"
};

// Initialize Firebase only on the client side
let app;
let auth;
let db;
let storage;

if (typeof window !== 'undefined') {
  try {
    // Initialize Firebase
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
  } catch (error) {
    console.error('Error initializing Firebase:', error);
  }
} else {
  // Server-side initialization (if needed)
  app = null;
  auth = null;
  db = null;
  storage = null;
}

export { app, auth, db, storage };

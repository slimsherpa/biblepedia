import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

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

// Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };

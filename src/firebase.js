// src/firebase.js
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCEGCSkc0mSAvn4mB5mQXTTDZ3GcEScHWg",
  authDomain: "attendance-f524b.firebaseapp.com",
  projectId: "attendance-f524b",
  storageBucket: "attendance-f524b.appspot.com",
  messagingSenderId: "295378375527",
  appId: "1:295378375527:web:ac2b55cb9a917ba87c55c2",
  measurementId: "G-124MCMCKTR"
};

// initialize or reuse existing
const app = !getApps().length
  ? initializeApp(firebaseConfig)
  : getApp();

const auth = getAuth(app);
const db   = getFirestore(app);

export { auth, db };

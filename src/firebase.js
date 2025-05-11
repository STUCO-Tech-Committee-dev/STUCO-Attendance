import { getFirestore } from 'firebase/firestore';
import { getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyCEGCSkc0mSAvn4mB5mQXTTDZ3GcEScHWg",
    authDomain: "attendance-f524b.firebaseapp.com",
    projectId: "attendance-f524b",
    storageBucket: "attendance-f524b.appspot.com",
    messagingSenderId: "295378375527",
    appId: "1:295378375527:web:ac2b55cb9a917ba87c55c2",
    measurementId: "G-124MCMCKTR"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
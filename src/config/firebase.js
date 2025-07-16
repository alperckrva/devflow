import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyBqu2zvTXzd_Ck5gCDPqJvA9y0c8vck-Gg",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "devflow-platform.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "devflow-platform",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "devflow-platform.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "922735228610",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:922735228610:web:25ecc006710c7fb953ad5b",
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-8W89H7GC6N"
};

// Firebase'i başlat
const app = initializeApp(firebaseConfig);

// Auth ve Firestore servislerini export et
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app; 
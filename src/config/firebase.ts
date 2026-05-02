import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// Firebase configuration (from Firebase Console)
const firebaseConfig = {
  apiKey: "AIzaSyDfj9yF_YKfH2Y0KZ4pX7rNV6kE9tRqHkM",
  authDomain: "ifilm-app-6c7f0.firebaseapp.com",
  projectId: "ifilm-app-6c7f0",
  storageBucket: "ifilm-app-6c7f0.firebasestorage.app",
  messagingSenderId: "748896774890",
  appId: "1:748896774890:web:7be820b42b7df1f54d3e1b"
};

// Initialize Firebase (only once)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { auth, googleProvider };

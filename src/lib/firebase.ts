import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCLGZf6eTcUhCTA5-f4dSBkaxbexx8dCMo",
  authDomain: "teamstellarx-b532e.firebaseapp.com",
  projectId: "teamstellarx-b532e",
  storageBucket: "teamstellarx-b532e.firebasestorage.app",
  messagingSenderId: "451013396917",
  appId: "1:451013396917:web:7b5ee05e8f1c2eb81631fc",
  measurementId: "G-J7D3S8NSHZ"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

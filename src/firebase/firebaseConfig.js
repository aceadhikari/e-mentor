// src/firebase/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC5E5_IRdoTIQlM853alnMvnAqrpCdAWQA",
  authDomain: "event-manager-f8e74.firebaseapp.com",
  projectId: "event-manager-f8e74",
  storageBucket: "event-manager-f8e74.firebasestorage.app",
  messagingSenderId: "777416632738",
  appId: "1:777416632738:web:4759dc49cd65abb39b2afb"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Firebase services
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };

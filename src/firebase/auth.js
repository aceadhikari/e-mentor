// src/firebase/auth.js
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut 
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebaseConfig";

// --- REGISTER FUNCTION ---
export const registerUser = async (email, password, role, name) => {
  try {
    // 1. Create the user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 2. Save the Role to Firestore Database
    // Collection: "users", Document: userId
    await setDoc(doc(db, "users", user.uid), {
      name: name,
      email: email,
      role: role, // 'user' or 'admin'
      createdAt: new Date(),
    });

    return { success: true, user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// --- LOGIN FUNCTION ---
export const loginUser = async (email, password) => {
  try {
    // 1. Sign in with Firebase Auth
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 2. Fetch the Role from Firestore
    const userDoc = await getDoc(doc(db, "users", user.uid));
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return { success: true, role: userData.role }; // Return role so we can redirect
    } else {
      return { success: false, error: "User data not found." };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const logoutUser = () => signOut(auth);
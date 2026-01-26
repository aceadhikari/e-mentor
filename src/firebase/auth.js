import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut 
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebaseConfig";

// --- Admin Credentials (only used during registration override) ---
const ADMIN_EMAIL = "deepakchetriadmin@ecell.in".trim().toLowerCase();
const ADMIN_PASSWORD = "deepakchetri02112003";

// --- 1. REGISTER FUNCTION ---
export const registerUser = async (email, password, role, name = '', teamName) => {
  try {
    // Normalize email for comparison
    const normalizedEmail = email.trim().toLowerCase();

    // If registering as admin (exact email match), force admin password
    let finalPassword = password;
    let finalRole = role;

    if (normalizedEmail === ADMIN_EMAIL) {
      finalPassword = ADMIN_PASSWORD;
      finalRole = 'admin'; // Force admin role even if passed something else
    }

    const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), finalPassword);
    const user = userCredential.user;

    // Save to Firestore
    await setDoc(doc(db, "users", user.uid), {
      name: name.trim() || '',         // Empty string if no name
      teamName: teamName ? teamName.trim() : '',
      email: email.trim(),
      role: finalRole,
      createdAt: new Date(),
    });

    return { success: true, user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// --- 2. LOGIN FUNCTION ---
export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password.trim());
    const user = userCredential.user;

    // Fetch Role from Firestore
    const userDoc = await getDoc(doc(db, "users", user.uid));
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      // Clean role just in case (removes any accidental whitespace/newline)
      const cleanedRole = (userData.role || 'user').trim().toLowerCase();
      return { success: true, role: cleanedRole }; 
    } else {
      return { success: false, error: "User data not found in Firestore." };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const logoutUser = () => signOut(auth);
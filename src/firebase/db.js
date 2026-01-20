import { 
  collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc, 
  query, where, onSnapshot, setDoc, arrayUnion, orderBy 
} from "firebase/firestore";
import { db } from "./firebaseConfig";

// --- 1. CREATE SESSION (Admin) ---
export const createSession = async (sessionData) => {
  try {
    const docRef = await addDoc(collection(db, "sessions"), {
      ...sessionData,
      status: 'FREE', 
      participants: [], 
      createdAt: new Date()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// --- 2. REAL-TIME LISTENER FOR SESSIONS ---
export const subscribeToSessions = (callback) => {
  const q = query(collection(db, "sessions"), orderBy("datetime"));
  return onSnapshot(q, (snapshot) => {
    const sessions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(sessions);
  });
};

// --- 3. USER REGISTER FOR SLOT ---
export const registerForSession = async (sessionId, user) => {
  try {
    const sessionRef = doc(db, "sessions", sessionId);
    await updateDoc(sessionRef, {
      participants: arrayUnion({
        uid: user.uid,
        name: user.displayName || user.name || user.email,
        checkedIn: false
      })
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// --- 4. CHECK-IN LOGIC ---
export const toggleCheckIn = async (sessionId, userId) => {
  try {
    const sessionRef = doc(db, "sessions", sessionId);
    const snap = await getDoc(sessionRef);
    
    if (!snap.exists()) return { success: false, error: "Session not found" };

    const data = snap.data();
    const updatedParticipants = data.participants.map(p => {
      if (p.uid === userId) {
        return { ...p, checkedIn: !p.checkedIn }; 
      }
      return p;
    });

    await updateDoc(sessionRef, { participants: updatedParticipants });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// --- 5. GET ALL USERS ---
export const getAllUsers = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "users"));
    const users = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return users;
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
};

// --- 6. DELETE SESSION (Admin) ---
export const deleteSession = async (sessionId) => {
  try {
    await deleteDoc(doc(db, "sessions", sessionId));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};



// --- 3. USER REQUEST MENTORSHIP SLOT ---
export const requestSession = async (sessionId, user) => {
  try {
    const sessionRef = doc(db, "sessions", sessionId);
    await updateDoc(sessionRef, {
      participants: arrayUnion({
        uid: user.uid,
        name: user.displayName || user.name || user.email,
        status: 'pending', // Default status
        checkedIn: false
      })
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// --- 3.5 ADMIN APPROVE/REJECT PARTICIPANT ---
export const updateParticipantStatus = async (sessionId, userId, newStatus) => {
  try {
    const sessionRef = doc(db, "sessions", sessionId);
    const snap = await getDoc(sessionRef);
    if (!snap.exists()) return { success: false, error: "Session not found" };

    const data = snap.data();
    const updatedParticipants = data.participants.map(p => {
      if (p.uid === userId) {
        return { ...p, status: newStatus };
      }
      return p;
    });

    await updateDoc(sessionRef, { participants: updatedParticipants });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// --- 7. UPDATE SESSION (Admin) ---
export const updateSessionData = async (sessionId, newData) => {
  try {
    const sessionRef = doc(db, "sessions", sessionId);
    await updateDoc(sessionRef, newData);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
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

// --- 3. USER REQUEST / RE-REQUEST MENTORSHIP SLOT ---
export const requestSession = async (sessionId, user) => {
  try {
    const sessionRef = doc(db, "sessions", sessionId);
    const snap = await getDoc(sessionRef);
    
    if (!snap.exists()) return { success: false, error: "Session not found" };

    // ─── Determine the best name to display ───
    let displayName = "Participant"; // fallback

    // Priority 1: name or teamName from users collection (most reliable)
    const userProfileSnap = await getDoc(doc(db, "users", user.uid));
    if (userProfileSnap.exists()) {
      const userData = userProfileSnap.data();
      displayName = userData.name || userData.teamName || displayName;
    }

    // Priority 2: Firebase Auth displayName (usually set with Google sign-in)
    if (user.displayName && user.displayName.trim() !== "") {
      displayName = user.displayName.trim();
    }

    // Priority 3: Cleaned-up version of email (better than full email)
    if (displayName === "Participant" && user.email) {
      const prefix = user.email.split('@')[0];
      displayName = prefix
        .replace(/[._-]/g, ' ')                     // john.doe → john doe
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }

    const data = snap.data();
    const existingUser = data.participants.find(p => p.uid === user.uid);

    if (existingUser) {
      // Already exists → update status to pending and refresh name
      const updatedParticipants = data.participants.map(p => {
        if (p.uid === user.uid) {
          return { ...p, status: 'pending', name: displayName };
        }
        return p;
      });
      await updateDoc(sessionRef, { participants: updatedParticipants });
    } else {
      // New entry
      await updateDoc(sessionRef, {
        participants: arrayUnion({
          uid: user.uid,
          name: displayName,
          status: 'pending',
          checkedIn: false
        })
      });
    }

    return { success: true };
  } catch (error) {
    console.error("requestSession error:", error);
    return { success: false, error: error.message };
  }
};

// --- 4. ADMIN UPDATE PARTICIPANT STATUS (FULLY EDITABLE) ---
export const updateParticipantStatus = async (sessionId, userId, newStatus) => {
  try {
    const sessionRef = doc(db, "sessions", sessionId);
    const snap = await getDoc(sessionRef);
    
    if (!snap.exists()) return { success: false, error: "Session not found" };

    const data = snap.data();
    const updatedParticipants = data.participants.map(p => {
      if (p.uid === userId) {
        let newCheckedIn = p.checkedIn;

        if (newStatus === 'completed') {
          newCheckedIn = true;
        } else if (newStatus === 'approved' || newStatus === 'rejected' || newStatus === 'pending') {
          newCheckedIn = false;
        }

        return { ...p, status: newStatus, checkedIn: newCheckedIn };
      }
      return p;
    });

    await updateDoc(sessionRef, { participants: updatedParticipants });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// --- 5. TOGGLE CHECK-IN (Manual override) ---
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

// --- 6. GET ALL USERS ---
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

// --- 7. UPDATE SESSION DATA (Edit details like Room/Time) ---
export const updateSessionData = async (sessionId, newData) => {
  try {
    const sessionRef = doc(db, "sessions", sessionId);
    await updateDoc(sessionRef, newData);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// --- 8. DELETE SESSION ---
export const deleteSession = async (sessionId) => {
  try {
    await deleteDoc(doc(db, "sessions", sessionId));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// --- 9. ADMIN REGISTER/ASSIGN USER (Add existing user to slot) ---
export const registerForSession = async (sessionId, user) => {
  try {
    let displayName = "Participant";

    // Try users collection first
    const userProfileSnap = await getDoc(doc(db, "users", user.id));
    if (userProfileSnap.exists()) {
      const userData = userProfileSnap.data();
      displayName = userData.name || userData.teamName || displayName;
    }

    // Then Firebase Auth displayName
    if (user.displayName && user.displayName.trim() !== "") {
      displayName = user.displayName.trim();
    }

    // Clean email fallback
    if (displayName === "Participant" && user.email) {
      const prefix = user.email.split('@')[0];
      displayName = prefix
        .replace(/[._-]/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }

    const sessionRef = doc(db, "sessions", sessionId);
    await updateDoc(sessionRef, {
      participants: arrayUnion({
        uid: user.id,
        name: displayName,
        status: 'approved',
        checkedIn: false
      })
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
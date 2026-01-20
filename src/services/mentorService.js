// src/services/mentorService.js
import { db } from "../firebase/firebaseConfig";
import { 
  collection, addDoc, updateDoc, doc, onSnapshot, arrayUnion, query, where, orderBy 
} from "firebase/firestore";

const SLOTS_COLLECTION = "mentorshipSlots";
const USERS_COLLECTION = "users";

// --- ADMIN: Create Slot ---
export const createMentorshipSlot = async (slotData) => {
  try {
    await addDoc(collection(db, SLOTS_COLLECTION), {
      ...slotData,
      status: "FREE", // Default status
      participantIds: [], // Array of User IDs
      participantNames: [], // Array of User Names (for easier display)
      checkedInIds: [], // Array of checked-in User IDs
      createdAt: new Date()
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// --- ADMIN: Check-In Participant ---
export const adminCheckInUser = async (slotId, userId, isChecked) => {
  try {
    const slotRef = doc(db, SLOTS_COLLECTION, slotId);
    let updateObj = {};

    if (isChecked) {
      // Add to checked-in list
      updateObj = { checkedInIds: arrayUnion(userId) };
    } else {
      // (Optional) Remove from checked-in list - requires complex array remove logic, 
      // for now we will just add.
    }

    await updateDoc(slotRef, updateObj);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// --- USER: Register for Slot ---
export const registerForSlot = async (slotId, userId, userName, userDocId) => {
  try {
    const slotRef = doc(db, SLOTS_COLLECTION, slotId);
    const userRef = doc(db, USERS_COLLECTION, userDocId);

    // 1. Update Slot (Add user to lists)
    await updateDoc(slotRef, {
      participantIds: arrayUnion(userId),
      participantNames: arrayUnion(userName)
    });

    // 2. Update User (Save slot reference)
    await updateDoc(userRef, {
      registeredSlotId: slotId
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// --- USER: Self Check-In ---
export const selfCheckIn = async (slotId, userId) => {
  try {
    const slotRef = doc(db, SLOTS_COLLECTION, slotId);
    await updateDoc(slotRef, {
      checkedInIds: arrayUnion(userId)
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// --- REAL-TIME LISTENERS ---

// Get all slots (Admin View)
export const subscribeToSlots = (callback) => {
  const q = query(collection(db, SLOTS_COLLECTION), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const slots = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(slots);
  });
};

// Get all users (Admin View - to see registered users list)
export const subscribeToUsers = (callback) => {
  return onSnapshot(collection(db, USERS_COLLECTION), (snapshot) => {
    const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(users);
  });
};
import { db } from './firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  query,
  where,
  onSnapshot,
  arrayUnion,
  serverTimestamp,
} from 'firebase/firestore';

// Create or get a chat between two users
export const getOrCreateChat = async (userId1, userId2) => {
  const chatsRef = collection(db, 'chats');
  const q = query(chatsRef, where('participants', 'array-contains', userId1));
  const snapshot = await getDocs(q);
  // Try to find a chat with both users
  let chat = snapshot.docs.find(doc => {
    const participants = doc.data().participants;
    return participants.includes(userId2) && participants.length === 2;
  });
  if (chat) {
    return { id: chat.id, ...chat.data() };
  }
  // Create new chat
  const chatDoc = await addDoc(chatsRef, {
    participants: [userId1, userId2],
    createdAt: serverTimestamp(),
  });
  return { id: chatDoc.id, participants: [userId1, userId2] };
};

// Send a message in a chat
export const sendMessage = async (chatId, senderId, text) => {
  const messagesRef = collection(db, 'chats', chatId, 'messages');
  await addDoc(messagesRef, {
    sender: senderId,
    text,
    timestamp: serverTimestamp(),
  });
};

// Listen for messages in a chat (real-time)
export const listenForMessages = (chatId, callback) => {
  const messagesRef = collection(db, 'chats', chatId, 'messages');
  const q = query(messagesRef, where('timestamp', '!=', null));
  return onSnapshot(q, snapshot => {
    const messages = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => a.timestamp?.toMillis?.() - b.timestamp?.toMillis?.());
    callback(messages);
  });
};

// Fetch all chats for a user
export const fetchUserChats = async (userId) => {
  const chatsRef = collection(db, 'chats');
  const q = query(chatsRef, where('participants', 'array-contains', userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Search users by username (using the username collection)
export const searchUserByUsername = async (username) => {
  const usernameDoc = await getDoc(doc(db, 'username', username));
  if (usernameDoc.exists()) {
    const userId = usernameDoc.data().uid;
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return { id: userId, ...userDoc.data() };
    }
  }
  return null;
};

// Add a friend (update user's friends array)
export const addFriend = async (userId, friendId) => {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    friends: arrayUnion(friendId),
  });
};
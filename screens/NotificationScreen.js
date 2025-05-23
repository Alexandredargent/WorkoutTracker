import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { db, auth } from '../services/firebase';
import { doc, updateDoc, arrayUnion, deleteDoc, getDoc, setDoc, collection, addDoc, serverTimestamp, query, where, getDocs, onSnapshot } from 'firebase/firestore';
const NotificationScreen = () => {
  const [friendRequests, setFriendRequests] = useState([]);

  useEffect(() => {
    const userId = auth.currentUser.uid;
    const q = query(collection(db, 'friendRequests'), where('recipientId', '==', userId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setFriendRequests(requests);
    });
    return unsubscribe;
  }, []);

  const handleAcceptRequest = async (requestId) => {
    const request = friendRequests.find(r => r.id === requestId);
    if (!request) return;

    // Add each other as friends
    const userRef = doc(db, 'users', request.recipientId);
    const senderRef = doc(db, 'users', request.senderId);
    await updateDoc(userRef, { friends: arrayUnion(request.senderId) });
    await updateDoc(senderRef, { friends: arrayUnion(request.recipientId) });

    // Check if a chat already exists
    const chatsRef = collection(db, 'chats');
    const q = query(
      chatsRef,
      where('participants', 'array-contains', request.recipientId)
    );
    const snapshot = await getDocs(q);
    let chatExists = false;
    snapshot.forEach(docSnap => {
      const participants = docSnap.data().participants;
      if (
        participants.includes(request.senderId) &&
        participants.includes(request.recipientId) &&
        participants.length === 2
      ) {
        chatExists = true;
      }
    });

    // If chat doesn't exist, create it
    if (!chatExists) {
      await addDoc(chatsRef, {
        participants: [request.senderId, request.recipientId],
        createdAt: serverTimestamp(),
      });
    }

    // Remove the friend request
    await deleteDoc(doc(db, 'friendRequests', requestId));
  };

  const handleDeclineRequest = async (requestId) => {
    await deleteDoc(doc(db, 'friendRequests', requestId));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Friend Requests</Text>
      <FlatList
        data={friendRequests}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.requestContainer}>
            <Text>{item.senderUsername} wants to be your friend!</Text>
            <View style={styles.buttonContainer}>
              <TouchableOpacity onPress={() => handleAcceptRequest(item.id)} style={styles.acceptButton}>
                <Text style={styles.buttonText}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDeclineRequest(item.id)} style={styles.declineButton}>
                <Text style={styles.buttonText}>Decline</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  requestContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
  },
  acceptButton: {
    backgroundColor: 'green',
    padding: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  declineButton: {
    backgroundColor: 'red',
    padding: 8,
    borderRadius: 4,
  },
  buttonText: {
    color: '#fff',
  },
});

export default NotificationScreen;
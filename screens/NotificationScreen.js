import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet,ImageBackground } from 'react-native';
import { db, auth } from '../services/firebase';
import { doc, updateDoc, arrayUnion, deleteDoc, getDoc, setDoc, collection, addDoc, serverTimestamp, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import theme from '../styles/theme';
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
    <ImageBackground
                 source={theme.backgroundImage.source}
                 resizeMode={theme.backgroundImage.defaultResizeMode}
                 style={styles.background}
               >
    <View style={styles.container}>
      <Text style={styles.title}>Friend Requests</Text>
      <FlatList
        data={friendRequests}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.requestContainer}>
            <Text style={styles.requestText}>
              <Text style={{ fontWeight: 'bold', color: theme.colors.primary }}>{item.senderUsername}</Text> wants to be your friend!
            </Text>
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
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
  },
  background: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  requestContainer: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    flexDirection: 'column',
    alignItems: 'flex-start',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  requestText: {
    color: theme.colors.text,
    fontSize: 16,
    marginBottom: theme.spacing.sm,
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  acceptButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 20,
    marginRight: theme.spacing.sm,
    alignItems: 'center',
  },
  declineButton: {
    backgroundColor: theme.colors.error,
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 20,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
});

export default NotificationScreen;
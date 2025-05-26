import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { db, auth } from '../services/firebase';
import { collection, query, where, getDocs, doc, getDoc, onSnapshot, addDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import theme from '../styles/theme';
import { ImageBackground } from 'react-native';

const MessagesScreen = ({ navigation }) => {
  const [chats, setChats] = useState([]);
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState([]);
  const [requestingId, setRequestingId] = useState(null);
  const [friends, setFriends] = useState([]);
  const [lastMessages, setLastMessages] = useState({});
  const userId = auth.currentUser.uid;

  // Fetch user's chats
  useEffect(() => {
    const q = query(collection(db, 'chats'), where('participants', 'array-contains', userId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setChats(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return unsubscribe;
  }, []);

  // Search users by username collection (exact match, exclude self)
  const handleSearch = async () => {
    if (!search.trim()) return;
    const q = query(
      collection(db, 'users'),
      where('username', '>=', search),
      where('username', '<=', search + '\uf8ff')
    );
    const snapshot = await getDocs(q);
    setUsers(
      snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(user => user.id !== userId)
    );
  };

  // Add friend (simplified)
  const handleAddFriend = async (friendId) => {
    setRequestingId(friendId); // show feedback
    try {
      // Prevent duplicate requests
      const q = query(
        collection(db, 'friendRequests'),
        where('senderId', '==', userId),
        where('recipientId', '==', friendId),
        where('status', '==', 'pending')
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) return;

      // Get sender username
      const senderDoc = await getDoc(doc(db, 'users', userId));
      const senderUsername = senderDoc.data().username;

      await addDoc(collection(db, 'friendRequests'), {
        senderId: userId,
        senderUsername,
        recipientId: friendId,
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      // Show confirmation and clear search/users
      Alert.alert('Invitation sent', 'Your friend invitation has been sent.');
      setSearch('');
      setUsers([]);
    } finally {
      setRequestingId(null);
    }
  };

  // Fetch user's friends
  useEffect(() => {
    const fetchFriends = async () => {
      const userDoc = await getDoc(doc(db, 'users', userId));
      const userData = userDoc.data();
      if (userData?.friends?.length) {
        const friendIds = userData.friends;
        const friendDocs = await Promise.all(
          friendIds.map(fid => getDoc(doc(db, 'users', fid)))
        );
        const friendsList = friendDocs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
        setFriends(friendsList);

        // Fetch last message for each friend
        const lastMsgs = {};
        await Promise.all(friendsList.map(async (friend) => {
          // Find chat between user and friend
          let chat = chats.find(c =>
            c.participants.length === 2 &&
            c.participants.includes(friend.id) &&
            c.participants.includes(userId)
          );
          if (!chat) return;
          // Get last message
          const msgsSnap = await getDocs(
            query(
              collection(db, 'chats', chat.id, 'messages'),
              orderBy('timestamp', 'desc'),
              // Only need the latest message
              // Firestore doesn't have limit(1) in getDocs, but you can get the first doc
            )
          );
          if (!msgsSnap.empty) {
            lastMsgs[friend.id] = msgsSnap.docs[0].data().text;
          }
        }));
        setLastMessages(lastMsgs);
      } else {
        setFriends([]);
        setLastMessages({});
      }
    };
    fetchFriends();
  }, [userId, chats]);

  const isFriend = (userIdToCheck) => friends.some(f => f.id === userIdToCheck);

  return (
    <ImageBackground
        source={theme.backgroundImage.source}
        resizeMode={theme.backgroundImage.defaultResizeMode}
        style={{ flex: 1 }}
      >
    <View style={styles.container}>
      <Text style={[theme.typography.sectionTitle, { marginTop: 0 }]}>Find Friends</Text>
      <TextInput
        placeholder="Search users..."
        value={search}
        onChangeText={setSearch}
        onSubmitEditing={handleSearch}
        style={[theme.input, { marginVertical: theme.spacing.sm, borderWidth: 1, borderColor: theme.colors.border }]}
        placeholderTextColor={theme.colors.muted}
      />
      <FlatList
        data={users}
        keyExtractor={item => item.id}
        renderItem={({ item }) => {
          const alreadyFriend = isFriend(item.id);
          return (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.sm }}>
              <Text style={[theme.typography.label, { flex: 1 }]}>{item.username}</Text>
              {alreadyFriend ? (
                <Text style={[theme.typography.empty, { color: theme.colors.muted }]}>Already a friend</Text>
              ) : (
                <TouchableOpacity
                  onPress={() => handleAddFriend(item.id)}
                  disabled={requestingId === item.id}
                  style={[
                    theme.button,
                    { backgroundColor: requestingId === item.id ? theme.colors.muted : theme.colors.primary }
                  ]}
                >
                  <Text style={theme.modal.buttonText}>
                    {requestingId === item.id ? 'Requesting...' : 'Add Friend'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          );
        }}
      />
      <Text style={[theme.typography.sectionTitle, { marginTop: theme.spacing.lg, marginBottom: theme.spacing.sm }]}>Friends</Text>
      <FlatList
        data={friends}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: theme.spacing.sm + 4,
              borderBottomWidth: 1,
              borderBottomColor: theme.colors.border,
              paddingHorizontal: theme.spacing.sm,
              backgroundColor: theme.colors.card,
              borderRadius: 8,
              marginBottom: theme.spacing.xs,
            }}
            onPress={async () => {
              let chat = chats.find(c =>
                c.participants.length === 2 &&
                c.participants.includes(item.id) &&
                c.participants.includes(userId)
              );
              if (!chat) {
                const chatDoc = await addDoc(collection(db, 'chats'), {
                  participants: [userId, item.id],
                  createdAt: serverTimestamp(),
                });
                chat = { id: chatDoc.id, participants: [userId, item.id] };
              }
              navigation.navigate('ChatScreen', { chatId: chat.id });
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={theme.typography.label}>{item.username}</Text>
              <Text style={theme.typography.empty}>
                {lastMessages[item.id] || 'No messages yet'}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={theme.typography.empty}>No friends yet.</Text>}
      />
    </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  
  container: {
  flex: 1,
  backgroundColor: 'rgba(255, 255, 255, 0.26)',
  padding: theme.spacing.md,
 },
  
});
export default MessagesScreen;
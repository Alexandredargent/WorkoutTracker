import React, { useEffect, useState } from 'react';
import { View, TextInput, Button, FlatList, Text, StyleSheet } from 'react-native';
import { db, auth } from '../services/firebase';
import { collection, addDoc, query, orderBy, onSnapshot } from 'firebase/firestore';
import theme from '../styles/theme';

const ChatScreen = ({ route }) => {
  const { chatId } = route.params;
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  useEffect(() => {
    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('timestamp', 'asc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return unsubscribe;
  }, [chatId]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    await addDoc(collection(db, 'chats', chatId, 'messages'), {
      sender: auth.currentUser.uid,
      text: input,
      timestamp: new Date()
    });
    setInput('');
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        renderItem={({ item }) => (
          <Text
            style={[
              item.sender === auth.currentUser.uid ? styles.myMsg : styles.theirMsg,
              theme.typography.label,
            ]}
          >
            {item.text}
          </Text>
        )}
        keyExtractor={item => item.id}
      />
      <View style={styles.inputRow}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Type a message..."
          style={[styles.input, theme.input]}
          placeholderTextColor={theme.colors.muted}
        />
        <Button title="Send" onPress={sendMessage} color={theme.colors.primary} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: theme.spacing.sm,
    marginRight: theme.spacing.sm,
    backgroundColor: theme.colors.card,
    color: theme.colors.text,
  },
  myMsg: {
    alignSelf: 'flex-end',
    backgroundColor: '#DCF8C6',
    padding: theme.spacing.sm,
    borderRadius: 8,
    marginVertical: 2,
    maxWidth: '80%',
  },
  theirMsg: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.card,
    padding: theme.spacing.sm,
    borderRadius: 8,
    marginVertical: 2,
    maxWidth: '80%',
  },
});

export default ChatScreen;
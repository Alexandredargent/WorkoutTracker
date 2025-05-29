import React, { useEffect, useState } from 'react';
import { View, TextInput, Button, FlatList, Text, StyleSheet, ImageBackground, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
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
    <ImageBackground
      source={theme.backgroundImage.source}
      resizeMode={theme.backgroundImage.defaultResizeMode}
      style={styles.background}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
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
            style={styles.messagesList}
            contentContainerStyle={styles.messagesContent}
            keyboardShouldPersistTaps="handled"
          />
          <View style={styles.inputRow}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Type a message..."
              style={[styles.input, theme.input]}
              placeholderTextColor={theme.colors.muted}
              returnKeyType="send"
              onSubmitEditing={sendMessage}
            />
            <Button title="Send" onPress={sendMessage} color={theme.colors.primary} />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#101924',
  },
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
  },
  messagesContent: {
    paddingVertical: theme.spacing.sm,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
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
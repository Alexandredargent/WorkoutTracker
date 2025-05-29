import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ImageBackground,
  Keyboard,
  Alert
} from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../services/firebase';
import { doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { useNavigation, useRoute } from '@react-navigation/native';
import theme from '../styles/theme';

const GoalScreen = () => {
  const [goal, setGoal] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation();
  const route = useRoute();
  const { username, email, password, weight, height, dateOfBirth } = route.params;
 

  const GOAL_OPTIONS = [
    { id: 'lose', label: 'Lose Weight', value: 'lose_weight' },
    { id: 'maintain', label: 'Maintain Weight', value: 'maintain_weight' },
    { id: 'gain', label: 'Gain Weight', value: 'gain_weight' },
  ];

  const handleSignUp = async () => {
    Keyboard.dismiss();
    
    if (!goal) {
      setError('Please select your goal');
      return;
    }
    
    setIsLoading(true);
    setError('');

    try {
      // Create auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Create Firestore batch
      const batch = writeBatch(db);

      // Create user document
      const userRef = doc(db, 'users', user.uid);
      batch.set(userRef, {
        username: username.toLowerCase(),
        email: user.email,
        dateOfBirth, // ADD THIS (should be a string like '1990-05-24')
        height: parseInt(height),
        weight: parseFloat(weight),
        goal,
        createdAt: serverTimestamp(),
      });

      // Reserve username
      const usernameRef = doc(db, 'usernames', username.toLowerCase());
      batch.set(usernameRef, {
        userId: user.uid,
        createdAt: serverTimestamp(),
      });

      // Commit both operations
      await batch.commit();

      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    } catch (error) {
      let errorMessage = 'Signup failed. Please try again.';
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'This email is already registered';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password should be at least 6 characters';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address';
          break;
      }
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ImageBackground
                     source={theme.backgroundImage.source}
                     resizeMode={theme.backgroundImage.defaultResizeMode}
                     style={styles.background}
                   >
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
      keyboardVerticalOffset={Platform.select({ ios: 60, android: 0 })}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={Keyboard.dismiss}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Set Your Goal</Text>
          <View style={styles.inputContainer}>
            {GOAL_OPTIONS.map((option) => (
              <TouchableOpacity 
                key={option.id}
                style={[
                  styles.option, 
                  goal === option.value && styles.selectedOption
                ]} 
                onPress={() => setGoal(option.value)}
              >
                <Text style={styles.optionText}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <TouchableOpacity 
            style={[styles.button, (isLoading || !goal) && styles.disabledButton]} 
            onPress={handleSignUp}
            disabled={isLoading || !goal}
          >
            <Text style={styles.buttonText}>
              {isLoading ? 'Creating Account...' : 'Sign Up'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.link}>Back</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    
  },
  background: {
    flex: 1,
    backgroundColor: '#101924',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: theme.spacing.xl * 2,
  },
  content: {
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  title: {
    ...theme.typography.sectionTitle,
    fontSize: 24,
    marginBottom: theme.spacing.lg,
  },
  inputContainer: {
    width: '100%',
    marginBottom: theme.spacing.lg,
  },
  option: {
    backgroundColor: theme.colors.card,
    padding: theme.spacing.lg,
    borderRadius: 10,
    marginVertical: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    width: '100%',
  },
  selectedOption: {
    borderColor: theme.colors.primary,
    backgroundColor: '#f0f0ff',
    borderWidth: 2,
  },
  optionText: {
    fontSize: 16,
    color: theme.colors.text,
    textAlign: 'center',
  },
  button: {
    ...theme.button,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: theme.spacing.sm,
    width: '100%',
  },
  disabledButton: {
    backgroundColor: '#808080',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  error: {
    color: theme.colors.error,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  link: {
    color: '#007AFF',
    marginTop: theme.spacing.lg,
    textAlign: 'center',
    fontSize: 16,
  },
});

export default GoalScreen;
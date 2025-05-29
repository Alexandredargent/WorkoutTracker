import React, { useState, useEffect } from 'react';
import { 
  View, 
  TextInput, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ScrollView,
  ImageBackground,
  Keyboard,
  Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { db } from '../services/firebase';
import { doc, getDoc, collection, writeBatch } from 'firebase/firestore';
import theme from '../styles/theme';

const SignUpScreen = ({ setUser }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [usernameValid, setUsernameValid] = useState(false);
  const navigation = useNavigation();
  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validateUsername = (username) => {
    const re = /^[a-zA-Z0-9_]{3,20}$/;
    return re.test(username);
  };

  const validatePassword = (password) => {
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    if (!/[A-Z]/.test(password)) {
      setError('Password must contain at least one uppercase letter');
      return false;
    }
    if (!/[0-9]/.test(password)) {
      setError('Password must contain at least one number');
      return false;
    }
    return true;
  };

  const checkUsernameAvailability = async (username) => {
    try {
      const usernameDoc = await getDoc(doc(db, 'usernames', username));
      return !usernameDoc.exists();
    } catch (error) {
      console.error('Username check error:', error);
      return false;
    }
  };

  const handleUsernameChange = async (text) => {
    const formattedUsername = text.toLowerCase().trim();
    setUsername(formattedUsername);
    
    if (!validateUsername(formattedUsername)) {
      setError('Username must be 3-20 characters (letters, numbers, _)');
      setUsernameValid(false);
      return;
    }
    
    const isAvailable = await checkUsernameAvailability(formattedUsername);
    setUsernameValid(isAvailable);
    setError(isAvailable ? '' : 'Username already taken');
  };

  const handleNext = async () => {
    Keyboard.dismiss();
    
    if (!username || !email || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (!usernameValid) {
      setError('Please choose a valid username');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }
    if (!validatePassword(password)) {
      return; // Error already set by validatePassword
    }

    setIsLoading(true);
    setError('');

    try {
      navigation.navigate('FitnessProfileScreen', { 
        username, 
        email, 
        password 
      });
    } catch (error) {
      setError('Error proceeding to next step');
      console.error('Navigation error:', error);
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
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
    >
      
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={Keyboard.dismiss}
      >
        
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          <Image
            source={{ uri: '/placeholder.svg?height=100&width=100' }}
            style={styles.logo}
          />
          <Text style={styles.title}>Create an Account</Text>
          <View style={styles.inputContainer}>
            <TextInput
              placeholder="Username"
              value={username}
              onChangeText={handleUsernameChange}
              style={[
                styles.input, 
                username && !usernameValid && styles.invalidInput
              ]}
              autoCapitalize="none"
            />
            <TextInput
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={styles.input}
            />
          </View>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <TouchableOpacity 
            style={[
              styles.button, 
              (!usernameValid || isLoading) && styles.disabledButton
            ]} 
            onPress={handleNext}
            disabled={!usernameValid || isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? 'Loading...' : 'Next'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.replace('Login')}>
  <Text style={styles.link}>Back</Text>
</TouchableOpacity>

        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: theme.spacing.xl * 2,
  },
  
  content: {
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: theme.spacing.lg,
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
  input: {
    ...theme.input,
    backgroundColor: '#fff',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: 10,
    marginTop: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    fontSize: 16,
  },
  invalidInput: {
    borderColor: theme.colors.error,
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
    marginTop: theme.spacing.md,
    textAlign: 'center',
    fontSize: 16,
  },
});

export default SignUpScreen;
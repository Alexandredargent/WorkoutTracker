import React, { useState, useEffect } from 'react';
import { ImageBackground } from 'react-native';

import { 
  View, 
  TextInput, 
  Text, 
  StyleSheet, 
  Alert, 
  TouchableOpacity, 
  Image,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Keyboard,
  ScrollView
} from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';
import theme from '../styles/theme';

const LoginScreen = ({ navigation, setUser }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleLogin = async () => {
    Keyboard.dismiss();
    setIsLoading(true);
    setError('');
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      setUser(userCredential.user);
      navigation.navigate('Main');
    } catch (error) {
      setError('Invalid email or password. Please try again.');
      Alert.alert('Login Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNavigation = (screenName) => {
    Keyboard.dismiss();
    navigation.navigate(screenName);
  };

  return (
    
  <ImageBackground
  source={theme.backgroundImage.source}
  resizeMode={theme.backgroundImage.defaultResizeMode}
  style={styles.backgroundImage}
>
  <KeyboardAvoidingView
    behavior={Platform.OS === "ios" ? "padding" : "height"}
    style={styles.keyboardAvoiding}
    keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
  >
    <View style={styles.content}>
      <Animated.View style={{ opacity: fadeAnim, alignItems: 'center', width: '100%' }}>
        {/* <Image
          source={require('../assets/Applogo.png')}
             style={styles.logo}
        /> */}
            
        <Text style={styles.title}>Fittrack</Text>
        <View style={styles.inputContainer}>
          <TextInput
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
            onSubmitEditing={handleLogin}
          />
          <TextInput
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
            onSubmitEditing={handleLogin}
          />
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Logging in...' : 'Log In'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleNavigation('SignUp')}
          style={styles.linkButton}
        >
          <Text style={theme.link}>
            Don't have an account? Sign Up
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  </KeyboardAvoidingView>
</ImageBackground>





  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    
  },
  keyboardAvoiding: {
  flex: 1,
},

backgroundImage: {
  flex: 1,
},

content: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  padding: theme.spacing.lg,
},


  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  
  logo: {
    width: 200,
    height: 200,
    
  },
  title: {
    ...theme.typography.sectionTitleLogo,    
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
  button: {
    ...theme.button,
    padding: 15,
    borderRadius: 10,
    marginTop: theme.spacing.sm,
    width: '100%',
  },
  buttonDisabled: {
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
  
  linkButton: {
    marginTop: theme.spacing.lg,
  },
});

export default LoginScreen;
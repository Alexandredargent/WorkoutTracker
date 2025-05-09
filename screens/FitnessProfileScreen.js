import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ScrollView,
  Keyboard
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

const FitnessProfileScreen = () => {
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [activityLevel, setActivityLevel] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation();
  const route = useRoute();
  const { username, email, password } = route.params;
  const fadeAnim = useState(new Animated.Value(0))[0];

  const ACTIVITY_OPTIONS = [
    { label: "Sedentary (no sport)", value: "sedentary" },
    { label: "Light (1–3 times/week)", value: "light" },
    { label: "Moderate (3–5 times/week)", value: "moderate" },
    { label: "Intense (6–7 times/week)", value: "intense" },
    { label: "Very intense (physical job or 2x training)", value: "very_intense" },
  ];

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleNext = () => {
    if (!weight || !height || !age || !gender || !activityLevel) {
      setError('Please fill in all fields');
      return;
    }
    setError('');
    navigation.navigate('GoalScreen', {
      username,
      email,
      password,
      weight,
      height,
      age,
      gender,
      activityLevel
    });
  };

  return (
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
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          <Text style={styles.title}>Fitness Profile</Text>
          <View style={styles.inputContainer}>

            {/* Gender Selection */}
            <Text style={styles.label}>Gender</Text>
            <View style={styles.genderOptions}>
              {['male', 'female'].map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[styles.genderOption, gender === g && styles.selectedOption]}
                  onPress={() => setGender(g)}
                >
                  <Text style={styles.genderText}>{g === 'male' ? 'Male' : 'Female'}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Weight, Height, Age */}
            <TextInput
              placeholder="Weight (kg)"
              value={weight}
              onChangeText={text => setWeight(text.replace(/[^0-9.]/g, ''))}
              style={styles.input}
              keyboardType="numeric"
              maxLength={5}
            />
            <TextInput
              placeholder="Height (cm)"
              value={height}
              onChangeText={text => setHeight(text.replace(/[^0-9]/g, ''))}
              style={styles.input}
              keyboardType="numeric"
              maxLength={3}
            />
            <TextInput
              placeholder="Age"
              value={age}
              onChangeText={text => setAge(text.replace(/[^0-9]/g, ''))}
              style={styles.input}
              keyboardType="numeric"
              maxLength={3}
            />

            {/* Activity Level */}
            <Text style={styles.label}>Activity Level</Text>
            {ACTIVITY_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.genderOption,
                  activityLevel === option.value && styles.selectedOption
                ]}
                onPress={() => setActivityLevel(option.value)}
              >
                <Text style={styles.genderText}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity
            style={styles.button}
            onPress={handleNext}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? 'Loading...' : 'Next'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.link}>Back</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', paddingBottom: 100 },
  content: { alignItems: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#333' },
  inputContainer: { width: '100%', marginBottom: 20 },
  input: {
    backgroundColor: 'white',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 15,
    marginBottom: 5,
    color: '#333',
  },
  genderOptions: { flexDirection: 'column', marginBottom: 10 },
  genderOption: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 10,
    marginVertical: 5,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  selectedOption: {
    borderColor: '#232799',
    backgroundColor: '#f0f0ff',
    borderWidth: 2,
  },
  genderText: { fontSize: 16, color: '#333', textAlign: 'center' },
  button: {
    backgroundColor: '#232799',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    width: '100%',
  },
  buttonText: { color: 'white', fontWeight: '700', fontSize: 16 },
  error: { color: 'red', marginBottom: 10, textAlign: 'center' },
  link: { color: '#007AFF', marginTop: 15, textAlign: 'center', fontSize: 16 },
});

export default FitnessProfileScreen;

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
  ImageBackground,
  Keyboard
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import theme from '../styles/theme';
import DateTimePicker from '@react-native-community/datetimepicker';

const FitnessProfileScreen = () => {
 
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('');
  const [activityLevel, setActivityLevel] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
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
    if (!weight || !height || !dateOfBirth || !gender || !activityLevel) {
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
      dateOfBirth,
      gender,
      activityLevel
    });
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

            {/* Weight, Height, Date of Birth */}
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
            <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.input}>
              <Text style={{ color: dateOfBirth ? theme.colors.text : '#888' }}>
                {dateOfBirth ? dateOfBirth : 'Date of Birth'}
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={dateOfBirth ? new Date(dateOfBirth) : new Date(2000, 0, 1)}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) {
                    setDateOfBirth(selectedDate.toISOString().split('T')[0]);
                  }
                }}
                maximumDate={new Date()}
              />
            )}

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
  input: {
    ...theme.input,
    backgroundColor: theme.colors.card,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: 10,
    marginTop: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    fontSize: 16,
  },
  label: {
    ...theme.typography.label,
    fontWeight: '600',
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xs,
  },
  genderOptions: {
    flexDirection: 'column',
    marginBottom: theme.spacing.sm,
  },
  genderOption: {
    backgroundColor: theme.colors.card,
    padding: theme.spacing.md,
    borderRadius: 10,
    marginVertical: theme.spacing.xs,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  selectedOption: {
    borderColor: theme.colors.primary,
    backgroundColor: '#f0f0ff',
    borderWidth: 2,
  },
  genderText: {
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

export default FitnessProfileScreen;

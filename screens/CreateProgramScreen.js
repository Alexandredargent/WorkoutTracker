// d:\Applications\WorkoutTracker\screens\CreateProgramScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import theme from '../styles/theme';
import { Ionicons } from '@expo/vector-icons';
import { addUserProgram } from '../services/firebaseExerciseService'; // Import addUserProgram
import { auth } from '../services/firebase';

const CreateProgramScreen = ({ navigation, route }) => {
  const [programName, setProgramName] = useState('');
  const [programDescription, setProgramDescription] = useState('');
  const [selectedExercises, setSelectedExercises] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
   
  // Handle the selected exercise returned from ExerciseListScreen
  useEffect(() => {
    if (route.params?.selectedExerciseForProgram) {
      const newExercise = route.params.selectedExerciseForProgram;
      // Check if the exercise (based on ID) is not already in the list
      if (!selectedExercises.find(ex => ex.id === newExercise.id)) {
        setSelectedExercises(prevExercises => [
          ...prevExercises,
          { ...newExercise, sets: '', reps: '', notes: '' }, // Add fields for sets/reps
        ]);
      }
      // Clear the param to avoid adding it again on re-focus
      navigation.setParams({ selectedExerciseForProgram: null });
    }
  }, [route.params?.selectedExerciseForProgram, navigation]);

  const handleAddExercisePress = useCallback(() => {
    navigation.navigate('ExerciseListScreen', {
      mode: 'selectForProgram',
      originRoute: 'CreateProgramScreen', // To know where to return the exercise
    });
  }, [navigation]);

  const handleUpdateExerciseDetail = useCallback((id, field, value) => {
    setSelectedExercises(currentExercises =>
      currentExercises.map(ex =>
        ex.id === id ? { ...ex, [field]: value } : ex
      )
    );
  }, []);

  const handleRemoveExercise = useCallback((id) => {
    setSelectedExercises(currentExercises =>
      currentExercises.filter(ex => ex.id !== id)
    );
  }, []);

  const handleSaveProgram = async () => {
    if (!programName.trim()) {
      Alert.alert('Error', 'Please enter a name for your program.');
      return;
    }
    if (selectedExercises.length === 0) {
      Alert.alert('Error', 'Please add at least one exercise to your program.');
      return;
    }

    const userId = auth.currentUser?.uid;
    if (!userId) {
      Alert.alert('Error', 'User not logged in.');
      return;
    }

    setIsLoading(true);
    const programData = {
      name: programName.trim(),
      description: programDescription.trim(),
      exercises: selectedExercises.map(ex => ({
        exerciseId: ex.id, // The ID of the original exercise
        name: ex.Name,     // The name of the exercise
        sets: ex.sets || '3', // Default or entered value
        reps: ex.reps || '10', // Default or entered value
        notes: ex.notes || '',
      })),
      // createdAt and updatedAt will be handled by addUserProgram
    };

    try {
      await addUserProgram(userId, programData);
      Alert.alert('Success', 'Program saved successfully!');
      navigation.goBack(); // Or navigate to the updated programs screen
    } catch (error) {
      console.error('Error saving program:', error);
      Alert.alert('Error', 'Could not save program.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderExerciseItem = useCallback(({ item }) => (
    <View style={styles.exerciseItemContainer}>
      <Text style={styles.exerciseName}>{item.Name}</Text>
      <View style={styles.exerciseInputs}>
        <TextInput
          style={styles.exerciseDetailInput}
          placeholder="Sets (e.g., 3)"
          placeholderTextColor={theme.colors.card} 
          value={item.sets}
          onChangeText={text => handleUpdateExerciseDetail(item.id, 'sets', text)}
          keyboardType="numeric"
          blurOnSubmit={false}
        />
        <TextInput
          style={styles.exerciseDetailInput}
          placeholder="Reps (e.g., 10-12)"
          placeholderTextColor={theme.colors.card} 
          value={item.reps}
          onChangeText={text => handleUpdateExerciseDetail(item.id, 'reps', text)}
          blurOnSubmit={false}
        />
      </View>
      <TextInput
        style={[styles.exerciseDetailInput, styles.notesInput]}
        placeholder="Notes (optional)"
        placeholderTextColor={theme.colors.card} 
        value={item.notes}
        onChangeText={text => handleUpdateExerciseDetail(item.id, 'notes', text)}
        multiline
        blurOnSubmit={false}
      />
      <TouchableOpacity onPress={() => handleRemoveExercise(item.id)} style={styles.removeExerciseButton}>
        <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
      </TouchableOpacity>
    </View>
  ), [handleUpdateExerciseDetail, handleRemoveExercise]);

  const renderListFooter = useCallback(() => (
    <View style={styles.form}> 
      <TouchableOpacity style={styles.addButton} onPress={handleAddExercisePress}>
        <Ionicons name="add-outline" size={22} color="#fff" />
        <Text style={styles.addButtonText}>Add Exercise</Text>
      </TouchableOpacity>
    </View>
  ), [handleAddExercisePress]);

  const keyExtractor = useCallback((item) => item.id.toString(), []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        {/* Form inputs outside of FlatList - this prevents keyboard dismissal */}
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Program Name"
            value={programName}
            onChangeText={setProgramName}
            placeholderTextColor={theme.colors.muted}
            blurOnSubmit={false}
            returnKeyType="next"
          />
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Description (optional)"
            value={programDescription}
            onChangeText={setProgramDescription}
            multiline
            numberOfLines={3}
            placeholderTextColor={theme.colors.muted} 
            blurOnSubmit={false}
            returnKeyType="done"
          />
          <Text style={styles.subHeader}>Exercises</Text>
        </View>

        {/* FlatList for exercises only */}
        <FlatList
          data={selectedExercises}
          renderItem={renderExerciseItem}
          keyExtractor={keyExtractor}
          ListEmptyComponent={<Text style={styles.emptyListText}>No exercises added.</Text>}
          ListFooterComponent={renderListFooter}
          contentContainerStyle={styles.listContentContainer}
          keyboardShouldPersistTaps="handled"
          removeClippedSubviews={false}
          style={styles.exercisesList}
        />

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.saveButton, isLoading && styles.disabledButton]}
            onPress={handleSaveProgram}
            disabled={isLoading}
          >
            <Text style={styles.saveButtonText}>
              {isLoading ? 'Saving...' : 'Save Program'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
  },
  exercisesList: {
    flex: 1,
  },
  listContentContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    padding: theme.spacing.xs,
  },
  title: {
    fontSize: theme.modal.title.fontSize,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  form: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    backgroundColor: theme.colors.background,
  },
  input: {
    backgroundColor: theme.colors.card,
    color: theme.colors.text,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm + 2,
    borderRadius: theme.input.borderRadius,
    fontSize: 16,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  subHeader: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  addButton: {
    flexDirection: 'row',
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.card.borderRadius,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.md,
  },
  addButtonText: {
    color: theme.modal.buttonText.color,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: theme.spacing.sm,
  },
  emptyListText: {
    textAlign: 'center',
    color: theme.colors.muted,
    marginTop: theme.spacing.md,
    fontSize: 15,
    paddingHorizontal: theme.spacing.lg,
  },
  exerciseItemContainer: {
    backgroundColor: theme.colors.card,
    padding: theme.spacing.md,
    borderRadius: theme.input.borderRadius,
    marginBottom: theme.spacing.sm,
    marginHorizontal: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  exerciseInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  exerciseDetailInput: {
    backgroundColor: theme.colors.background,
    color: theme.colors.text,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.input.borderRadius,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs + 2,
    fontSize: 14,
    flex: 1,
    marginHorizontal: 2,
  },
  notesInput: {
    marginTop: theme.spacing.xs,
    minHeight: 40,
    textAlignVertical: 'top',
    marginHorizontal: 0,
  },
  removeExerciseButton: {
    position: 'absolute',
    top: theme.spacing.sm,
    right: theme.spacing.sm,
    padding: theme.spacing.xs,
  },
  footer: {
    padding: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.button.paddingHorizontal,
    borderRadius: theme.button.borderRadius,
    alignItems: 'center',
  },
  saveButtonText: {
    color: theme.modal.buttonText.color,
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.7,
  },
});

export default CreateProgramScreen;

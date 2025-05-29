// d:\Applications\WorkoutTracker\screens\CreateProgramScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import { getMuscleIcon } from '../utils/muscleIcons';
import MuscleGroupSelector from '../components/MuscleGroupSelector';



import {
  View,
  Text,
  Image,
  TextInput,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ImageBackground,
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
  
  // Add muscle group selection state:
  const [selectedMuscleGroups, setSelectedMuscleGroups] = useState([]);
  const [muscleGroupSelectorVisible, setMuscleGroupSelectorVisible] = useState(false);

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
      muscleGroups: selectedMuscleGroups, // Add muscle groups to program data
      exercises: selectedExercises.map(ex => {
  const exerciseObj = {
    exerciseId: ex.id || '',
    name: ex.name || ex.Name || '', // accepte name OU Name
    "Target Muscle Group": ex["Target Muscle Group"] || '',
    "Primary Equipment": ex["Primary Equipment"] || '',
    "Difficulty Level": ex["Difficulty Level"] || '',
    sets: ex.sets || '3',
    reps: ex.reps || '10',
    notes: ex.notes || '',
  };
  // Supprime tout champ encore undefined, au cas où
  Object.keys(exerciseObj).forEach(key => {
    if (exerciseObj[key] === undefined) {
      exerciseObj[key] = '';
    }
  });
  return exerciseObj;
}),

  };

  try {
    console.log('Will save program with data:', programData);

    await addUserProgram(userId, programData);
    Alert.alert('Success', 'Program saved successfully!');
    navigation.goBack();
  } catch (error) {
    console.error('Error saving program:', error);
    Alert.alert('Error', 'Could not save program.');
  } finally {
    setIsLoading(false);
  }
};
  
  const renderExerciseItem = useCallback(({ item }) => {
  const targetMuscleGroup = item["Target Muscle Group"] || item.targetMuscleGroup || '';
  const imageSource = getMuscleIcon(targetMuscleGroup);

  return (
    
    <View style={styles.exerciseItemContainer}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Image source={imageSource} style={{ width: 60, height: 60, marginRight: 12 }} resizeMode="contain" />
        <View style={{ flex: 1 }}>
          <Text style={styles.exerciseName}>{item.Name || item.name || 'Unnamed'}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 }}>
            {targetMuscleGroup ? (
              <View style={styles.tag}>
                <Text style={styles.tagText}>{targetMuscleGroup}</Text>
              </View>
            ) : null}
            {(item["Primary Equipment"] || item.primaryEquipment) ? (
              <View style={styles.tag}>
                <Text style={styles.tagText}>{item["Primary Equipment"] || item.primaryEquipment}</Text>
              </View>
            ) : null}
            {(item["Difficulty Level"] || item.difficultyLevel) ? (
              <View style={styles.tag}>
                <Text style={styles.tagText}>{item["Difficulty Level"] || item.difficultyLevel}</Text>
              </View>
            ) : null}
          </View>
        </View>
        <TouchableOpacity onPress={() => handleRemoveExercise(item.id)} style={styles.removeExerciseButton}>
          <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
        </TouchableOpacity>
      </View>

      {/* Rest of the component remains the same */}
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
    </View>
  );
}, [handleUpdateExerciseDetail, handleRemoveExercise]);

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
    <ImageBackground
      source={theme.backgroundImage.source}
      resizeMode={theme.backgroundImage.defaultResizeMode}
      style={{ flex: 1 }} // <-- assure le fond sur tout l'écran
    >
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
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

            {/* Muscle Groups Selection */}
            <View style={styles.muscleGroupSection}>
              <Text style={styles.muscleGroupLabel}>Target Muscle Groups (up to 3)</Text>
              <TouchableOpacity
                style={styles.muscleGroupSelector}
                onPress={() => setMuscleGroupSelectorVisible(true)}
              >
                <View style={styles.selectedMuscleGroups}>
                  {selectedMuscleGroups.length === 0 ? (
                    <Text style={styles.muscleGroupPlaceholder}>Tap to select muscle groups</Text>
                  ) : (
                    <View style={styles.muscleGroupDisplay}>
                      {selectedMuscleGroups.map((muscleGroup, index) => (
                        <View key={muscleGroup} style={styles.muscleGroupChip}>
                          <Image 
                            source={getMuscleIcon(muscleGroup)} 
                            style={styles.muscleGroupChipImage}
                            resizeMode="contain"
                          />
                          <Text style={styles.muscleGroupChipText}>{muscleGroup}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.muted} />
              </TouchableOpacity>
            </View>

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

          {/* Muscle Group Selector Modal */}
          <MuscleGroupSelector
            selectedMuscleGroups={selectedMuscleGroups}
            onSelectMuscleGroups={setSelectedMuscleGroups}
            visible={muscleGroupSelectorVisible}
            onClose={() => setMuscleGroupSelectorVisible(false)}
          />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    
  },
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    backgroundColor: '#101924',
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
  borderTopWidth: 0, // <--- plus de ligne
  // borderTopColor: theme.colors.border,
  backgroundColor: 'white',
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
  muscleGroupSection: {
    marginBottom: theme.spacing.md,
  },
  muscleGroupLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  muscleGroupSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.card,
    padding: theme.spacing.md,
    borderRadius: theme.input.borderRadius,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minHeight: 60,
  },
  selectedMuscleGroups: {
    flex: 1,
  },
  muscleGroupPlaceholder: {
    fontSize: 14,
    color: theme.colors.muted,
  },
  muscleGroupDisplay: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  muscleGroupChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary + '15',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  muscleGroupChipImage: {
    width: 20,
    height: 20,
    marginRight: 6,
  },
  muscleGroupChipText: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '500',
  },
});

export default CreateProgramScreen;

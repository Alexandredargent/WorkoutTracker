import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  Image,
  TextInput,
  Modal,
  ScrollView,
  ImageBackground,
} from 'react-native';
import theme from '../styles/theme';
import { fetchUserProgram, updateUserProgram, deleteUserProgram } from '../services/firebaseExerciseService';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../services/firebase';
import { applyProgramToDate } from '../services/diaryService';

import { useFocusEffect } from '@react-navigation/native';
function normalizeExerciseFields(ex) {
  return {
    exerciseId: ex.exerciseId || ex.id,
    name: ex.name || ex.Name || 'Unnamed',
    targetMuscleGroup: ex.targetMuscleGroup || ex["Target Muscle Group"] || '',
    primaryEquipment: ex.primaryEquipment || ex["Primary Equipment"] || '',
    difficultyLevel: ex.difficultyLevel || ex["Difficulty Level"] || '',
    sets: ex.sets || '3',
    reps: ex.reps || '10',
    notes: ex.notes || '',
  };
}


const muscleIcons = {
  Abdominals: require('../assets/Frontbodymuscles_EPS_PNG_SVG/PNG files/Rectus Abdominus.png'),
  Abductors: require('../assets/Backbodymuscles_EPS_PNG_SVG/PNG files/Gluteus medius.png'),
  Adductors: require('../assets/Frontbodymuscles_EPS_PNG_SVG/PNG files/Adductor Longus and Pectineus.png'),
  Back: require('../assets/Backbodymuscles_EPS_PNG_SVG/PNG files/Lattisimus dorsi.png'),
  Biceps: require('../assets/Frontbodymuscles_EPS_PNG_SVG/PNG files/Biceps brachii.png'),
  Calves: require('../assets/Frontbodymuscles_EPS_PNG_SVG/PNG files/Gastrocnemius (calf).png'),
  Chest: require('../assets/Frontbodymuscles_EPS_PNG_SVG/PNG files/Pectoralis Major.png'),
  Forearms: require('../assets/Frontbodymuscles_EPS_PNG_SVG/PNG files/Brachioradialis.png'),
  Glutes: require('../assets/Backbodymuscles_EPS_PNG_SVG/PNG files/Gluteus maximus.png'),
  Hamstrings: require('../assets/Backbodymuscles_EPS_PNG_SVG/PNG files/Biceps fermoris.png'),
  "Hip Flexors": require('../assets/Frontbodymuscles_EPS_PNG_SVG/PNG files/Sartorius.png'),
  Neck: require('../assets/Frontbodymuscles_EPS_PNG_SVG/PNG files/Omohyoid.png'),
  Quadriceps: require('../assets/Frontbodymuscles_EPS_PNG_SVG/PNG files/Rectus femoris.png'),
  Shins: require('../assets/Frontbodymuscles_EPS_PNG_SVG/PNG files/Soleus.png'),
  Shoulders: require('../assets/Frontbodymuscles_EPS_PNG_SVG/PNG files/Deltoids.png'),
  Trapezius: require('../assets/Frontbodymuscles_EPS_PNG_SVG/PNG files/Trapezius.png'),
  Triceps: require('../assets/Backbodymuscles_EPS_PNG_SVG/PNG files/Triceps Brachii ( long head, lateral head ).png'),
  Default: require('../assets/Frontbodymuscles_EPS_PNG_SVG/PNG files/Body black outline with white background.png'),
};

const ProgramDetailScreen = ({ navigation, route }) => {
  const { programId, programName } = route.params;
  const [program, setProgram] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProgram, setEditedProgram] = useState({
    name: '',
    description: '',
  });
  const [editExerciseModalVisible, setEditExerciseModalVisible] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [editedExercise, setEditedExercise] = useState({
    sets: '',
    reps: '',
    notes: '',
  });

  const userId = auth.currentUser?.uid;

  const loadProgram = useCallback(async () => {
    if (!userId || !programId) return;
    
    setIsLoading(true);
    try {
      const programData = await fetchUserProgram(userId, programId);
      setProgram({
  ...programData,
  exercises: Array.isArray(programData.exercises) ? programData.exercises : [],
});

      setEditedProgram({
        name: programData.name || '',
        description: programData.description || '',
      });
    } catch (error) {
      console.error('Error loading program:', error);
      Alert.alert('Error', 'Unable to load program details.');
    } finally {
      setIsLoading(false);
    }
  }, [userId, programId]);

  useFocusEffect(
    useCallback(() => {
      loadProgram();
    }, [loadProgram])
  );

  const handleSaveProgram = async () => {
    if (!editedProgram.name.trim()) {
      Alert.alert('Error', 'Please enter a program name.');
      return;
    }

    try {
      const updatedProgram = {
        ...program,
        name: editedProgram.name.trim(),
        description: editedProgram.description.trim(),
        updatedAt: new Date().toISOString(),
      };

      await updateUserProgram(userId, programId, updatedProgram);
      setProgram(updatedProgram);
      setIsEditing(false);
      Alert.alert('Success', 'Program updated successfully!');
    } catch (error) {
      console.error('Error updating program:', error);
      Alert.alert('Error', 'Failed to update program.');
    }
  };

  const handleDeleteProgram = () => {
    Alert.alert(
      'Delete Program',
      'Are you sure you want to delete this program? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteUserProgram(userId, programId);
              Alert.alert('Success', 'Program deleted successfully!');
              navigation.goBack();
            } catch (error) {
              console.error('Error deleting program:', error);
              Alert.alert('Error', 'Failed to delete program.');
            }
          },
        },
      ]
    );
  };

  const handleEditExercise = (exercise, index) => {
    setSelectedExercise({ ...exercise, index });
    setEditedExercise({
      sets: exercise.sets || '',
      reps: exercise.reps || '',
      notes: exercise.notes || '',
    });
    setEditExerciseModalVisible(true);
  };

  const handleSaveExercise = async () => {
    if (!selectedExercise) return;

    try {
      const updatedExercises = [...program.exercises];
      updatedExercises[selectedExercise.index] = {
        ...updatedExercises[selectedExercise.index],
        sets: editedExercise.sets,
        reps: editedExercise.reps,
        notes: editedExercise.notes,
      };

      const updatedProgram = {
        ...program,
        exercises: updatedExercises,
        updatedAt: new Date().toISOString(),
      };

      await updateUserProgram(userId, programId, updatedProgram);
      setProgram(updatedProgram);
      setEditExerciseModalVisible(false);
      setSelectedExercise(null);
      Alert.alert('Success', 'Exercise updated successfully!');
    } catch (error) {
      console.error('Error updating exercise:', error);
      Alert.alert('Error', 'Failed to update exercise.');
    }
  };

  const handleRemoveExercise = (index) => {
    Alert.alert(
      'Remove Exercise',
      'Are you sure you want to remove this exercise from the program?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedExercises = program.exercises.filter((_, i) => i !== index);
              const updatedProgram = {
                ...program,
                exercises: updatedExercises,
                updatedAt: new Date().toISOString(),
              };

              await updateUserProgram(userId, programId, updatedProgram);
              setProgram(updatedProgram);
              Alert.alert('Success', 'Exercise removed successfully!');
            } catch (error) {
              console.error('Error removing exercise:', error);
              Alert.alert('Error', 'Failed to remove exercise.');
            }
          },
        },
      ]
    );
  };

  const handleAddExercise = () => {
    navigation.navigate('ExerciseListScreen', {
      mode: 'selectForProgram',
      originRoute: 'ProgramDetailScreen',
      programId: programId,
    });
  };

useEffect(() => {
  if (route.params?.selectedExerciseForProgram && program) {
    const newExercise = route.params.selectedExerciseForProgram;

    // Toujours travailler sur un tableau propre et normalisé
    const currentExercises = Array.isArray(program.exercises) ? program.exercises.map(normalizeExerciseFields) : [];

    if (!currentExercises.find(ex => ex.exerciseId === newExercise.id)) {
      // On ajoute l'exercice normalisé à la liste normalisée
      const updatedExercises = [
        ...currentExercises,
        normalizeExerciseFields(newExercise)
      ];

      const updatedProgram = {
        ...program,
        exercises: updatedExercises,
        updatedAt: new Date().toISOString(),
      };

      updateUserProgram(userId, programId, updatedProgram)
        .then(() => {
          setProgram(updatedProgram);
          Alert.alert('Success', 'Exercise added to program!');
        })
        .catch((error) => {
          console.error('Error adding exercise:', error);
          Alert.alert('Error', 'Failed to add exercise to program.');
        });
    } else {
      Alert.alert('Info', 'This exercise is already in the program.');
    }

    // Clear the param
    navigation.setParams({ selectedExerciseForProgram: null });
  }
}, [route.params?.selectedExerciseForProgram, program, userId, programId, navigation]);


  const renderExerciseItem = ({ item, index }) => {
  const imageSource = muscleIcons[item.targetMuscleGroup] || muscleIcons.Default;

  return (
    <View style={styles.exerciseItem}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Image
          source={imageSource}
          style={{ width: 60, height: 60, marginRight: 12 }}
          resizeMode="contain"
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.exerciseName}>{item.name}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 }}>
            {item.targetMuscleGroup ? (
              <View style={styles.tag}>
                <Text style={styles.tagText}>{item.targetMuscleGroup}</Text>
              </View>
            ) : null}
            {item.primaryEquipment ? (
              <View style={styles.tag}>
                <Text style={styles.tagText}>{item.primaryEquipment}</Text>
              </View>
            ) : null}
            {item.difficultyLevel ? (
              <View style={styles.tag}>
                <Text style={styles.tagText}>{item.difficultyLevel}</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.exerciseActions}>
          <TouchableOpacity
            onPress={() => handleEditExercise(item, index)}
            style={styles.actionButton}
          >
            <Ionicons name="create-outline" size={20} color={theme.colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleRemoveExercise(index)}
            style={styles.actionButton}
          >
            <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.exerciseDetails}>
        <View style={styles.exerciseDetailRow}>
          <Text style={styles.exerciseDetailLabel}>Sets:</Text>
          <Text style={styles.exerciseDetailValue}>{item.sets || 'Not set'}</Text>
        </View>
        <View style={styles.exerciseDetailRow}>
          <Text style={styles.exerciseDetailLabel}>Reps:</Text>
          <Text style={styles.exerciseDetailValue}>{item.reps || 'Not set'}</Text>
        </View>
        {item.notes ? (
          <View style={styles.exerciseDetailRow}>
            <Text style={styles.exerciseDetailLabel}>Notes:</Text>
            <Text style={styles.exerciseDetailValue}>{item.notes}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
};



  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!program) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Program not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ImageBackground
                     source={theme.backgroundImage.source}
                     resizeMode={theme.backgroundImage.defaultResizeMode}
                     style={styles.background}
                   >
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          
          {isEditing ? (
            <TextInput
              style={styles.headerTitleInput}
              value={editedProgram.name}
              onChangeText={(text) => setEditedProgram({ ...editedProgram, name: text })}
              placeholder="Program name"
              placeholderTextColor={theme.colors.muted}
            />
          ) : (
            <Text style={styles.headerTitle}>{program.name}</Text>
          )}
        </View>
        <View style={styles.headerRight}>
          {isEditing ? (
            <>
              <TouchableOpacity onPress={() => setIsEditing(false)} style={styles.headerButton}>
                <Ionicons name="close" size={24} color={theme.colors.muted} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSaveProgram} style={styles.headerButton}>
                <Ionicons name="checkmark" size={24} color={theme.colors.primary} />
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.headerButton}>
                <Ionicons name="create-outline" size={24} color={theme.colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDeleteProgram} style={styles.headerButton}>
                <Ionicons name="trash-outline" size={24} color={theme.colors.error} />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* Program Info */}
      <View style={styles.programInfo}>
        {isEditing ? (
          <TextInput
            style={styles.descriptionInput}
            value={editedProgram.description}
            onChangeText={(text) => setEditedProgram({ ...editedProgram, description: text })}
            placeholder="Program description (optional)"
            placeholderTextColor={theme.colors.muted}
            multiline
            numberOfLines={3}
          />
        ) : (
          <>
            {program.description ? (
              <Text style={styles.programDescription}>{program.description}</Text>
            ) : null}
            <View style={styles.programStats}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{program.exercises?.length || 0}</Text>
                <Text style={styles.statLabel}>Exercises</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {program.createdAt ? new Date(program.createdAt).toLocaleDateString() : 'Unknown'}
                </Text>
                <Text style={styles.statLabel}>Created</Text>
              </View>
            </View>
          </>
        )}
      </View>

      {/* Exercises Section */}
      <View style={styles.exercisesSection}>
        <View style={styles.exercisesSectionHeader}>
          <Text style={styles.exercisesSectionTitle}>Exercises</Text>
          
        </View>

        {program.exercises && program.exercises.length > 0 ? (
          <FlatList
            data={program.exercises}
            renderItem={renderExerciseItem}
            keyExtractor={(item, index) => `${item.exerciseId}-${index}`}
            contentContainerStyle={styles.exercisesList}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyExercises}>
            <Ionicons name="fitness-outline" size={48} color={theme.colors.muted} />
            <Text style={styles.emptyExercisesText}>No exercises in this program yet.</Text>
            <TouchableOpacity style={styles.addFirstExerciseButton} onPress={handleAddExercise}>
              <Text style={styles.addFirstExerciseButtonText}>Add Your First Exercise</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Edit Exercise Modal */}
      <Modal
        visible={editExerciseModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setEditExerciseModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Exercise</Text>
            <Text style={styles.modalExerciseName}>{selectedExercise?.name}</Text>
            
            <View style={styles.modalInputRow}>
              <View style={styles.modalInputContainer}>
                <Text style={styles.modalInputLabel}>Sets</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editedExercise.sets}
                  onChangeText={(text) => setEditedExercise({ ...editedExercise, sets: text })}
 
                  placeholder="e.g., 3"
                  placeholderTextColor={theme.colors.muted}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.modalInputContainer}>
                <Text style={styles.modalInputLabel}>Reps</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editedExercise.reps}
                  onChangeText={(text) => setEditedExercise({ ...editedExercise, reps: text })}
                  placeholder="e.g., 10-12"
                  placeholderTextColor={theme.colors.muted}
                />
              </View>
            </View>

            <Text style={styles.modalInputLabel}>Notes (optional)</Text>
            <TextInput
              style={[styles.modalInput, styles.modalNotesInput]}
              value={editedExercise.notes}
              onChangeText={(text) => setEditedExercise({ ...editedExercise, notes: text })}
              placeholder="Add any notes..."
              placeholderTextColor={theme.colors.muted}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => setEditExerciseModalVisible(false)}
                style={styles.modalCancelButton}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveExercise}
                style={styles.modalSaveButton}
              >
                <Text style={styles.modalButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {route.params?.fromSelect && (
  <TouchableOpacity
    style={{
      backgroundColor: theme.colors.primary,
      margin: 16,
      padding: 12,
      borderRadius: 10,
      alignItems: 'center',
    }}
    onPress={async () => {
      try {
        await applyProgramToDate(auth.currentUser.uid, route.params.selectedDate, program);
        Alert.alert("Success", "Program applied to your diary.");
        navigation.navigate("Main", {
        screen: "Diary", // ou "Journal", selon ton Tab.Screen name
        });

      } catch (error) {
        console.error(error);
        Alert.alert("Error", "Could not apply program.");
      }
    }}
  >
    <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>Apply to {route.params.selectedDate}</Text>
  </TouchableOpacity>
)}
 
    </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  tag: {
    backgroundColor: theme.colors.primary,
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginRight: 4,
    marginBottom: 2,
  },
  tagText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },

  container: {
    flex: 1,
    
  },
  background: {
    flex: 1,
    backgroundColor: '#101924',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
  },
  errorText: {
    fontSize: 18,
    color: theme.colors.muted,
    marginBottom: theme.spacing.lg,
  },
  backButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.button.borderRadius,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: theme.spacing.sm,
    marginLeft: theme.spacing.sm,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginLeft: theme.spacing.md,
    flex: 1,
  },
  headerTitleInput: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginLeft: theme.spacing.md,
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.primary,
    paddingVertical: theme.spacing.xs,
  },
  programInfo: {
    backgroundColor: theme.colors.card,
    padding: theme.spacing.lg,
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.md,
    borderRadius: theme.card.borderRadius,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  programDescription: {
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    lineHeight: 22,
  },
  descriptionInput: {
    fontSize: 16,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.input.borderRadius,
    padding: theme.spacing.md,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  programStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  statLabel: {
    fontSize: 14,
    color: theme.colors.muted,
    marginTop: theme.spacing.xs,
  },
  exercisesSection: {
    flex: 1,
    marginTop: theme.spacing.md,
  },
  exercisesSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  exercisesSectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  addExerciseButton: {
    padding: theme.spacing.sm,
  },
  exercisesList: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },
  exerciseItem: {
    backgroundColor: theme.colors.card,
    padding: theme.spacing.md,
    borderRadius: theme.card.borderRadius,
    marginBottom: theme.spacing.md,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    flex: 1,
  },
  exerciseActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: theme.spacing.xs,
    marginLeft: theme.spacing.sm,
  },
  exerciseDetails: {
    marginTop: theme.spacing.sm,
  },
  exerciseDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  exerciseDetailLabel: {
    fontSize: 14,
    color: theme.colors.muted,
    fontWeight: '500',
  },
  exerciseDetailValue: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '600',
  },
  emptyExercises: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  emptyExercisesText: {
    fontSize: 16,
    color: theme.colors.muted,
    textAlign: 'center',
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  addFirstExerciseButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.button.borderRadius,
  },
  addFirstExerciseButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: theme.colors.card,
    borderRadius: 20,
    padding: theme.spacing.lg,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  modalExerciseName: {
    fontSize: 16,
    color: theme.colors.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    fontWeight: '600',
  },
  modalInputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  modalInputContainer: {
    flex: 1,
    marginHorizontal: theme.spacing.xs,
  },
  modalInputLabel: {
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
    fontWeight: '500',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.input.borderRadius,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: 16,
    color: theme.colors.text,
    backgroundColor: theme.colors.background,
  },
  modalNotesInput: {
    minHeight: 80,
    textAlignVertical: 'top',
    marginTop: theme.spacing.xs,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.lg,
  },
  modalCancelButton: {
    backgroundColor: theme.colors.muted,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.button.borderRadius,
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  modalSaveButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.button.borderRadius,
    flex: 1,
    marginLeft: theme.spacing.sm,
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default ProgramDetailScreen;
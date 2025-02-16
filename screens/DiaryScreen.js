import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { format, addDays, subDays } from 'date-fns';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import {
  fetchDiaryEntriesForDate,
  addExerciseToDiary,
  addSetToExercise,
  addWeightToDiary,
  updateWeightInDiary, // <-- New update function
} from '../services/diaryService.js';
import { auth } from '../services/firebase.js';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Animated, PanResponder, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const DiaryScreen = ({ navigation, route }) => {
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(today);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [entries, setEntries] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [loading, setLoading] = useState(true);
  const [reps, setReps] = useState('');
  const [weight, setWeight] = useState('');
  const [weightInput, setWeightInput] = useState('');
  const [isWeightModalVisible, setIsWeightModalVisible] = useState(false);

  const pan = useRef(new Animated.ValueXY()).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dx) > 5,
    onPanResponderGrant: () => {
      pan.setOffset({ x: pan.x._value, y: pan.y._value });
      pan.setValue({ x: 0, y: 0 });
    },
    onPanResponderMove: Animated.event([null, { dx: pan.x }], { useNativeDriver: false }),
    onPanResponderRelease: (_, gestureState) => {
      pan.flattenOffset();
      let newDate;
      if (gestureState.dx > 100) {
        newDate = subDays(selectedDate, 1);
        animatePageChange(newDate, width);
      } else if (gestureState.dx < -100) {
        newDate = addDays(selectedDate, 1);
        animatePageChange(newDate, -width);
      } else {
        Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false, friction: 5 }).start();
      }
    },
  });

  const animatePageChange = (newDate, toValue) => {
    Animated.parallel([
      Animated.timing(pan.x, { toValue: toValue, duration: 300, useNativeDriver: false }),
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: false }),
    ]).start(() => {
      handleDateChange(newDate);
      pan.setValue({ x: -toValue, y: 0 });
      Animated.parallel([
        Animated.spring(pan.x, { toValue: 0, useNativeDriver: false, friction: 8 }),
        Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: false }),
      ]).start();
    });
  };

  useFocusEffect(
    React.useCallback(() => {
      const fetchEntries = async () => {
        setLoading(true);
        const user = auth.currentUser;
        if (user) {
          try {
            const fetchedEntries = await fetchDiaryEntriesForDate(
              user.uid,
              format(selectedDate, 'yyyy-MM-dd')
            );
            setEntries(fetchedEntries);
          } catch (error) {
            console.error('Error fetching diary entries:', error);
          }
        } else {
          console.log('No user is signed in.');
        }
        setLoading(false);
      };
      fetchEntries();
    }, [selectedDate])
  );

  useEffect(() => {
    const fetchEntries = async () => {
      setLoading(true);
      const user = auth.currentUser;
      if (user) {
        try {
          const fetchedEntries = await fetchDiaryEntriesForDate(
            user.uid,
            format(selectedDate, 'yyyy-MM-dd')
          );
          setEntries(fetchedEntries);
        } catch (error) {
          console.error('Error fetching diary entries:', error);
        }
      } else {
        console.log('No user is signed in.');
      }
      setLoading(false);
    };
    fetchEntries();
  }, [selectedDate, refreshTrigger]);

  useEffect(() => {
    if (route.params?.exercise) {
      const { exercise, date } = route.params;
      addExerciseToDiary(auth.currentUser.uid, date, exercise)
        .then(() => setRefreshTrigger(prev => prev + 1))
        .catch(error => console.error('Error adding exercise to diary:', error));
    }
  }, [route.params?.exercise]);

  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  const showDatePicker = () => setDatePickerVisibility(true);
  const hideDatePicker = () => setDatePickerVisibility(false);
  const handleConfirm = (date) => {
    hideDatePicker();
    handleDateChange(date);
  };

  const handleAddSet = async (entryId) => {
    if (!reps || !weight) {
      Alert.alert('Input Error', 'Please enter both reps and weight.');
      return;
    }

    const set = {
      reps: parseInt(reps),
      weight: parseFloat(weight),
      timestamp: new Date().toISOString(),
    };

    try {
      await addSetToExercise(entryId, set);
      setReps('');
      setWeight('');
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error adding set:', error);
      Alert.alert('Error', 'Failed to add set. Please try again.');
    }
  };

  // New function: Open weight modal and prefill if a weight entry already exists
  const handleOpenWeightModal = () => {
    const existingWeight = entries.find(entry => entry.weight !== undefined);
    if (existingWeight) {
      setWeightInput(existingWeight.weight.toString());
    } else {
      setWeightInput('');
    }
    setIsWeightModalVisible(true);
  };

  // Updated submit handler: update if exists, otherwise add a new weight entry.
  const handleSubmitWeight = async () => {
    if (!weightInput) {
      Alert.alert('Input Error', 'Please enter your weight.');
      return;
    }

    const weightEntry = {
      weight: parseFloat(weightInput),
      date: format(selectedDate, 'yyyy-MM-dd'),
    };

    try {
      // Check if a weight entry exists for this day
      const existingWeight = entries.find(entry => entry.weight !== undefined);
      if (existingWeight) {
        // Update the existing weight entry.
        // (Make sure updateWeightInDiary is implemented in your diaryService)
        await updateWeightInDiary(auth.currentUser.uid, existingWeight.id, weightEntry);
      } else {
        // Add a new weight entry
        await addWeightToDiary(auth.currentUser.uid, weightEntry);
      }
      setRefreshTrigger(prev => prev + 1);
      setIsWeightModalVisible(false);
    } catch (error) {
      console.error('Error processing weight entry:', error);
      Alert.alert('Error', 'Failed to process weight entry. Please try again.');
    }
  };

  const renderExerciseItem = ({ item }) => (
    <View style={styles.exerciseItem}>
      <Ionicons name="barbell-outline" size={24} color="#232799" />
      <Text style={styles.exerciseText}>{item.exerciseName}</Text>
      <View style={styles.setInputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Reps"
          value={reps}
          onChangeText={setReps}
          keyboardType="numeric"
        />
        <TextInput
          style={styles.input}
          placeholder="Weight"
          value={weight}
          onChangeText={setWeight}
          keyboardType="numeric"
        />
        <TouchableOpacity style={styles.addSetButton} onPress={() => handleAddSet(item.id)}>
          <Text style={styles.addSetButtonText}>Add Set</Text>
        </TouchableOpacity>
      </View>
      {item.sets && (
        <FlatList
          data={item.sets}
          keyExtractor={(set, index) => index.toString()}
          renderItem={({ item: set }) => (
            <Text style={styles.setText}>
              {set.reps} reps @ {set.weight} kg
            </Text>
          )}
          keyboardShouldPersistTaps="always"
        />
      )}
    </View>
  );

  const renderMealItem = ({ item }) => (
    <View style={styles.mealItem}>
      <Ionicons name="restaurant-outline" size={24} color="#4CAF50" />
      <Text style={styles.mealText}>{item.mealName}</Text>
      <Text style={styles.caloriesText}>{item.calories} calories</Text>
    </View>
  );

  const renderWeightItem = ({ item }) => (
    // Make the weight item pressable so the user can modify it
    <TouchableOpacity style={styles.weightItem} onPress={handleOpenWeightModal}>
      <Ionicons name="scale-outline" size={24} color="#FF5722" />
      <Text style={styles.weightText}>{item.weight} kg</Text>
    </TouchableOpacity>
  );

  const renderItem = ({ item }) => {
    if (item.exerciseName) {
      return renderExerciseItem({ item });
    } else if (item.mealName) {
      return renderMealItem({ item });
    } else if (item.weight) {
      return renderWeightItem({ item });
    }
    return null;
  };

  // Determine button text based on whether a weight entry exists for today.
  const weightEntryExists = entries.some(entry => entry.weight !== undefined);
  const weightButtonText = weightEntryExists ? 'Edit Weight' : 'Add Weight';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header and Date Navigation */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => handleDateChange(subDays(selectedDate, 1))}>
            <Ionicons name="chevron-back" size={24} color="#232799" />
          </TouchableOpacity>
          <TouchableOpacity onPress={showDatePicker} style={styles.dateButton}>
            <Text style={styles.dateText}>{format(selectedDate, 'MMMM d, yyyy')}</Text>
            <Ionicons name="calendar-outline" size={20} color="#232799" style={styles.calendarIcon} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDateChange(addDays(selectedDate, 1))}>
            <Ionicons name="chevron-forward" size={24} color="#232799" />
          </TouchableOpacity>
        </View>

        {/* Animated entries */}
        <Animated.View
          style={[styles.animatedContainer, { transform: [{ translateX: pan.x }], opacity: opacity }]}
          {...panResponder.panHandlers}
        >
          <View style={styles.entriesContainer}>
            {loading ? (
              <View style={styles.centerContent}>
                <ActivityIndicator size="large" color="#232799" />
              </View>
            ) : entries.length === 0 ? (
              <View style={styles.centerContent}>
                <Ionicons name="fitness-outline" size={48} color="#ccc" />
                <Text style={styles.emptyMessage}>No workouts logged for this day</Text>
              </View>
            ) : (
              <FlatList
                data={entries}
                keyExtractor={(item) => item.id || item.exerciseName}
                renderItem={renderItem}
                contentContainerStyle={styles.exerciseList}
                keyboardShouldPersistTaps="always"
              />
            )}
          </View>
        </Animated.View>

        {/* Fixed Buttons */}
        <View style={styles.fixedButtonsContainer}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('ExerciseListScreen', { date: format(selectedDate, 'yyyy-MM-dd') })}
          >
            <Ionicons name="barbell-outline" size={24} color="#FFF" />
            <Text style={styles.buttonText}>Add Exercise</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.addButton, styles.mealButton]}
            onPress={() => navigation.navigate('MealListScreen', { date: format(selectedDate, 'yyyy-MM-dd') })}
          >
            <Ionicons name="restaurant-outline" size={24} color="#FFF" />
            <Text style={styles.buttonText}>Add Meal</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.addButton, styles.weightButton]} onPress={handleOpenWeightModal}>
            <Ionicons name="scale-outline" size={24} color="#FFF" />
            <Text style={styles.buttonText}>{weightButtonText}</Text>
          </TouchableOpacity>
        </View>

        {/* Date Picker */}
        <DateTimePickerModal isVisible={isDatePickerVisible} mode="date" onConfirm={handleConfirm} onCancel={hideDatePicker} />

        {/* Weight Input Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={isWeightModalVisible}
          onRequestClose={() => setIsWeightModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Log Your Weight</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Enter weight (kg)"
                value={weightInput}
                onChangeText={setWeightInput}
                keyboardType="numeric"
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setIsWeightModalVisible(false)}>
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalButton, styles.submitButton]} onPress={handleSubmitWeight}>
                  <Text style={styles.modalButtonText}>Submit</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: 'transparent' },
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  dateText: { fontSize: 16, fontWeight: '600', color: '#232799', marginRight: 8 },
  calendarIcon: { marginLeft: 4 },
  animatedContainer: { flex: 1 },
  entriesContainer: {
    flex: 1,
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyMessage: { fontSize: 16, color: '#888', marginTop: 12 },
  exerciseList: { paddingVertical: 8 },
  exerciseItem: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  exerciseText: { fontSize: 18, fontWeight: '600', marginLeft: 12, color: '#333' },
  setInputContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  input: { flex: 1, height: 40, borderWidth: 1, borderColor: '#ddd', borderRadius: 4, paddingHorizontal: 8, marginRight: 8 },
  addSetButton: { backgroundColor: '#232799', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 4 },
  addSetButtonText: { color: '#fff', fontWeight: 'bold' },
  fixedButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#232799',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    elevation: 2,
    flex: 1,
    marginHorizontal: 8,
  },
  mealButton: { backgroundColor: '#4CAF50' },
  weightButton: { backgroundColor: '#FF5722' },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    elevation: 5,
  },
  modalTitle: { fontSize: 20, fontWeight: '600', marginBottom: 12, color: '#232799' },
  modalInput: {
    width: '100%',
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    paddingHorizontal: 8,
    marginBottom: 20,
  },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  modalButton: { flex: 1, paddingVertical: 10, borderRadius: 4, marginHorizontal: 5, alignItems: 'center' },
  cancelButton: { backgroundColor: '#ccc' },
  submitButton: { backgroundColor: '#232799' },
  modalButtonText: { color: '#FFF', fontWeight: 'bold' },
  weightItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  weightText: { fontSize: 18, fontWeight: '600', marginLeft: 12, color: '#333' },
});

export default DiaryScreen;

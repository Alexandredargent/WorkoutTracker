import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  TextInput,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import Collapsible from 'react-native-collapsible';
import { format, addDays, subDays } from 'date-fns';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import {
  fetchDiaryEntriesForDate,
  addExerciseToDiary,
  addSetToExercise,
  deleteSetFromExercise,
  updateSetInExercise,
  deleteExerciseFromDiary,
  addWeightToDiary,
  updateWeightInDiary,
} from '../services/diaryService.js';
import { auth } from '../services/firebase.js';
import { Ionicons } from '@expo/vector-icons';
import { Animated, PanResponder, Dimensions } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const DiaryScreen = ({ navigation, route }) => {
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(today);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [entries, setEntries] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [loading, setLoading] = useState(false); // Start as false, controlled by animation
  const [reps, setReps] = useState('');
  const [weight, setWeight] = useState('');
  const [weightInput, setWeightInput] = useState('');
  const [isWeightModalVisible, setIsWeightModalVisible] = useState(false);
  const [activeSections, setActiveSections] = useState([]);
  const [shouldFetch, setShouldFetch] = useState(true); // New state to sync fetching with animation
  const [isEditSetModalVisible, setIsEditSetModalVisible] = useState(false);
  const [currentSet, setCurrentSet] = useState(null);
  const [currentEntryId, setCurrentEntryId] = useState(null);

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
      Animated.timing(pan.x, { toValue: toValue, duration: 400, useNativeDriver: false }),
      Animated.timing(opacity, { toValue: 0, duration: 400, useNativeDriver: false }),
    ]).start(() => {
      handleDateChange(newDate);
      setShouldFetch(true); // Trigger fetch after fade-out
      pan.setValue({ x: -toValue, y: 0 });
      Animated.parallel([
        Animated.spring(pan.x, { toValue: 0, useNativeDriver: false, friction: 8 }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: false }),
      ]).start();
    });
  };

  useFocusEffect(
    useCallback(() => {
      const refreshEntries = async () => {
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
      refreshEntries();
    }, [selectedDate])
  );

  useEffect(() => {
    if (route.params?.exercise) {
      const { exercise, date } = route.params;
      const addAndRefresh = async () => {
        try {
          // Add the exercise to the diary
          await addExerciseToDiary(auth.currentUser.uid, date, exercise);
          
          // Immediately fetch updated diary entries for the selected date
          setLoading(true);
          const user = auth.currentUser;
          if (user) {
            const fetchedEntries = await fetchDiaryEntriesForDate(
              user.uid,
              format(selectedDate, 'yyyy-MM-dd')
            );
            setEntries(fetchedEntries); // Refresh the exercise list
          }
          setLoading(false);
          
          // Optional: Expand the exercises section
          setActiveSections(['exercise']);
          
          // Clear the route param to prevent unintended re-triggering
          navigation.setParams({ exercise: null });
        } catch (error) {
          console.error('Error adding exercise and refreshing:', error);
          setLoading(false);
        }
      };
      
      addAndRefresh();
    }
  }, [route.params?.exercise, navigation, selectedDate]);

  const handleDateChange = (date) => {
    setSelectedDate(date);
    setActiveSections([]); // Reset collapsible sections to collapsed state
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
      setEntries((prevEntries) =>
        prevEntries.map((entry) =>
          entry.id === entryId
            ? { ...entry, sets: entry.sets ? [...entry.sets, set] : [set] }
            : entry
        )
      );
    } catch (error) {
      console.error('Error adding set:', error);
      Alert.alert('Error', 'Failed to add set. Please try again.');
    }
  };

  const handleDeleteSet = async (entryId, set) => {
    try {
      await deleteSetFromExercise(entryId, set);
      setEntries((prevEntries) =>
        prevEntries.map((entry) =>
          entry.id === entryId
            ? { ...entry, sets: entry.sets.filter(s => s.timestamp !== set.timestamp) }
            : entry
        )
      );
    } catch (error) {
      console.error('Error deleting set:', error);
      Alert.alert('Error', 'Failed to delete set. Please try again.');
    }
  };

  const handleUpdateSet = async (entryId, oldSet, newSet) => {
    try {
      await updateSetInExercise(entryId, oldSet, newSet);
      setEntries((prevEntries) =>
        prevEntries.map((entry) =>
          entry.id === entryId
            ? { ...entry, sets: entry.sets.map(s => s.timestamp === oldSet.timestamp ? newSet : s) }
            : entry
        )
      );
    } catch (error) {
      console.error('Error updating set:', error);
      Alert.alert('Error', 'Failed to update set. Please try again.');
    }
  };

  const handleDeleteExercise = async (entryId) => {
    try {
      await deleteExerciseFromDiary(entryId);
      setEntries((prevEntries) => prevEntries.filter(entry => entry.id !== entryId));
    } catch (error) {
      console.error('Error deleting exercise:', error);
      Alert.alert('Error', 'Failed to delete exercise. Please try again.');
    }
  };

  const handleOpenWeightModal = () => {
    const existingWeight = entries.find(entry => entry.weight !== undefined);
    if (existingWeight) {
      setWeightInput(existingWeight.weight.toString());
    } else {
      setWeightInput('');
    }
    setIsWeightModalVisible(true);
  };

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
      const existingWeight = entries.find(entry => entry.weight !== undefined);
      if (existingWeight) {
        await updateWeightInDiary(auth.currentUser.uid, existingWeight.id, weightEntry);
        setEntries((prevEntries) =>
          prevEntries.map((entry) =>
            entry.id === existingWeight.id ? { ...entry, weight: weightEntry.weight } : entry
          )
        );
      } else {
        const newWeightEntry = await addWeightToDiary(auth.currentUser.uid, weightEntry);
        setEntries((prevEntries) => [...prevEntries, { ...weightEntry, id: newWeightEntry.id }]);
      }
      setRefreshTrigger(prev => prev + 1); // Trigger re-fetch
      setIsWeightModalVisible(false);
    } catch (error) {
      console.error('Error processing weight entry:', error);
      Alert.alert('Error', 'Failed to process weight entry. Please try again.');
    }
  };

  const handleEditSet = (entryId, set) => {
    setCurrentSet(set);
    setCurrentEntryId(entryId);
    setReps(set.reps.toString());
    setWeight(set.weight.toString());
    setIsEditSetModalVisible(true);
  };

  const handleSaveSet = async () => {
    if (!reps || !weight) {
      Alert.alert('Input Error', 'Please enter both reps and weight.');
      return;
    }

    const newSet = {
      ...currentSet,
      reps: parseInt(reps),
      weight: parseFloat(weight),
    };

    try {
      await handleUpdateSet(currentEntryId, currentSet, newSet);
      setIsEditSetModalVisible(false);
      setCurrentSet(null);
      setCurrentEntryId(null);
      setReps('');
      setWeight('');
    } catch (error) {
      console.error('Error saving set:', error);
      Alert.alert('Error', 'Failed to save set. Please try again.');
    }
  };

  const renderExerciseItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardRow}>
        <Ionicons name="barbell-outline" size={24} color="#232799" />
        <Text style={styles.cardTitle}>{item.exercise.Name}</Text>
        <TouchableOpacity onPress={() => handleDeleteExercise(item.id)}>
          <Ionicons name="trash-outline" size={24} color="red" />
        </TouchableOpacity>
      </View>
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
        <TouchableOpacity style={styles.smallButton} onPress={() => handleAddSet(item.id)}>
          <Text style={styles.smallButtonText}>Add Set</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.setsHeader}>
        <Text style={styles.setsHeaderText}>Set</Text>
        <Text style={styles.setsHeaderText}>Reps</Text>
        <Text style={styles.setsHeaderText}>Weight (kg)</Text>
        <View style={{ width: 48 }} /> 
      </View>
      {item.sets &&
        item.sets.map((set, index) => (
          <View key={index} style={styles.setRow}>
            <Text style={styles.setText}>{index + 1}</Text>
            <Text style={styles.setText}>{set.reps}</Text>
            <Text style={styles.setText}>{set.weight}</Text>
            <TouchableOpacity onPress={() => handleDeleteSet(item.id, set)}>
              <Ionicons name="trash-outline" size={24} color="red" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleEditSet(item.id, set)}>
              <Ionicons name="pencil-outline" size={24} color="blue" />
            </TouchableOpacity>
          </View>
        ))}
    </View>
  );

  const renderMealItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardRow}>
        <Ionicons name="restaurant-outline" size={24} color="#4CAF50" />
        <Text style={styles.cardTitle}>{item.mealName}</Text>
      </View>
      <Text style={styles.subText}>{item.calories} calories</Text>
    </View>
  );

  const renderWeightItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardRow}>
        <Text style={styles.cardTitle}>{item.weight} kg</Text>
        <TouchableOpacity
          style={styles.updateButton}
          onPress={handleOpenWeightModal}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="pencil-outline" size={24} color="blue" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const toggleSection = (section) => {
    setActiveSections((prevSections) =>
      prevSections.includes(section)
        ? prevSections.filter((s) => s !== section)
        : [...prevSections, section]
    );
  };

  const weightEntry = entries.find(entry => entry.weight !== undefined);

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
          <ScrollView style={styles.entriesContainer} contentContainerStyle={styles.entriesContent}>
            {loading ? (
              <View style={styles.centerContent}>
                <ActivityIndicator size="large" color="#232799" />
              </View>
            ) : (
              <>
                {/* Exercises Section Header */}
                <View style={styles.sectionHeader}>
                  <TouchableOpacity
                    style={styles.headerToggle}
                    onPress={() => toggleSection('exercise')}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="barbell" size={32} color="#232799" style={{ marginRight: 8 }} />
                    <Text style={styles.sectionTitle}>Exercises</Text>
                    <Ionicons
                      name={activeSections.includes('exercise') ? 'chevron-up' : 'chevron-down'}
                      size={24}
                      color="#232799"
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.headerAddButton}
                    onPress={() =>
                      navigation.navigate('ExerciseListScreen', { date: format(selectedDate, 'yyyy-MM-dd') })
                    }
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="add-circle" size={28} color="#232799" />
                  </TouchableOpacity>
                </View>
                <Collapsible collapsed={!activeSections.includes('exercise')}>
                  {entries.filter(entry => entry.exercise).length > 0 ? (
                    entries.filter(entry => entry.exercise).map(item => (
                      <View key={item.id || item.exercise.exerciseName}>
                        {renderExerciseItem({ item })}
                      </View>
                    ))
                  ) : (
                    <View style={styles.emptySection}>
                      <Text style={styles.emptySectionText}>No exercises logged for this day</Text>
                    </View>
                  )}
                </Collapsible>

                {/* Meals Section Header */}
                <View style={styles.sectionHeader}>
                  <TouchableOpacity
                    style={styles.headerToggle}
                    onPress={() => toggleSection('meal')}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="restaurant" size={32} color="#232799" style={{ marginRight: 8 }} />
                    <Text style={styles.sectionTitle}>Meals</Text>
                    <Ionicons
                      name={activeSections.includes('meal') ? 'chevron-up' : 'chevron-down'}
                      size={24}
                      color="#232799"
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.headerAddButton}
                    onPress={() =>
                      navigation.navigate('MealListScreen', { date: format(selectedDate, 'yyyy-MM-dd') })
                    }
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="add-circle" size={28} color="#232799" />
                  </TouchableOpacity>
                </View>
                <Collapsible collapsed={!activeSections.includes('meal')}>
                  {entries.filter(entry => entry.mealName).length > 0 ? (
                    entries.filter(entry => entry.mealName).map(item => (
                      <View key={item.id || item.mealName}>
                        {renderMealItem({ item })}
                      </View>
                    ))
                  ) : (
                    <View style={styles.emptySection}>
                      <Text style={styles.emptySectionText}>No meals logged for this day</Text>
                    </View>
                  )}
                </Collapsible>

                {/* Weight Section - No collapse */}
                <View style={styles.sectionHeader}>
                  <Ionicons name="scale" size={32} color="#232799" style={{ marginRight: 8 }} />
                  <Text style={styles.sectionTitle}>Weight</Text>
                  <TouchableOpacity
                    style={styles.headerAddButton}
                    onPress={handleOpenWeightModal}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    {weightEntry ? (
                      <Ionicons name="pencil" size={28} color="#232799" />
                    ) : (
                      <Ionicons name="add-circle" size={28} color="#232799" />
                    )}
                  </TouchableOpacity>
                </View>
                {weightEntry ? (
                  <View style={styles.card}>
                    {renderWeightItem({ item: weightEntry })}
                  </View>
                ) : (
                  <View style={styles.emptySection}>
                    <Text style={styles.emptySectionText}>No weight logged for this day</Text>
                  </View>
                )}
              </>
            )}
          </ScrollView>
        </Animated.View>

        {/* Date Picker */}
        <DateTimePickerModal
          isVisible={isDatePickerVisible}
          mode="date"
          onConfirm={handleConfirm}
          onCancel={hideDatePicker}
        />

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
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setIsWeightModalVisible(false)}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.submitButton]}
                  onPress={handleSubmitWeight}
                >
                  <Text style={styles.modalButtonText}>Submit</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Edit Set Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={isEditSetModalVisible}
          onRequestClose={() => setIsEditSetModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Edit Set</Text>
              <Text style={styles.modalLabel}>Reps</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Reps"
                value={reps}
                onChangeText={setReps}
                keyboardType="numeric"
              />
              <Text style={styles.modalLabel}>Weight</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Weight"
                value={weight}
                onChangeText={setWeight}
                keyboardType="numeric"
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setIsEditSetModalVisible(false)}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.submitButton]}
                  onPress={handleSaveSet}
                >
                  <Text style={styles.modalButtonText}>Save</Text>
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
  safeArea: {
    flex: 1,
    backgroundColor: '#EFEFF4',
  },
  container: {
    flex: 1,
    backgroundColor: '#EFEFF4',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    // Removed shadow props for consistency, but kept for header as it's static
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F7F7',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#232799',
  },
  calendarIcon: { marginLeft: 4 },
  animatedContainer: {
    flex: 1,
    overflow: 'hidden', // Still useful for animation clipping
  },
  entriesContainer: {
    flex: 1,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    backgroundColor: '#fff',
    // Shadows removed
  },
  entriesContent: {
    paddingVertical: 8,
    paddingBottom: 20,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  emptyMessage: {
    fontSize: 16,
    color: '#888',
    marginTop: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center', // Center the content
    backgroundColor: '#F7F7F7',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
    position: 'relative', // Ensure the add button is positioned correctly
  },
  headerToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center', // Center the toggle content
    flex: 1, // Ensure the toggle takes up available space
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#232799',
    textAlign: 'center', // Center the text
  },
  headerAddButton: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 4,
    position: 'absolute', // Position the add button absolutely
    right: 16, // Align it to the right
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    // Shadows removed
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  subText: {
    fontSize: 14,
    color: '#777',
    marginTop: 4,
  },
  setInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    flexWrap: 'wrap',
  },
  input: {
    flex: 1,
    height: 40,
    backgroundColor: '#F7F7F7',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    fontSize: 16,
    color: '#333',
    minWidth: 80,
  },
  smallButton: {
    backgroundColor: '#232799',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  smallButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  setsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  setsHeaderText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  setRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center', // Ensure items are centered vertically
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  setText: {
    flex: 1,
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
  },
  updateButton: {
    padding: 4,
  },
  emptySection: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptySectionText: {
    fontSize: 16,
    color: '#888',
  },
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
    elevation: 5, // Kept for modal as it’s static
  },
  modalLabel: {
    alignSelf: 'flex-start',
    marginBottom: 5,
    fontSize: 16,
    color: '#333',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
    color: '#232799',
  },
  modalInput: {
    width: '100%',
    height: 40,
    backgroundColor: '#F7F7F7',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 20,
    fontSize: 16,
    color: '#333',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#ccc',
  },
  submitButton: {
    backgroundColor: '#232799',
  },
  modalButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
});

export default DiaryScreen;

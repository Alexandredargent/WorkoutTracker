import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, SafeAreaView, StatusBar, Platform, PanResponder, Animated, Dimensions, ActivityIndicator, TextInput, Alert } from 'react-native';
import { format, addDays, subDays } from 'date-fns';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { fetchDiaryEntriesForDate, addExerciseToDiary, addSetToExercise } from '../services/diaryService.js';
import { auth } from '../services/firebase.js';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const AddWorkoutScreen = ({ navigation, route }) => {
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(today);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [entries, setEntries] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [loading, setLoading] = useState(true);
  const [exerciseInputs, setExerciseInputs] = useState({});
  const [reps, setReps] = useState('');
  const [weight, setWeight] = useState('');


  const pan = useRef(new Animated.ValueXY()).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dx) > 5,
    onPanResponderGrant: () => {
      pan.setOffset({
        x: pan.x._value,
        y: pan.y._value
      });
      pan.setValue({ x: 0, y: 0 });
    },
    onPanResponderMove: Animated.event(
      [null, { dx: pan.x }],
      { useNativeDriver: false }
    ),
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
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: false,
          friction: 5
        }).start();
      }
    }
  });

  const animatePageChange = (newDate, toValue) => {
    Animated.parallel([
      Animated.timing(pan.x, {
        toValue: toValue,
        duration: 300,
        useNativeDriver: false
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false
      })
    ]).start(() => {
      handleDateChange(newDate);
      pan.setValue({ x: -toValue, y: 0 });
      Animated.parallel([
        Animated.spring(pan.x, {
          toValue: 0,
          useNativeDriver: false,
          friction: 8,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false
        })
      ]).start();
    });
  };

  useEffect(() => {
    const fetchEntries = async () => {
      setLoading(true);
      const user = auth.currentUser;
      if (user) {
        try {
          const entries = await fetchDiaryEntriesForDate(user.uid, format(selectedDate, 'yyyy-MM-dd'));
          setEntries(entries);
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
        .then(() => {
          setRefreshTrigger(prev => prev + 1);
        })
        .catch(error => {
          console.error('Error adding exercise to diary:', error);
        });
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

  const handleInputChange = (id, type, value) => {
    setExerciseInputs(prevInputs => ({
      ...prevInputs,
      [id]: { ...prevInputs[id], [type]: value },
    }));
  };

  const handleAddSet = async (entryId) => {
    const reps = exerciseInputs[entryId]?.reps;
    const weight = exerciseInputs[entryId]?.weight;
  
    if (!reps || !weight) {
      Alert.alert('Input Error', 'Please enter both reps and weight.');
      return;
    }
  
    const set = {
      reps: parseInt(reps),
      weight: parseFloat(weight),
      timestamp: new Date().toISOString()
    };
  
    try {
      const userId = auth.currentUser.uid;
      await addSetToExercise(userId, entryId, set);
      setExerciseInputs(prevInputs => ({
        ...prevInputs,
        [entryId]: { reps: '', weight: '' }
      }));
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error adding set:', error);
      Alert.alert('Error', 'Failed to add set. Please try again.');
    }
  };
  
  

  const renderExerciseItem = ({ item }) => (
    <View style={styles.exerciseItem}>
      <View style={styles.exerciseHeader}>
        <Ionicons name="barbell-outline" size={24} color="#232799" />
        <Text style={styles.exerciseText}>{item.exerciseName}</Text>
      </View>
      <View style={styles.setInputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Reps"
          value={exerciseInputs[item.id]?.reps || ''}
          onChangeText={(value) => handleInputChange(item.id, 'reps', value)}
          keyboardType="numeric"
        />
        <TextInput
          style={styles.input}
          placeholder="Weight"
          value={exerciseInputs[item.id]?.weight || ''}
          onChangeText={(value) => handleInputChange(item.id, 'weight', value)}
          keyboardType="numeric"
        />
        <TouchableOpacity
          style={styles.addSetButton}
          onPress={() => handleAddSet(item.id)}
        >
          <Text style={styles.addSetButtonText}>Add Set</Text>
        </TouchableOpacity>
      </View>
      {item.sets && (
        <FlatList
          data={item.sets}
          keyExtractor={(set, index) => index.toString()}
          renderItem={({ item: set }) => (
            <View style={styles.setItem}>
              <Text style={styles.setText}>
                {set.reps} reps @ {set.weight} kg
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
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

        <Animated.View 
          style={[
            styles.animatedContainer,
            {
              transform: [{ translateX: pan.x }],
              opacity: opacity
            }
          ]}
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
                renderItem={renderExerciseItem}
                contentContainerStyle={styles.exerciseList}
              />
            )}
          </View>
        </Animated.View>

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
            onPress={() => navigation.navigate('AddMealScreen')}
          >
            <Ionicons name="restaurant-outline" size={24} color="#FFF" />
            <Text style={styles.buttonText}>Add Meal</Text>
          </TouchableOpacity>
        </View>

        <DateTimePickerModal
          isVisible={isDatePickerVisible}
          mode="date"
          onConfirm={handleConfirm}
          onCancel={hideDatePicker}
        />
      </View>
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
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
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#232799',
    marginRight: 8,
  },
  calendarIcon: {
    marginLeft: 4,
  },
  animatedContainer: {
    flex: 1,
  },
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
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyMessage: {
    fontSize: 16,
    color: '#888',
    marginTop: 12,
  },
  exerciseList: {
    paddingVertical: 8,
  },
  exerciseItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  exerciseText: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
    color: '#333',
  },
  setInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  input: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    paddingHorizontal: 8,
    marginRight: 8,
  },
  addSetButton: {
    backgroundColor: '#232799',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
  },
  addSetButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  setItem: {
    backgroundColor: '#f9f9f9',
    padding: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  setText: {
    fontSize: 14,
    color: '#333',
  },
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
  mealButton: {
    backgroundColor: '#4CAF50',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default AddWorkoutScreen;
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
  Image,
} from 'react-native';
import { ImageBackground } from 'react-native';
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
  deleteMealFromDiary, // Import the new function
  addWeightToDiary,
  updateWeightInDiary,
} from '../services/diaryService.js';
import { auth } from '../services/firebase.js';
import { Ionicons } from '@expo/vector-icons';
import { Animated, PanResponder, Dimensions } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import {
  getProteinGoal,
  getLipidGoal,
  getCarbGoal,
  calculateCalorieTarget,
} from '../utils/nutrition';
import MealCard from '../components/MealCard';
import ExerciseCard from '../components/ExerciseCard';
import WeightCard from '../components/WeightCard';
import NutritionSummary from '../components/NutritionSummary';
import theme from '../styles/theme';
import { Button } from 'react-native';
import { calculateAge } from '../utils/date';


const { width } = Dimensions.get('window');

const DiaryScreen = ({ navigation, route }) => {
  // State variables for UI and data
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(today);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [entries, setEntries] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [loading, setLoading] = useState(false);
  const [reps, setReps] = useState('');
  const [weight, setWeight] = useState('');
  const [weightInput, setWeightInput] = useState('');
  const [isWeightModalVisible, setIsWeightModalVisible] = useState(false);
  const [activeSections, setActiveSections] = useState([]);
  const [shouldFetch, setShouldFetch] = useState(true);
  const [isEditSetModalVisible, setIsEditSetModalVisible] = useState(false);
  const [currentSet, setCurrentSet] = useState(null);
  const [currentEntryId, setCurrentEntryId] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [dayComment, setDayCommentState] = useState('');
  const [isCommentModalVisible, setIsCommentModalVisible] = useState(false);

  const [nutritionCollapsed, setNutritionCollapsed] = useState(false);
  const [editMealModalVisible, setEditMealModalVisible] = useState(false);
  const [selectedMealEntry, setSelectedMealEntry] = useState(null);
  const [editQuantity, setEditQuantity] = useState('');

  // Animation refs for swipe navigation
  const pan = useRef(new Animated.ValueXY()).current;
  const opacity = useRef(new Animated.Value(1)).current;

  // PanResponder for swipe navigation between days
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

  // Animate page transition when changing date
  const animatePageChange = (newDate, toValue) => {
    Animated.parallel([
      Animated.timing(pan.x, { toValue: toValue, duration: 400, useNativeDriver: false }),
      Animated.timing(opacity, { toValue: 0, duration: 400, useNativeDriver: false }),
    ]).start(() => {
      handleDateChange(newDate);
      setShouldFetch(true);
      pan.setValue({ x: -toValue, y: 0 });
      Animated.parallel([
        Animated.spring(pan.x, { toValue: 0, useNativeDriver: false, friction: 8 }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: false }),
      ]).start();
    });
  };

  // Fetch diary entries when date changes
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

  // Add exercise from navigation params and refresh entries
  useEffect(() => {
    if (route.params?.exercise) {
      const { exercise, date } = route.params;
      const addAndRefresh = async () => {
        try {
          await addExerciseToDiary(auth.currentUser.uid, date, exercise);
          setLoading(true);
          const user = auth.currentUser;
          if (user) {
            const fetchedEntries = await fetchDiaryEntriesForDate(
              user.uid,
              format(selectedDate, 'yyyy-MM-dd')
            );
            setEntries(fetchedEntries);
          }
          setLoading(false);
          setActiveSections(['exercise']);
          navigation.setParams({ exercise: null });
        } catch (error) {
          console.error('Error adding exercise and refreshing:', error);
          setLoading(false);
        }
      };
      addAndRefresh();
    }
  }, [route.params?.exercise, navigation, selectedDate]);

  useFocusEffect(
    useCallback(() => {
      const fetchUserInfo = async () => {
        try {
          const user = auth.currentUser;
          if (!user) return;
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setUserInfo(docSnap.data());
          }
        } catch (err) {
          console.error('Error fetching user data:', err);
        }
      };
      fetchUserInfo();
    }, [])
  );

  // Date change handler
  const handleDateChange = (date) => {
    setSelectedDate(date);
    setActiveSections([]);
  };

  // Date picker handlers
  const showDatePicker = () => setDatePickerVisibility(true);
  const hideDatePicker = () => setDatePickerVisibility(false);
  const handleConfirm = (date) => {
    hideDatePicker();
    handleDateChange(date);
  };

  // Add set to exercise handler
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
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'You must be logged in to add a set.');
        return;
      }
      await addSetToExercise(user.uid, entryId, set);
      setReps('');
      setWeight('');
      setEntries((prevEntries) =>
        prevEntries.map((entry) =>
          entry.id === entryId
            ? { ...entry, sets: Array.isArray(entry.sets) ? [...entry.sets, set] : [set] }
            : entry
        )
      );
    } catch (error) {
      console.error('Error adding set:', error);
      Alert.alert('Error', 'Failed to add set. Please try again.');
    }
  };

  // Delete set from exercise handler
  const handleDeleteSet = async (entryId, set) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'You must be logged in to delete a set.');
        return;
      }
      await deleteSetFromExercise(user.uid, entryId, set);
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

  // Update set in exercise handler
  const handleUpdateSet = async (entryId, oldSet, newSet) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'You must be logged in to update a set.');
        return;
      }
      await updateSetInExercise(user.uid, entryId, oldSet, newSet);
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

  // Delete exercise from diary handler
  const handleDeleteExercise = async (entryId) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'You must be logged in to delete an exercise.');
        return;
      }
      await deleteExerciseFromDiary(user.uid, entryId);
      setEntries((prevEntries) => prevEntries.filter(entry => entry.id !== entryId));
    } catch (error) {
      console.error('Error deleting exercise:', error);
      Alert.alert('Error', 'Failed to delete exercise. Please try again.');
    }
  };

  // Delete meal from diary handler
  const handleDeleteMeal = async (entryId) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'You must be logged in to delete a meal.');
        return;
      }
      await deleteMealFromDiary(user.uid, entryId);
      setEntries((prevEntries) => prevEntries.filter(entry => entry.id !== entryId));
      Alert.alert('Success', 'Meal deleted successfully.');
    } catch (error) {
      console.error('Error deleting meal:', error);
      Alert.alert('Error', 'Failed to delete meal. Please try again.');
    }
  };

  // Open weight modal handler
  const handleOpenWeightModal = () => {
    const todayFormatted = format(new Date(), 'yyyy-MM-dd');
    const selectedDayFormatted = format(selectedDate, 'yyyy-MM-dd');

    if (selectedDayFormatted > todayFormatted) {
      Alert.alert("Future Date", "You cannot log weight for a future date.");
      return;
    }

    const existingWeight = entries.find(entry => entry.type === 'weight' && entry.date === selectedDayFormatted);
    if (existingWeight) {
      setWeightInput(existingWeight.weight.toString());
    } else {
      setWeightInput('');
    }
    setIsWeightModalVisible(true);
  };

  // Submit weight handler
  const handleSubmitWeight = async () => {
    if (!weightInput) {
      Alert.alert('Input Error', 'Please enter your weight.');
      return;
    }
    const weightValue = parseFloat(weightInput);
    const entryDate = format(selectedDate, 'yyyy-MM-dd');
    const todayFormatted = format(new Date(), 'yyyy-MM-dd');

    if (entryDate > todayFormatted) {
      Alert.alert("Future Date", "You cannot log weight for a future date.");
      setIsWeightModalVisible(false); // Close modal if it was somehow opened
      return;
    }

    const weightPayload = {
      weight: parseFloat(weightInput),
      date: entryDate,
    };

    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'User not signed in.');
        return;
      }

      const existingWeightDiaryEntry = entries.find(
        (entry) => entry.type === 'weight' && entry.date === entryDate
      );

      if (existingWeightDiaryEntry) {
        await updateWeightInDiary(user.uid, existingWeightDiaryEntry.id, weightPayload, todayFormatted);
        setEntries((prevEntries) =>
          prevEntries.map((entry) =>
            entry.id === existingWeightDiaryEntry.id ? { ...entry, ...weightPayload } : entry
          )
        );
      } else {
        const newDocRef = await addWeightToDiary(user.uid, weightPayload, todayFormatted);
        setEntries((prevEntries) => [
          ...prevEntries,
          { 
            id: newDocRef.id, 
            userId: user.uid, 
            type: 'weight', 
            ...weightPayload 
          },
        ]);
      }

      // Update local userInfo if the user's main weight in Firestore was potentially updated
      if (entryDate >= todayFormatted) {
        setUserInfo(prevUserInfo => prevUserInfo ? ({ ...prevUserInfo, weight: weightValue }) : null);
      }

      setRefreshTrigger(prev => prev + 1);
      setIsWeightModalVisible(false);
      setWeightInput(''); // Clear input
    } catch (error) {
      console.error('Error processing weight entry:', error);
      Alert.alert('Error', 'Failed to process weight entry. Please try again.');
    }
  };
  // Edit set modal handler
  const handleEditSet = (entryId, set) => {
    setCurrentSet(set);
    setCurrentEntryId(entryId);
    setReps(set.reps.toString());
    setWeight(set.weight.toString());
    setIsEditSetModalVisible(true);
  };

  // Save set handler for edit modal
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

  // Handle meal card press (you can customize what happens here)
  const handleMealPress = (item) => {
    // For example, navigate to a meal detail screen or open a modal
    // navigation.navigate('MealDetailScreen', { meal: item });
    Alert.alert('Meal pressed', `You pressed on ${item.mealName || item.name}`);
  };

  // Render a single meal card (Note: This function was defined but not used.
  // The rendering is done directly in the JSX map below. Keeping it here for reference
  // but the actual change is in the map function).
  const renderMealItem = (item) => (
    <MealCard
      key={item.id || item.mealName}
      onPress={handleMealPress}
      // ...other props as needed
    />
  );

  // Render a single weight card
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

  // Toggle section open/close handler
  const toggleSection = (section) => {
    setActiveSections((prevSections) =>
      prevSections.includes(section)
        ? prevSections.filter((s) => s !== section)
        : [...prevSections, section]
    );
  };

  // Find weight entry for the day
  const formattedSelectedDate = format(selectedDate, 'yyyy-MM-dd');
  const weightEntry = entries.find(entry => entry.type === 'weight' && entry.date === formattedSelectedDate);
  
  // Determine if the selected date is in the future
  const todayFormattedForCheck = format(new Date(), 'yyyy-MM-dd');
  const isFutureDate = formattedSelectedDate > todayFormattedForCheck;

  // Calculate macro goals based on user info and calorie goal
  const currentWeight = weightEntry && weightEntry.weight ? weightEntry.weight : (userInfo ? userInfo.weight : 0);

  const proteinGoal = getProteinGoal(currentWeight);
  const lipidGoal = getLipidGoal(currentWeight);

  const calorieGoal = userInfo
    ? calculateCalorieTarget({
        ...userInfo,
        age: calculateAge(userInfo.dateOfBirth),
        weight: currentWeight,
      })
    : 0;

  const carbGoal = getCarbGoal(calorieGoal, proteinGoal, lipidGoal);

  // Calculate daily totals from meal entries
  const mealEntries = entries.filter(entry => entry.mealName);
  const totalCalories = mealEntries.reduce((sum, m) => sum + ((Number(m.calories) || 0) * (m.quantity || 100) / 100), 0);
  const totalProteins = mealEntries.reduce((sum, m) => sum + ((Number(m.proteins) || 0) * (m.quantity || 100) / 100), 0);
  const totalCarbs = mealEntries.reduce((sum, m) => sum + ((Number(m.carbs) || 0) * (m.quantity || 100) / 100), 0);
  const totalLipids = mealEntries.reduce((sum, m) => sum + ((Number(m.lipids) || 0) * (m.quantity || 100) / 100), 0);

  // Utility to get percent for progress bars
  const getPercent = (value, goal) => {
    if (!goal || goal === 0) return 0;
    return Math.min(100, Math.round((value / goal) * 100));
  };

  // Collapse nutrition summary when exercise input is focused
  const handleExerciseInputFocus = () => setNutritionCollapsed(true);

  // Expand nutrition summary
  const handleExpandNutrition = () => setNutritionCollapsed(false);

  // Update meal quantity handler
  const handleUpdateMealQuantity = async () => {
    if (!selectedMealEntry) return;
    try {
     const user = auth.currentUser;
     const entryRef = doc(db, 'users', user.uid, 'diaryEntries', selectedMealEntry.id);  
      await updateDoc(entryRef, { quantity: parseFloat(editQuantity) || 100 });
      // Optionally refresh diary entries here
      setEntries(prev =>
        prev.map(e =>
          e.id === selectedMealEntry.id
            ? { ...e, quantity: parseFloat(editQuantity) || 100 }
            : e
        )
      );
    } catch (error) {
      console.error('Error updating meal quantity:', error);
      alert('Failed to update quantity');
    }
  };

  useEffect(() => {
    const fetchComment = async () => {
      const user = auth.currentUser;
      if (user) {
        const comment = await fetchDayComment(user.uid, format(selectedDate, 'yyyy-MM-dd'));
        setDayCommentState(comment);
      }
    };
    fetchComment();
  }, [selectedDate]);

  return (
    <ImageBackground
  source={theme.backgroundImage.source}
  resizeMode={theme.backgroundImage.defaultResizeMode}
  style={{ flex: 1 }}
>
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => handleDateChange(subDays(selectedDate, 1))}>
            <Ionicons name="chevron-back" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={showDatePicker} style={styles.dateButton}>
            <Text style={styles.dateText}>{format(selectedDate, 'MMMM d, yyyy')}</Text>
            <Ionicons name="calendar-outline" size={20} color={theme.colors.primary} style={styles.calendarIcon} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDateChange(addDays(selectedDate, 1))}>
            <Ionicons name="chevron-forward" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        <Animated.View
          style={[styles.animatedContainer, { transform: [{ translateX: pan.x }], opacity: opacity }]}
          {...panResponder.panHandlers}
        >
          
          <ScrollView style={styles.entriesContainer} contentContainerStyle={styles.entriesContent}>
            
            <NutritionSummary
              totalCalories={totalCalories}
              calorieGoal={calorieGoal}
              totalProteins={totalProteins}
              proteinGoal={proteinGoal}
              totalCarbs={totalCarbs}
              carbGoal={carbGoal}
              totalLipids={totalLipids}
              lipidGoal={lipidGoal}
              getPercent={getPercent}
            />
          
          
            
              <>
                <View style={styles.sectionHeader}>
                  <TouchableOpacity
                    style={styles.headerToggle}
                    onPress={() => toggleSection('exercise')}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="barbell" size={32} color={theme.colors.primary} style={{ marginRight: 8 }} />
                    <Text style={styles.sectionTitle}>Exercises</Text>
                    <Ionicons
                      name={activeSections.includes('exercise') ? 'chevron-up' : 'chevron-down'}
                      size={24}
                      color={theme.colors.primary}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.headerAddButton}
                    onPress={() =>
                      navigation.navigate('ExerciseListScreen', { date: format(selectedDate, 'yyyy-MM-dd') })
                    }
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="add-circle" size={28} color={theme.colors.primary} />
                  </TouchableOpacity>
                </View>
                <Collapsible collapsed={!activeSections.includes('exercise')}>
                  {entries.filter(entry => entry.exercise).length > 0 ? (
                    entries.filter(entry => entry.exercise).map(item => {
                      const iconSource = muscleIcons[item.exercise["Target Muscle Group"]] || muscleIcons.Default;
                      return (
                        <ExerciseCard
                          key={item.id || item.exercise.exerciseName}
                          item={item}
                          reps={reps}
                          weight={weight}
                          setReps={setReps}
                          setWeight={setWeight}
                          onAddSet={handleAddSet}
                          onDelete={handleDeleteExercise}
                          onDeleteSet={handleDeleteSet}
                          onEditSet={handleEditSet}
                          onInputFocus={handleExerciseInputFocus}
                          iconSource={iconSource} // <-- Add this line
                          // ...other props as needed
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Image source={iconSource} style={{ width: 28, height: 28, marginRight: 12 }} resizeMode="contain" />
                            <Text>{item.exercise.Name}</Text>
                          </View>
                        </ExerciseCard>
                      );
                    })
                  ) : (
                    <View style={styles.emptySection}>
                      <Text style={styles.emptySectionText}>No exercises logged for this day</Text>
                    </View>
                  )}
                </Collapsible>

                <View style={styles.sectionHeader}>
                  <TouchableOpacity
                    style={styles.headerToggle}
                    onPress={() => toggleSection('meal')}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="restaurant" size={32} color={theme.colors.primary} style={{ marginRight: 8 }} />
                    <Text style={styles.sectionTitle}>Meals</Text>
                    <Ionicons
                      name={activeSections.includes('meal') ? 'chevron-up' : 'chevron-down'}
                      size={24}
                      color={theme.colors.primary}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.headerAddButton}
                    onPress={() =>
                      navigation.navigate('MealListScreen', { date: format(selectedDate, 'yyyy-MM-dd') })
                    }
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="add-circle" size={28} color={theme.colors.primary} />
                  </TouchableOpacity>
                </View>
                <Collapsible collapsed={!activeSections.includes('meal')}>
                  {entries.filter(entry => entry.mealName).length > 0 ? (
                    entries.filter(entry => entry.mealName).map(item => (
                      <MealCard
                        key={item.id || item.mealName}
                        item={item}
                        onPress={handleMealPress}
                        onDelete={() => handleDeleteMeal(item.id)}
                        onEditQuantity={() => {
                          setSelectedMealEntry(item);
                          setEditQuantity(String(item.quantity || 100));
                          setEditMealModalVisible(true);
                        }}
                      />
                    ))
                  ) : (
                    <View style={styles.emptySection}>
                      <Text style={styles.emptySectionText}>No meals logged for this day</Text>
                    </View>
                  )}
                </Collapsible>

                <View style={styles.sectionHeader}>
                  <Ionicons name="scale" size={32} color={theme.colors.primary} style={{ marginRight: 8 }} />
                  <Text style={styles.sectionTitle}>Weight</Text>
                  <TouchableOpacity
                    style={[styles.headerAddButton, isFutureDate && styles.disabledButton]}
                    onPress={!isFutureDate ? handleOpenWeightModal : () => Alert.alert("Future Date", "You cannot log weight for a future date.")}
                    disabled={isFutureDate}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    {weightEntry ? (
                      <Ionicons name="pencil" size={28} color={theme.colors.primary} />
                    ) : (
                      <Ionicons name="add-circle" size={28} color={theme.colors.primary} />
                    )}
                  </TouchableOpacity>
                </View>
                {isFutureDate ? (
                  <View style={styles.emptySection}><Text style={styles.emptySectionText}>Cannot log weight for a future date.</Text></View>
                ) : weightEntry ? (
                    <WeightCard
                      item={weightEntry}
                      onEdit={handleOpenWeightModal} // It's not a future date, so direct call
                      isEditable={true}             // It's not a future date, so it's editable
                    />
                ) : (
                  <View style={styles.emptySection}>
                    <Text style={styles.emptySectionText}>No weight logged for this day</Text>
                  </View>
                )}
                <TouchableOpacity
                  style={{ marginVertical: 10, alignSelf: 'center', backgroundColor: theme.colors.primary, borderRadius: 8, padding: 8 }}
                  onPress={() => setIsCommentModalVisible(true)}
                >
                  <Text style={{ color: '#fff', fontWeight: 'bold' }}>
                    {dayComment ? 'Modify comment of the day' : 'Add comment of the day'}
                  </Text>
                </TouchableOpacity>
                <Text style={{ margin: 8, fontStyle: 'italic', color: '#555' }}>{dayComment}</Text>
              </>
            
          </ScrollView>
        </Animated.View>

        <DateTimePickerModal
          isVisible={isDatePickerVisible}
          mode="date"
          onConfirm={handleConfirm}
          onCancel={hideDatePicker}
        />

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

        <Modal
          visible={editMealModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setEditMealModalVisible(false)}
        >
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0008' }}>
            <View style={{ backgroundColor: 'white', padding: 20, borderRadius: 10, width: 250 }}>
              <Text>Modify quantity (grams):</Text>
              <TextInput
                value={editQuantity}
                onChangeText={setEditQuantity}
                keyboardType="numeric"
                style={{ borderBottomWidth: 1, marginBottom: 10, fontSize: 18, padding: 4 }}
              />
              <Button
                title="Save"
                onPress={async () => {
                  await handleUpdateMealQuantity();
                  setEditMealModalVisible(false);
                }}
              />
              <Button title="Cancel" onPress={() => setEditMealModalVisible(false)} />
            </View>
          </View>
        </Modal>

        <Modal
          visible={isCommentModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setIsCommentModalVisible(false)}
        >
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0008' }}>
            <View style={{ backgroundColor: 'white', padding: 20, borderRadius: 10, width: 280 }}>
              <Text style={{ fontWeight: 'bold', marginBottom: 8 }}>Comment on the day</Text>
              <TextInput
                value={dayComment}
                onChangeText={setDayCommentState}
                placeholder="Add comments or notes..."
                style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 8, minHeight: 60, marginBottom: 12 }}
                multiline
              />
              <Button
                title="Save"
                onPress={async () => {
                  const user = auth.currentUser;
                  await setDayComment(user.uid, format(selectedDate, 'yyyy-MM-dd'), dayComment);
                  setIsCommentModalVisible(false);
                }}
              />
              <Button title="Cancel" onPress={() => setIsCommentModalVisible(false)} />
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
    </ImageBackground>
  );
};

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

const styles = StyleSheet.create({
  safeArea: {
  flex: 1,
  
},
container: {
  flex: 1,
  backgroundColor: 'rgba(255, 255, 255, 0.26)',
  
},

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.card,
    shadowColor: theme.colors.shadow,
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
    color: theme.colors.primary,
  },
  calendarIcon: { marginLeft: 4 },
  animatedContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  entriesContainer: {
    flex: 1,
    marginHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.sm,
    borderRadius: 12,
    backgroundColor: theme.colors.card,
  },
  entriesContent: {
    paddingVertical: theme.spacing.sm,
    paddingBottom: 20,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  emptyMessage: {
    ...theme.typography.empty,
    marginTop: 12,
  },
  sectionHeader: {
    ...theme.sectionHeader,
  },
  headerToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  sectionTitle: {
    ...theme.typography.sectionTitle,
  },
  headerAddButton: {
    backgroundColor: theme.colors.card,
    borderRadius: 20,
    padding: 4,
    position: 'absolute',
    right: theme.spacing.md,
  },
  card: {
    ...theme.card,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
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
    ...theme.input,
    marginRight: 8,
    flex: 1,
  },
  smallButton: {
    ...theme.button,
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
    color: theme.colors.text,
    textAlign: 'center',
  },
  setRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    paddingHorizontal: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptySectionText: {
    ...theme.typography.empty,
  },
  modalOverlay: {
    ...theme.modal.overlay,
  },
  modalContainer: {
    ...theme.modal.container,
  },
  modalLabel: {
    ...theme.modal.label,
  },
  modalTitle: {
    ...theme.modal.title,
  },
  modalInput: {
    ...theme.modal.input,
  },
  modalButtons: {
    ...theme.modal.buttons,
  },
  modalButton: {
    ...theme.modal.button,
  },
  cancelButton: {
    ...theme.modal.cancelButton,
  },
  submitButton: {
    ...theme.modal.submitButton,
  },
  modalButtonText: {
    ...theme.modal.buttonText,
  },
  nutritionSummaryCard: {
    ...theme.nutritionSummaryCard,
  },
  nutritionSummaryTitle: {
    ...theme.typography.sectionTitle,
    marginBottom: 8,
  },
  nutritionSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 2,
  },
  nutritionSummaryLabel: {
    ...theme.typography.label,
  },
  nutritionSummaryValue: {
    ...theme.typography.value,
  },
  progressBarBackground: {
    ...theme.progressBarBackground,
  },
  progressBarFill: {
    ...theme.progressBarFill,
  },
  disabledButton: {
    opacity: 0.5,
  },
});

export default DiaryScreen;

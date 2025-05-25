import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, SafeAreaView, StatusBar, ActivityIndicator, TextInput, StyleSheet, Modal, Image, Alert } from 'react-native';
import { fetchExercises, addUserExercise, fetchUserExercises, deleteUserExercise } from '../services/firebaseExerciseService';
import { addExerciseToDiary } from '../services/diaryService';
import { auth } from '../services/firebase';
import { Ionicons } from '@expo/vector-icons'; // Ionicons is imported
import { Picker } from '@react-native-picker/picker';
import theme from '../styles/theme';
import { collection, query, orderBy, startAt, endAt, getDocs } from "firebase/firestore";
import { db } from '../services/firebase';

const searchExercises = async (searchText) => {
  // Fetch all exercises (or just names/ids)
  const snapshot = await getDocs(collection(db, "exercises"));
  const allExercises = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  // Filter client-side for "contains"
  const results = allExercises.filter(ex =>
    (ex.Name || '').toLowerCase().includes(searchText.toLowerCase())
  );

  return results;
};

const ExerciseListScreen = ({ navigation, route }) => {
  const [exercises, setExercises] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false); // This state is declared but not currently used. Consider removing or implementing load more functionality.
  const [lastDoc, setLastDoc] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [addExerciseModalVisible, setAddExerciseModalVisible] = useState(false);
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState("");
  const [selectedEquipment, setSelectedEquipment] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("");
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  const difficultyLevels = ["Novice", "Beginner", "Intermediate", "Advanced", "Expert", "Master", "Grand Master", "Legendary"];
  const targetMuscleGroups = [
    "Abdominals", "Abductors", "Adductors", "Back", "Biceps", "Calves",
    "Chest", "Forearms", "Glutes", "Hamstrings", "Hip Flexors","Neck",
    "Quadriceps", "Shins", "Shoulders", "Trapezius", "Triceps"
  ];
  const equipmentOptions = [
    "Ab Wheel", "Barbell", "Battle Ropes", "Bodyweight", "Bulgarian Bag", "Cable", "Clubbell", "Dumbbell", "EZ Bar",
    "Gymnastic Rings", "Heavy Sandbag", "Indian Club", "Kettlebell", "Landmine", "Macebell", "Medicine Ball",
    "Miniband", "Parallette Bars", "Pull Up Bar", "Resistance Band", "Sandbag", "Slam Ball", "Sliders",
    "Stability Ball", "Superband", "Suspension Trainer", "Tire", "Trap Bar", "Wall Ball", "Weight Plate"
  ];

  const [newExercise, setNewExercise] = useState({
    Name: '',
    "Difficulty Level": difficultyLevels[0], // Default to the first option
    "Target Muscle Group": targetMuscleGroups[0], // Default to the first option
    "Primary Equipment": '',
    "Primary Exercise Classification": '',
    "Prime Mover Muscle": "",
    "Secondary Muscle": "",
    "Tertiary Muscle": "",
    Posture: "",
    Grip: "",
    "Movement Pattern #1": "",
    "Body Region": "",
  });
  const { date } = route.params;

  const loadExercises = async (startAfterDoc = null, append = false) => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      let userExercises = [];
      if (user) {
        const { exerciseList: userList } = await fetchUserExercises(user.uid, 50, startAfterDoc);
        userExercises = userList;
      }
      const { exerciseList: globalList, lastDoc: newLastDoc } = await fetchExercises(50, startAfterDoc);
      const newExercises = [...userExercises, ...globalList.filter(e => !userExercises.some(u => u.Name === e.Name))];

      if (append) {
        setExercises(prev => [...prev, ...newExercises]);
      } else {
        setExercises(newExercises);
      }
      setLastDoc(newLastDoc);
    } catch (error) {
      console.error('Error fetching exercises:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadExercisesAndResetPagination = useCallback(async () => {
    setExercises([]); // Clear existing exercises to start fresh
    setLastDoc(null); // Reset pagination
    await loadExercises(null); // Load the first page
  }, []); // Empty dependency array as loadExercises itself is stable or will be recreated if its deps change

  useEffect(() => {
    loadExercisesAndResetPagination();
  }, [loadExercisesAndResetPagination]);

  const applyFilters = (data) => {
    let filtered = [...data];

    if (filter === 'created') {
      const user = auth.currentUser;
      if (user) {
        filtered = filtered.filter(exercise => exercise.uid === user.uid);
      } else {
        filtered = [];
      }
    }

    if (selectedMuscleGroup && selectedMuscleGroup !== "") {
      filtered = filtered.filter(exercise => exercise["Target Muscle Group"] === selectedMuscleGroup);
    }
    if (selectedEquipment && selectedEquipment !== "") {
      filtered = filtered.filter(exercise => exercise["Primary Equipment"] === selectedEquipment);
    }
    if (selectedDifficulty && selectedDifficulty !== "") {
      filtered = filtered.filter(exercise => exercise["Difficulty Level"] === selectedDifficulty);
    }

    return filtered;
  };


  const handleAddExercise = async (exercise) => {
    const user = auth.currentUser;
    if (user) {
      try {
        // Ensure the exercise object has all the required fields
        const formattedExercise = {
          Name: exercise["Name"] || "",
          "Difficulty Level": exercise["Difficulty Level"] || "",
          "Target Muscle Group": exercise["Target Muscle Group"] || "",
          "Prime Mover Muscle": exercise["Prime Mover Muscle"] || "",
          "Secondary Muscle": exercise["Secondary Muscle"] || "",
          "Tertiary Muscle": exercise["Tertiary Muscle"] || "",
          "Primary Equipment": exercise["Primary Equipment"] || "",
          Posture: exercise["Posture"] || "",
          Grip: exercise["Grip"] || "",
          "Movement Pattern #1": exercise["Movement Pattern #1"] || "",
          "Body Region": exercise["Body Region"] || "",
          "Primary Exercise Classification": exercise["Primary Exercise Classification"] || ""
        };

        await addExerciseToDiary(user.uid, date, formattedExercise);
        console.log('Exercise added successfully to diary');
        navigation.goBack();
      } catch (error) {
        console.error('Error adding exercise to diary:', error);
      }
    } else {
      console.log('No user is signed in.');
    }
  };

  const handleSaveNewExercise = async () => {
    if (!newExercise.Name.trim()) {
      alert('Please enter an exercise name.');
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      alert('You must be signed in to add an exercise.');
      return;
    }

    try {
      const exerciseToSave = {
        ...newExercise,
        uid: user.uid, // <-- Add this line
        isPopular: false,
        date: new Date().toISOString(),
        "Primary Equipment": newExercise["Primary Equipment"] || "",
        "Primary Exercise Classification": newExercise["Primary Exercise Classification"] || "",
        "Prime Mover Muscle": newExercise["Prime Mover Muscle"] || "",
        "Secondary Muscle": newExercise["Secondary Muscle"] || "",
        "Tertiary Muscle": newExercise["Tertiary Muscle"] || "",
        Posture: newExercise["Posture"] || "",
        Grip: newExercise["Grip"] || "",
        "Movement Pattern #1": newExercise["Movement Pattern #1"] || "",
        "Body Region": newExercise["Body Region"] || "",
      };
      await addUserExercise(user.uid, exerciseToSave);
      console.log('New exercise added to user collection');
      await loadExercisesAndResetPagination();
      setAddExerciseModalVisible(false);
      setNewExercise({
        Name: '',
        "Difficulty Level": difficultyLevels[0],
        "Target Muscle Group": targetMuscleGroups[0],
        "Primary Equipment": '',
        "Primary Exercise Classification": '',
        "Prime Mover Muscle": "",
        "Secondary Muscle": "",
        "Tertiary Muscle": "",
        Posture: "",
        Grip: "",
        "Movement Pattern #1": "",
        "Body Region": "",
      });
    } catch (error) {
      console.error('Error saving new exercise:', error);
      alert('Failed to save exercise. Please try again.');
    }
  };
  // Example: Map muscle group to PNG
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
  // ...add all muscle groups
};

  const renderExerciseItem = ({ item }) => {
    const iconSource = muscleIcons[item["Target Muscle Group"]] || muscleIcons.Default;
    const user = auth.currentUser;
    const isCreatedByUser = item.uid === user?.uid;

    const handleDelete = () => {
      Alert.alert(
        "Delete Exercise",
        "Are you sure you want to delete this exercise?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              try {
                await deleteUserExercise(user.uid, item.id);
                setExercises(prev => prev.filter(ex => ex.id !== item.id));
              } catch (error) {
                alert('Failed to delete exercise.');
              }
            }
          }
        ]
      );
    };

    return (
      <TouchableOpacity
        style={styles.item}
        onPress={() => handleAddExercise(item)}
      >
        <View style={styles.itemContent}>
          <Image source={iconSource} style={{ width: 80, height:80, marginRight: 12 }} resizeMode="contain" />
          <View style={styles.itemTextContainer}>
            <Text style={styles.itemText}>{item["Name"]}</Text>
            <View style={{ flexDirection: 'row', marginTop: 4 }}>
              {item["Target Muscle Group"]  ? (
                <View style={styles.tag}>
                  <Text style={styles.tagText}>
                    {item["Target Muscle Group"] }
                  </Text>
                </View>
              ) : null}
              {item["Primary Equipment"] ? (
                <View style={styles.tag}>
                  <Text style={styles.tagText}>
                    {item["Primary Equipment"] }
                  </Text>
                </View>
              ) : null}
              {item["Difficulty Level"] ? (
                <View style={styles.tag}>
                  <Text style={styles.tagText}>
                    {item["Difficulty Level"]}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="add-circle-outline" size={24} color={theme.colors.primary} />
          {isCreatedByUser && (
            <TouchableOpacity onPress={handleDelete} style={{ marginLeft: 12 }}>
              <Ionicons name="trash-outline" size={24} color="red" />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderTabButton = (tabName, label) => (
    <TouchableOpacity
      onPress={() => setFilter(tabName)}
      style={[styles.tab, filter === tabName && styles.activeTab]}
    >
      <Text style={[styles.tabText, filter === tabName && styles.activeTabText]}>{label}</Text>
    </TouchableOpacity>
  );

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setSearchResults([]);
      return;
    }
    const fetchResults = async () => {
      const results = await searchExercises(searchQuery.trim());
      setSearchResults(results);
    };
    fetchResults();
  }, [searchQuery]);

  // When a filter changes and searchQuery is empty, fetch all exercises and apply filters
  useEffect(() => {
    if (searchQuery.trim() === "") {
      const fetchAll = async () => {
        const snapshot = await getDocs(collection(db, "exercises"));
        const allExercises = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setExercises(allExercises);
      };
      fetchAll();
    }
  }, [selectedMuscleGroup, selectedEquipment, selectedDifficulty]);

  if (loading && exercises.length === 0) { // Show main loader only if no exercises are loaded yet
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Search and Add Button Container */}
      <View style={styles.searchAddContainer}>
        <TextInput
          style={styles.searchBar}
          placeholder="Search exercises..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={theme.colors.muted}
        />
        <TouchableOpacity
          style={styles.addExerciseButton}
          onPress={() => setAddExerciseModalVisible(true)}
        >
          <Ionicons name="add-circle-outline" size={24} color="white" />
          <Text style={styles.addExerciseButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        {renderTabButton('all', 'All')}
        {renderTabButton('created', 'Created')}
      </View>

      

      {/* Filter Toggle Button */}
      <TouchableOpacity
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          alignSelf: 'flex-end',
          marginRight: theme.spacing.lg,
          marginBottom: 4,
          padding: 4,
        }}
        onPress={() => setFiltersVisible(v => !v)}
      >
        <Ionicons
          name={filtersVisible ? 'chevron-up-outline' : 'filter-outline'}
          size={18}
          color={theme.colors.primary}
        />
        <Text style={{ color: theme.colors.primary, fontSize: 14, marginLeft: 4 }}>
          {filtersVisible ? 'Hide Filters' : 'Show Filters'}
        </Text>
      </TouchableOpacity>

      {/* Filter Options - Small Screen */}
      {filtersVisible && (
        <View style={{ marginHorizontal: theme.spacing.lg, marginBottom: theme.spacing.sm }}>
          <View style={{ marginBottom: 4 }}>
            <Picker
              selectedValue={selectedMuscleGroup}
              style={styles.filterPickerSmall}
              onValueChange={value => setSelectedMuscleGroup(value)}
            >
              <Picker.Item label="All Muscle Groups" value="" />
              {[...new Set(targetMuscleGroups)].map((group) => (
  <Picker.Item key={group} label={group} value={group} />
))}
            </Picker>
          </View>
          <View style={{ marginBottom: 4 }}>
            <Picker
              selectedValue={selectedEquipment}
              style={styles.filterPickerSmall}
              onValueChange={value => setSelectedEquipment(value)}
            >
              <Picker.Item label="All Equipment" value="" />
              {equipmentOptions.map((eq, idx) => (
                <Picker.Item key={idx} label={eq} value={eq} />
              ))}
            </Picker>
          </View>
          <View>
            <Picker
              selectedValue={selectedDifficulty}
              style={styles.filterPickerSmall}
              onValueChange={value => setSelectedDifficulty(value)}
            >
              <Picker.Item label="All Difficulties" value="" />
              {difficultyLevels.map((level, idx) => (
                <Picker.Item key={idx} label={level} value={level} />
              ))}
            </Picker>
          </View>
        </View>
      )}

      {/* Add Exercise Modal */}
      <Modal
        visible={addExerciseModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAddExerciseModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Exercise</Text>
            <TextInput
              placeholder="Name"
              value={newExercise.Name}
              onChangeText={(value) => setNewExercise({ ...newExercise, Name: value })}
              style={styles.input}
              placeholderTextColor={theme.colors.muted}
            />
            <Text style={styles.pickerLabel}>Difficulty Level:</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={newExercise["Difficulty Level"]}
                style={styles.picker}
                itemStyle={styles.pickerItem} // For iOS item styling
                onValueChange={(itemValue) =>
                  setNewExercise({ ...newExercise, "Difficulty Level": itemValue })
                }>
                {difficultyLevels.map((level, index) => (
                  <Picker.Item key={index} label={level} value={level} />
                ))}
              </Picker>
            </View>
            <Text style={styles.pickerLabel}>Target Muscle Group:</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={newExercise["Target Muscle Group"]}
                style={styles.picker}
                itemStyle={styles.pickerItem} // For iOS item styling
                onValueChange={(itemValue) =>
                  setNewExercise({ ...newExercise, "Target Muscle Group": itemValue })
                }>
                {targetMuscleGroups.map((group, index) => (
                  <Picker.Item key={index} label={group} value={group} />
                ))}
              </Picker>
            </View>
            <Text style={styles.pickerLabel}>Primary Equipment:</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={newExercise["Primary Equipment"]}
                style={styles.picker}
                itemStyle={styles.pickerItem}
                onValueChange={(itemValue) =>
                  setNewExercise({ ...newExercise, "Primary Equipment": itemValue })
                }>
                <Picker.Item label="Select Equipment" value="" />
                {equipmentOptions.map((equipment, index) => (
                  <Picker.Item key={index} label={equipment} value={equipment} />
                ))}
              </Picker>
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setAddExerciseModalVisible(false)} style={styles.modalCancel}>
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSaveNewExercise} style={styles.modalSave}>
                <Text style={styles.modalButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <FlatList
        data={
          searchQuery.trim()
            ? applyFilters(searchResults)
            : applyFilters(exercises)
        }
        keyExtractor={item => item.id}
        renderItem={renderExerciseItem}
      />
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  searchAddContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: theme.spacing.lg,
    marginHorizontal: theme.spacing.lg,
    color: theme.colors.primary,
  },
  tabs: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.card,
    borderRadius: 25,
    marginHorizontal: theme.spacing.lg, // Use marginHorizontal instead of margin
    padding: theme.spacing.xs + 1,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  tab: {
    flex: 1,
    paddingVertical: theme.spacing.sm + 2,
    alignItems: 'center',
    borderRadius: 20,
  },
  activeTab: {
    backgroundColor: theme.colors.primary,
  },
  tabText: {
    fontSize: 16,
    color: theme.colors.primary,
  },
  activeTabText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  searchBar: {
    flex: 1,
    height: 45,
    borderColor: theme.colors.primary,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: theme.spacing.md,
    marginRight: theme.spacing.md,
    backgroundColor: theme.colors.card,
    fontSize: 16,
    color: theme.colors.text, // Ensure text color is set
  },
  addExerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.sm + 2,
    paddingHorizontal: theme.spacing.md,
    borderRadius: 20,
    height: 45,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  addExerciseButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  listContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg, // Add padding to bottom for better scroll experience
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md - 1,
    backgroundColor: theme.colors.card,
    borderRadius: 10,
    marginBottom: theme.spacing.sm + 2,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemIcon: {
    marginRight: theme.spacing.md - 1,
  },
  itemTextContainer: {
    flex: 1,
  },
  itemText: {
    fontSize: 18,
    color: theme.colors.text,
    fontWeight: '500', // Slightly bolder text
  },
  difficultyTag: {
    fontSize: 12,
    color: theme.colors.primary, // Use primary color for consistency
    fontWeight: 'bold',
    marginTop: 4,
    backgroundColor: theme.colors.primaryMuted, // A light background for the tag
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
    borderRadius: theme.spacing.xs,
    overflow: 'hidden', // Ensures borderRadius is applied
    alignSelf: 'flex-start', // To make background only wrap text
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: theme.colors.card,
    borderRadius: 10,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: theme.colors.text,
  },
  input: {
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: 10,
    marginBottom: 12,
    fontSize: 16,
    color: theme.colors.text,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalCancel: {
    backgroundColor: theme.colors.muted,
    paddingVertical: 12, paddingHorizontal: 10, borderRadius: 5, flex: 1, marginRight: 10, alignItems: 'center',
  },
  modalSave: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 12, paddingHorizontal: 10, borderRadius: 5, flex: 1, marginLeft: 10, alignItems: 'center',
  },
  modalButtonText: {
    color: 'white', textAlign: 'center', fontWeight: 'bold', fontSize: 16,
  },
  pickerLabel: {
    fontSize: 16,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xs,
  },
  pickerContainer: { // Added a container for better styling control of Picker
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 5,
    marginBottom: theme.spacing.sm,
    backgroundColor: theme.colors.background, // Match input field background
  },
  picker: {
    height: 50,
    width: '100%',
    color: theme.colors.text, // Ensure picker text color matches
  },
  pickerItem: { // Specifically for iOS to style picker items
    height: 120,
    fontSize: 16,
    color: theme.colors.text, // Ensure picker item text color matches
  },
 
  tag: {
    
  backgroundColor: theme.colors.primary,
  borderRadius: 999, // Ensures pill shape
  paddingVertical: 5, // Slightly more vertical padding
  paddingHorizontal: 4, // Slightly more horizontal padding
  marginRight: 4,
  marginBottom: 2,
  alignSelf: 'center', // Center vertically in row
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: 24, // Ensures enough height for pill look
},
tagText: {
  color: '#fff',
  fontWeight: 'bold',
  fontSize: 13,
  letterSpacing: 0.2,
},
filterPicker: {
  width: '100%',
  backgroundColor: theme.colors.card,
  color: theme.colors.text,
  borderRadius: 8,
  marginBottom: 0,
},
filterPickerSmall: {
  width: '100%',
  minWidth: 120, // Ensures enough width for text
  backgroundColor: theme.colors.card,
  color: theme.colors.text,
  borderRadius: 8,
  marginBottom: 0,
  height: 50, // Increased height for better visibility
  fontSize: 15, // Increased font size for readability
},
});
export default ExerciseListScreen;

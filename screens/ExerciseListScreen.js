import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  ImageBackground,
  Text,
  Animated,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  TextInput,
  StyleSheet,
  Modal,
  Image,
  Alert,
} from 'react-native';
import {
  fetchUserPrograms,
  deleteUserProgram,
  fetchUserExercises,
  fetchExercises,
  addUserExercise,
  deleteUserExercise,
  toggleFavoriteExercise,
  fetchFavoriteExercises,
} from '../services/firebaseExerciseService.js';
import { addExerciseToDiary } from '../services/diaryService';
import { auth } from '../services/firebase';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import theme from '../styles/theme';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { getMuscleIcon } from '../utils/muscleIcons';

const searchExercises = async (searchText) => {
  const snapshot = await getDocs(collection(db, 'exercises'));
  const allExercises = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  return allExercises.filter((ex) =>
    (ex.Name || '').toLowerCase().includes(searchText.toLowerCase())
  );
};

const ExerciseListScreen = ({ navigation, route }) => {
  const [exercises, setExercises] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [lastDoc, setLastDoc] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [addExerciseModalVisible, setAddExerciseModalVisible] = useState(false);
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [favoriteExercises, setFavoriteExercises] = useState([]);

  const difficultyLevels = [
    'Novice',
    'Beginner',
    'Intermediate',
    'Advanced',
    'Expert',
    'Master',
    'Grand Master',
    'Legendary',
  ];
  const targetMuscleGroups = [
    'Abdominals', 'Abductors', 'Adductors', 'Back', 'Biceps', 'Calves',
    'Chest', 'Forearms', 'Glutes', 'Hamstrings', 'Hip Flexors', 'Neck',
    'Quadriceps', 'Shins', 'Shoulders', 'Trapezius', 'Triceps'
  ];
  const equipmentOptions = [
    "Ab Wheel", "Barbell", "Battle Ropes", "Bodyweight", "Bulgarian Bag", "Cable", "Clubbell", "Dumbbell", "EZ Bar",
    "Gymnastic Rings", "Heavy Sandbag", "Indian Club", "Kettlebell", "Landmine", "Macebell", "Medicine Ball",
    "Miniband", "Parallette Bars", "Pull Up Bar", "Resistance Band", "Sandbag", "Slam Ball", "Sliders",
    "Stability Ball", "Superband", "Suspension Trainer", "Tire", "Trap Bar", "Wall Ball", "Weight Plate"
  ];

  const [newExercise, setNewExercise] = useState({
    Name: '',
    "Difficulty Level": difficultyLevels[0],
    "Target Muscle Group": targetMuscleGroups[0],
    "Primary Equipment": equipmentOptions[0], // Set default to first equipment option
    "Primary Exercise Classification": '',
    "Prime Mover Muscle": "",
    "Secondary Muscle": "",
    "Tertiary Muscle": "",
    Posture: "",
    Grip: "",
    "Movement Pattern #1": "",
    "Body Region": "",
  });

  const { date, mode, originRoute } = route.params || {};
  const fadeAnim = useRef(new Animated.Value(0)).current;
 const [previousExercises, setPreviousExercises] = useState([]);

  // CHARGEMENT PRINCIPAL
  const loadExercises = async (startAfterDoc = null, append = false) => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      let userExercises = [];
      
      if (filter === 'favorites') {
        // Load favorite exercises
        if (user) {
          const { exerciseList: favExercises } = await fetchFavoriteExercises(user.uid);
          const favoriteIds = favExercises.map(f => f.id);
          if (favoriteIds.length > 0) {
            // Récupère tous les exercices de la base
            const snapshot = await getDocs(collection(db, "exercises"));
            const allExercises = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            // Filtre uniquement ceux qui sont dans les favoris
            const favFull = allExercises.filter(ex => favoriteIds.includes(ex.id));
            setExercises(favFull);
            setFavoriteExercises(favoriteIds);
          } else {
            setExercises([]);
            setFavoriteExercises([]);
          }
        }
      } else {
        // Load regular exercises
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
      }

      // Load favorite exercise IDs for heart icons
      if (user && filter !== 'favorites') {
        const { exerciseList: favExercises } = await fetchFavoriteExercises(user.uid);
        setFavoriteExercises(favExercises.map(ex => ex.id));
      }
    } catch (error) {
      console.error('Error fetching exercises:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadExercisesAndResetPagination = useCallback(async () => {
  setExercises([]);   // <-- Vide la liste, donc FlatList sera vide AVANT le fetch, donc pas de flash
  setLastDoc(null);
  await loadExercises(null);
}, [filter]);



  // FADE-ANIM LISTE SEULEMENT
  useEffect(() => {
    if (!loading) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 20,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [loading]);


useEffect(() => {
  // On met à jour la liste affichée uniquement quand le loading est terminé
  if (!loading) {
    setPreviousExercises(getFilteredExercises());
  }
  // eslint-disable-next-line
}, [loading, exercises, searchQuery, searchResults, filter, selectedMuscleGroup, selectedEquipment, selectedDifficulty]);


  useEffect(() => {
    if (searchQuery.trim() === "") {
      setSearchResults([]);
      return;
    }
    if (filter === 'favorites') {
      // Recherche uniquement dans les favoris déjà chargés
      setSearchResults(
        exercises.filter(ex =>
          (ex.Name || '').toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    } else {
      const fetchResults = async () => {
        const results = await searchExercises(searchQuery.trim());
        setSearchResults(results);
      };
      fetchResults();
    }
  }, [searchQuery, filter, favoriteExercises, exercises]);

  // FILTRES
 const applyFilters = (data) => {
  let filtered = [...data];

  // FILTRES (muscle, equipment, difficulty) — always apply, but relaxed
  if (selectedMuscleGroup && selectedMuscleGroup !== "") {
    filtered = filtered.filter(
      (exercise) =>
        !exercise["Target Muscle Group"] ||
        exercise["Target Muscle Group"] === selectedMuscleGroup
    );
  }
  if (selectedEquipment && selectedEquipment !== "") {
    filtered = filtered.filter(
      (exercise) =>
        !exercise["Primary Equipment"] ||
        exercise["Primary Equipment"] === selectedEquipment
    );
  }
  if (selectedDifficulty && selectedDifficulty !== "") {
    filtered = filtered.filter(
      (exercise) =>
        !exercise["Difficulty Level"] ||
        exercise["Difficulty Level"] === selectedDifficulty
    );
  }

  // Filtre "created" : seulement les exercices créés par l'utilisateur
  if (filter === 'created') {
    const user = auth.currentUser;
    if (user) {
      filtered = filtered.filter((exercise) => exercise.uid === user.uid);
    } else {
      filtered = [];
    }
  }

  // Recherche (searchQuery)
  if (searchQuery.trim()) {
    filtered = filtered.filter((exercise) =>
      (exercise.Name || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }
  return filtered;
};


  const getFilteredExercises = () => {
  let filtered = [...exercises];
  const user = auth.currentUser;

  // First apply tab filter (created/favorites)
  if (filter === 'created') {
    if (user) {
      filtered = filtered.filter(exercise => exercise.uid === user.uid);
    } else {
      filtered = [];
    }
  } else if (filter === 'favorites') {
    filtered = filtered.filter(exercise => favoriteExercises.includes(exercise.id));
  }

  // Apply search filter first (from searchResults or current filtered list)
  if (searchQuery.trim()) {
    if (filter === 'favorites' || filter === 'created') {
      // For favorites/created, search within the already filtered results
      filtered = filtered.filter((exercise) =>
        (exercise.Name || '').toLowerCase().includes(searchQuery.toLowerCase())
      );
    } else {
      // For 'all', use searchResults if available
      filtered = searchQuery.trim() ? searchResults : filtered;
    }
  }

  // Apply additional filters when filters are visible (for all tabs)
  if (filtersVisible) {
    if (selectedMuscleGroup && selectedMuscleGroup !== "") {
      filtered = filtered.filter(exercise => 
        exercise["Target Muscle Group"] && 
        exercise["Target Muscle Group"] === selectedMuscleGroup
      );
    }
    if (selectedEquipment && selectedEquipment !== "") {
      filtered = filtered.filter(exercise => 
        exercise["Primary Equipment"] && 
        exercise["Primary Equipment"] === selectedEquipment
      );
    }
    if (selectedDifficulty && selectedDifficulty !== "") {
      filtered = filtered.filter(exercise => 
        exercise["Difficulty Level"] && 
        exercise["Difficulty Level"] === selectedDifficulty
      );
    }
  }
  
  return filtered;
};

  // UI
  const getEmptyStateText = () => {
    if (searchQuery.trim()) {
      return 'No exercises found matching your search.';
    }
    switch (filter) {
      case 'created':
        return "You haven't created any exercises yet. Tap '+' to create your first exercise.";
      case 'favorites':
        return "You haven't favorited any exercises yet. Browse exercises and tap the heart icon to add them to favorites.";
      default:
        return "No exercises available. Tap '+' to create your first exercise.";
    }
  };

  const handleToggleFavorite = async (exerciseId, isCurrentlyFavorite) => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Error", "Please log in to favorite exercises.");
      return;
    }
    try {
      await toggleFavoriteExercise(user.uid, exerciseId, !isCurrentlyFavorite);
      if (isCurrentlyFavorite) {
        setFavoriteExercises(prev => prev.filter(id => id !== exerciseId));
        if (filter === 'favorites') {
          setExercises(prev => prev.filter(ex => ex.id !== exerciseId));
        }
      } else {
        setFavoriteExercises(prev => [...prev, exerciseId]);
      }
    } catch (error) {
      Alert.alert("Error", "Unable to update favorite status.");
    }
  };

  const handleDelete = async (item) => {
    const user = auth.currentUser;
    if (!user) return;
    Alert.alert(
      "Delete Exercise",
      "Are you sure you want to delete this exercise?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete", style: "destructive", onPress: async () => {
            try {
              await deleteUserExercise(user.uid, item.id);
              setExercises(prev => prev.filter(ex => ex.id !== item.id));
            } catch {
              alert('Failed to delete exercise.');
            }
          }
        }
      ]
    );
  };

   const handleAddExercise = async (exercise) => {
    // Destructure params directly inside the function to ensure freshest values
    // and handle cases where route.params might be null or undefined.
    const currentParams = route.params || {};
    const currentMode = currentParams.mode;
    const currentOriginRoute = currentParams.originRoute;
    const currentDateForDiary = currentParams.date; // Will be undefined in 'selectForProgram' mode

    console.log('[ExerciseListScreen] handleAddExercise called.');
    console.log('[ExerciseListScreen] currentMode:', currentMode);
    console.log('[ExerciseListScreen] currentOriginRoute:', currentOriginRoute);
    console.log('[ExerciseListScreen] currentDateForDiary:', currentDateForDiary);

    if (currentMode === 'selectForProgram' && currentOriginRoute) {
      console.log('[ExerciseListScreen] Mode is selectForProgram. Navigating back to:', currentOriginRoute);
      // Navigate back to originRoute with selected exercise
      navigation.navigate(currentOriginRoute, {
        selectedExerciseForProgram: { id: exercise.id, ...exercise }
      });
      return; // Crucial: exit here to prevent diary logic
    } else {
      // This block handles adding the exercise to the diary
      console.log('[ExerciseListScreen] Mode is NOT selectForProgram or originRoute is missing. Proceeding to add to diary.');
      const user = auth.currentUser;
      if (user) {
        if (!currentDateForDiary) {
          console.error("[ExerciseListScreen] handleAddExercise: Date is undefined. Cannot add exercise to diary.");
          Alert.alert("Erreur", "Aucune date spécifiée pour l'agenda. Impossible d'ajouter l'exercice.");
          return; // Exit if no date is provided for diary entry
        }
        console.log('[ExerciseListScreen] Adding to diary with date:', currentDateForDiary);
        try {
          // Ensure the exercise object has all the required fields for the diary
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

          await addExerciseToDiary(user.uid, currentDateForDiary, formattedExercise);
          console.log('[ExerciseListScreen] Exercise added successfully to diary');
          navigation.goBack();
        } catch (error) {
          console.error('[ExerciseListScreen] Error adding exercise to diary:', error);
          Alert.alert("Erreur", "Une erreur est survenue lors de l'ajout de l'exercice à l'agenda.");
        }
      } else {
        console.log('[ExerciseListScreen] No user is signed in.');
        Alert.alert("Erreur", "Utilisateur non connecté. Veuillez vous connecter pour ajouter un exercice.");
      }
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
        "Primary Equipment": equipmentOptions[0], // Set default to first equipment option
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

  const renderExerciseItem = ({ item }) => {
  const displayedExercises = loading
    ? previousExercises
    : getFilteredExercises();

    const iconSource = getMuscleIcon(item["Target Muscle Group"]);
    const user = auth.currentUser;
    const isCreatedByUser = item.uid === user?.uid;
    const isFavorite = favoriteExercises.includes(item.id);

    return (
      <TouchableOpacity
        style={styles.item}
        onPress={() => handleAddExercise(item)}
      >
        <View style={styles.itemContent}>
          <Image source={iconSource} style={{ width: 80, height: 80, marginRight: 12 }} resizeMode="contain" />
          <View style={styles.itemTextContainer}>
            <Text style={styles.itemText} numberOfLines={2} ellipsizeMode="tail">{item["Name"]}</Text>
            <View style={styles.tagsContainer}>
              {item["Target Muscle Group"] && (
                <View style={styles.tag}>
                  <Text style={styles.tagText}>{item["Target Muscle Group"]}</Text>
                </View>
              )}
              {item["Primary Equipment"] && (
                <View style={styles.tag}>
                  <Text style={styles.tagText}>{item["Primary Equipment"]}</Text>
                </View>
              )}
              {item["Difficulty Level"] && (
                <View style={styles.tag}>
                  <Text style={styles.tagText}>{item["Difficulty Level"]}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
        <View style={styles.itemActionsContainer}>
          <TouchableOpacity
            onPress={() => handleToggleFavorite(item.id, isFavorite)}
            style={{ marginRight: 12 }}
          >
            <Ionicons
              name={isFavorite ? "heart" : "heart-outline"}
              size={24}
              color={isFavorite ? theme.colors.error : theme.colors.muted}
            />
          </TouchableOpacity>
          {isCreatedByUser && (
            <TouchableOpacity onPress={() => handleDelete(item)} style={{ marginLeft: 12 }}>
              <Ionicons name="trash-outline" size={24} color="red" />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const loadAllExercises = useCallback(async () => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      let userExercises = [];
      let globalExercises = [];
      let favExerciseIds = [];

      if (user) {
        const { exerciseList: userList } = await fetchUserExercises(user.uid);
        userExercises = userList;
        const { exerciseList: favList } = await fetchFavoriteExercises(user.uid);
        favExerciseIds = favList.map(f => f.id);
      }
      const { exerciseList: globalList } = await fetchExercises();
      globalExercises = globalList;

      // Merge and remove duplicates by id
      let allExercises = [
        ...userExercises,
        ...globalExercises.filter(g => !userExercises.some(u => u.id === g.id))
      ];

      // Find missing favorite exercises (not in allExercises)
      const missingFavIds = favExerciseIds.filter(
        favId => !allExercises.some(ex => ex.id === favId)
      );
      if (missingFavIds.length > 0) {
        // Fetch missing favorites from global collection
        const snapshot = await getDocs(collection(db, "exercises"));
        const allGlobal = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const missingFavs = allGlobal.filter(ex => missingFavIds.includes(ex.id));
        allExercises = [...allExercises, ...missingFavs];
      }

      setExercises(allExercises);
      setFavoriteExercises(favExerciseIds);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
  loadAllExercises();
}, []);

  return (
    <ImageBackground
      source={theme.backgroundImage.source}
      resizeMode={theme.backgroundImage.defaultResizeMode}
      style={styles.background}
    >
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
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
          {['all', 'favorites', 'created'].map((tab) =>
            <TouchableOpacity
              key={tab}
              onPress={() => setFilter(tab)}
              style={[styles.tab, filter === tab && styles.activeTab]}>
              <Text style={[styles.tabText, filter === tab && styles.activeTabText]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        {/* Remove this first filter button block */}
{/* 
{filter === 'all' && (
  <TouchableOpacity
    style={{
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-end',
      marginRight: theme.spacing.lg,
      marginBottom: 4,
      padding: 4,
    }}
    onPress={() => setFiltersVisible((v) => !v)}
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
)}
*/}

{/* Show filters button on all tabs */}
<TouchableOpacity
  style={{
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginRight: theme.spacing.lg,
    marginBottom: 4,
    padding: 4,
  }}
  onPress={() => setFiltersVisible((v) => !v)}
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

{/* Show filter pickers on all tabs */}
{filtersVisible && (
  <View style={{ marginHorizontal: theme.spacing.lg, marginBottom: theme.spacing.sm }}>
    <View style={{ marginBottom: 4 }}>
      <Picker
        selectedValue={selectedMuscleGroup}
        style={styles.filterPickerSmall}
        onValueChange={(value) => setSelectedMuscleGroup(value)}
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
        onValueChange={(value) => setSelectedEquipment(value)}
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
        onValueChange={(value) => setSelectedDifficulty(value)}
      >
        <Picker.Item label="All Difficulties" value="" />
        {difficultyLevels.map((level, idx) => (
          <Picker.Item key={idx} label={level} value={level} />
        ))}
      </Picker>
    </View>
  </View>
)}


        {/* ----------------- LA LISTE + LOADER + FADE ----------------- */}
      <View style={styles.listArea}>
  {loading ? (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
    </View>
  ) : (
    <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
      {getFilteredExercises().length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name={filter === 'favorites' ? "heart-dislike-outline" : "sad-outline"} size={64} color={theme.colors.muted} />
          <Text style={styles.emptyText}>{getEmptyStateText()}</Text>
        </View>
      ) : (
        <FlatList
          data={getFilteredExercises()}
          keyExtractor={item => item.id}
          renderItem={renderExerciseItem}
          contentContainerStyle={styles.listContent}
        />
      )}
    </Animated.View>
  )}
</View>

 <Modal
        visible={addExerciseModalVisible}
        animationType="fade"
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
</SafeAreaView>
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
  listArea: {
  flex: 1,
  minHeight: 200,
},

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.muted,
    textAlign: 'center',
    marginTop: theme.spacing.md,
    lineHeight: 22,
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
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap', // Allow tags to wrap
    marginTop: 4,
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
  itemActionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: theme.spacing.sm, // Add a small left margin for separation
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

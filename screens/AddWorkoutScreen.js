import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity } from 'react-native';
import { fetchExercises } from '../services/firebaseexerciseService'; // Import your exercise service

const AddWorkoutScreen = () => {
  const [exercises, setExercises] = useState([]); // State for all exercises
  const [filteredExercises, setFilteredExercises] = useState([]); // State for filtered exercises
  const [searchQuery, setSearchQuery] = useState(''); // State for search input

  // Fetch exercises when the component mounts
  useEffect(() => {
    const getExercises = async () => {
      try {
        const data = await fetchExercises();
        setExercises(data);
        setFilteredExercises(data); // Initialize filtered exercises
      } catch (error) {
        console.error('Failed to load exercises:', error);
      }
    };
    getExercises();
  }, []);

  const handleSearch = async (query) => {
    setSearchQuery(query);
  
    if (query) {
      try {
        const response = await axios.get(`${BASE_URL}?search=${query}`);
        setFilteredExercises(response.data); // Mettez à jour avec les exercices filtrés de l'API
      } catch (error) {
        console.error('Error fetching exercises:', error);
      }
    } else {
      setFilteredExercises(exercises); // Réinitialiser à tous les exercices si la requête est vide
    }
  };
  

  // Render each exercise item
  const renderExerciseItem = ({ item }) => (
    <TouchableOpacity style={styles.exerciseItem}>
      <Text style={styles.exerciseName}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Workout</Text>
      <TextInput
        style={styles.searchInput}
        placeholder="Search exercises..."
        value={searchQuery}
        onChangeText={handleSearch}
      />
      <FlatList
        data={filteredExercises}
        renderItem={renderExerciseItem}
        keyExtractor={item => item.id} // Use a unique key for each item
      />
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  searchInput: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  exerciseItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  exerciseName: {
    fontSize: 18,
  },
});

export default AddWorkoutScreen;

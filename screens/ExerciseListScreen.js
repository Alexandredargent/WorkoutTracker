import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { fetchExercises } from '../services/firebaseexerciseService';

const ExerciseListScreen = ({ navigation }) => {
  const [exercises, setExercises] = useState([]);
  const [filter, setFilter] = useState('all'); // État pour le filtre

  useEffect(() => {
    const loadExercises = async () => {
      try {
        const exercisesData = await fetchExercises();
        setExercises(exercisesData);
      } catch (error) {
        console.error('Erreur lors de la récupération des exercices:', error);
      }
    };

    loadExercises();
  }, []);

  // Fonction pour filtrer les exercices
  const getFilteredExercises = () => {
    if (filter === 'popular') {
      return exercises.filter(exercise => exercise.isPopular); // Assure-toi d'avoir un champ isPopular
    } else if (filter === 'recent') {
      return exercises.sort((a, b) => new Date(b.date) - new Date(a.date)); // Filtre basé sur la date
    }
    return exercises; // Par défaut, retourne tous les exercices
  };

  const renderExerciseItem = ({ item }) => (
    <TouchableOpacity style={styles.item} onPress={() => navigation.navigate('AddWorkoutScreen', { exercise: item })}>
      <Text style={styles.itemText}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select an Exercise</Text>

      <View style={styles.tabs}>
        <TouchableOpacity onPress={() => setFilter('all')} style={[styles.tab, filter === 'all' && styles.activeTab]}>
          <Text style={styles.tabText}>All Exercises</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setFilter('popular')} style={[styles.tab, filter === 'popular' && styles.activeTab]}>
          <Text style={styles.tabText}>Popular</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setFilter('recent')} style={[styles.tab, filter === 'recent' && styles.activeTab]}>
          <Text style={styles.tabText}>Recent</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={getFilteredExercises()} // Utiliser la fonction pour filtrer les exercices
        keyExtractor={(item) => item.id} // Assure-toi que chaque exercice a un identifiant unique
        renderItem={renderExerciseItem}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F4F6F9',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  tabs: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  tab: {
    padding: 10,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#232799',
  },
  tabText: {
    fontSize: 16,
  },
  item: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  itemText: {
    fontSize: 18,
  },
});

export default ExerciseListScreen;

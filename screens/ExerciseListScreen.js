import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, ActivityIndicator, TextInput } from 'react-native';
import { fetchExercises } from '../services/firebaseExerciseService';
import { addExerciseToDiary } from '../services/diaryService';
import { auth } from '../services/firebase';
import { Ionicons } from '@expo/vector-icons';

const ExerciseListScreen = ({ navigation, route }) => {
  const [exercises, setExercises] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { date } = route.params;

  const loadExercises = async (startAfterDoc = null) => {
    try {
      if (startAfterDoc) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      const { exerciseList, lastDoc } = await fetchExercises(15, startAfterDoc);
      setExercises(prevExercises => {
        const newExercises = exerciseList.filter(exercise => !prevExercises.some(e => e.id === exercise.id));
        return [...prevExercises, ...newExercises];
      });
      setLastDoc(lastDoc);
    } catch (error) {
      console.error('Error fetching exercises:', error);
    } finally {
      if (startAfterDoc) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadExercises();
  }, []);

  const getFilteredExercises = useCallback(() => {
    let filteredExercises = exercises;

    if (filter === 'popular') {
      filteredExercises = filteredExercises.filter(exercise => exercise.isPopular);
    } else if (filter === 'recent') {
      filteredExercises = filteredExercises.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    if (searchQuery) {
      filteredExercises = filteredExercises.filter(exercise =>
        exercise["Name"].toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filteredExercises;
  }, [exercises, filter, searchQuery]);

  const handleAddExercise = async (exercise) => {
    const user = auth.currentUser;
    if (user) {
      try {
        await addExerciseToDiary(user.uid, date, exercise);
        console.log('Exercise added successfully');
        navigation.goBack();
      } catch (error) {
        console.error('Error adding exercise:', error);
      }
    } else {
      console.log('No user is signed in.');
    }
  };

  const renderExerciseItem = ({ item }) => {
    let exerciseIcon;
    if (item["Primary Exercise Classification"] === "Bodybuilding") {
      exerciseIcon = <Ionicons name="barbell-outline" size={24} color="#232799" style={styles.itemIcon} />;
    } else if (item["Primary Exercise Classification"] === "Calisthenics") {
      exerciseIcon = <Ionicons name="body-outline" size={24} color="#232799" style={styles.itemIcon} />;
    } else {
      exerciseIcon = <Ionicons name="fitness-outline" size={24} color="#232799" style={styles.itemIcon} />;
    }
  
    return (
      <TouchableOpacity
        style={styles.item}
        onPress={() => handleAddExercise(item)}
      >
        <View style={styles.itemContent}>
          {exerciseIcon}
          <View style={styles.itemTextContainer}>
            <Text style={styles.itemText}>{item["Name"]}</Text>
            {item["Difficulty Level"] && <Text style={styles.difficultyTag}>{item["Difficulty Level"]}</Text>}
          </View>
        </View>
        <Ionicons name="add-circle-outline" size={24} color="#232799" />
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#232799" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.tabs}>
        {renderTabButton('all', 'All Exercises')}
        {renderTabButton('popular', 'Popular')}
        {renderTabButton('recent', 'Recent')}
      </View>

      <TextInput
        style={styles.searchBar}
        placeholder="Search exercises..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <FlatList
        data={getFilteredExercises()}
        keyExtractor={(item) => item.id}
        renderItem={renderExerciseItem}
        contentContainerStyle={styles.listContent}
        onEndReached={() => loadExercises(lastDoc)}
        onEndReachedThreshold={0.5}
        ListFooterComponent={loadingMore && <ActivityIndicator size="small" color="#232799" />}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6F9',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F4F6F9',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 20,
    marginHorizontal: 20,
    color: '#232799',
  },
  tabs: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    margin: 20,
    padding: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 20,
  },
  activeTab: {
    backgroundColor: '#232799',
  },
  tabText: {
    fontSize: 16,
    color: '#232799',
  },
  activeTabText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  searchBar: {
    height: 40,
    borderColor: '#232799',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 15,
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: 20,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
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
    marginRight: 15,
  },
  itemTextContainer: {
    flex: 1,
  },
  itemText: {
    fontSize: 18,
    color: '#333',
  },
  difficultyTag: {
    fontSize: 12,
    color: '#232799',
    fontWeight: 'bold',
    marginTop: 4,
  },
});

export default ExerciseListScreen;
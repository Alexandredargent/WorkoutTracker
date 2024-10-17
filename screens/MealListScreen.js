import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, ActivityIndicator } from 'react-native';
import { fetchMeals } from '../services/firebaseMealService.js';
import { addMealToDiary } from '../services/diaryService';
import { auth } from '../services/firebase';
import { Ionicons } from '@expo/vector-icons';

const MealListScreen = ({ navigation, route }) => {
  const [meals, setMeals] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const { date } = route.params;

  useEffect(() => {
    const loadMeals = async () => {
      try {
        setLoading(true);
        const mealsData = await fetchMeals();
        setMeals(mealsData);
      } catch (error) {
        console.error('Error fetching meals:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMeals();
  }, []);

  const getFilteredMeals = useCallback(() => {
    if (filter === 'popular') {
      return meals.filter(meal => meal.isPopular);
    } else if (filter === 'recent') {
      return [...meals].sort((a, b) => new Date(b.date) - new Date(a.date));
    }
    return meals;
  }, [meals, filter]);

  const handleAddMeal = async (meal) => {
    const user = auth.currentUser;
    if (user) {
      try {
        await addMealToDiary(user.uid, date, meal);
        console.log('Meal added successfully');
        navigation.goBack();
      } catch (error) {
        console.error('Error adding meal:', error);
      }
    } else {
      console.log('No user is signed in.');
    }
  };

  const renderMealItem = ({ item }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => handleAddMeal(item)}
    >
      <View style={styles.itemContent}>
        <Ionicons name="restaurant-outline" size={24} color="#232799" style={styles.itemIcon} />
        <View style={styles.itemTextContainer}>
          <Text style={styles.itemText}>{item.name}</Text>
          <Text style={styles.caloriesText}>{item.calories} calories</Text>
          <Text style={styles.caloriesText}>{item.carbs} carbs</Text>
          <Text style={styles.caloriesText}>{item.lipids} lipids</Text>
          <Text style={styles.caloriesText}>{item.proteins} proteins</Text>
          {item.isPopular && <Text style={styles.popularTag}>Popular</Text>}
        </View>
      </View>
      <Ionicons name="add-circle-outline" size={24} color="#232799" />
    </TouchableOpacity>
  );
  
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
        {renderTabButton('all', 'All Meals')}
        {renderTabButton('popular', 'Popular')}
        {renderTabButton('recent', 'Recent')}
      </View>

      <FlatList
        data={getFilteredMeals()}
        keyExtractor={(item) => item.id}
        renderItem={renderMealItem}
        contentContainerStyle={styles.listContent}
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
  caloriesText: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  popularTag: {
    fontSize: 12,
    color: '#232799',
    fontWeight: 'bold',
    marginTop: 4,
  },
});

export default MealListScreen;

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, SafeAreaView, StatusBar, ActivityIndicator, StyleSheet } from 'react-native';
import { fetchMeals } from '../services/firebaseMealService.js';
import { addMealToDiary } from '../services/diaryService';
import { auth } from '../services/firebase';
import { Ionicons } from '@expo/vector-icons';
import theme from '../styles/theme';

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
        <Ionicons name="restaurant-outline" size={24} color={theme.colors.primary} style={styles.itemIcon} />
        <View style={styles.itemTextContainer}>
          <Text style={styles.itemText}>{item.name}</Text>
          <Text style={styles.caloriesText}>{item.calories} calories</Text>
          <Text style={styles.caloriesText}>{item.carbs} carbs</Text>
          <Text style={styles.caloriesText}>{item.lipids} lipids</Text>
          <Text style={styles.caloriesText}>{item.proteins} proteins</Text>
          {item.isPopular && <Text style={styles.popularTag}>Popular</Text>}
        </View>
      </View>
      <Ionicons name="add-circle-outline" size={24} color={theme.colors.primary} />
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
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <TouchableOpacity
        style={styles.scanButton}
        onPress={() => navigation.navigate('BarcodeScannerScreen', { date })}
      >
        <Ionicons name="scan-outline" size={24} color="white" />
        <Text style={styles.scanButtonText}>Scan</Text>
      </TouchableOpacity>

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
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  tabs: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.card,
    borderRadius: 25,
    margin: theme.spacing.lg,
    padding: theme.spacing.xs,
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
  listContent: {
    paddingHorizontal: theme.spacing.lg,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.card,
    borderRadius: 10,
    marginBottom: theme.spacing.sm,
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
    marginRight: theme.spacing.md,
  },
  itemTextContainer: {
    flex: 1,
  },
  itemText: {
    fontSize: 18,
    color: theme.colors.text,
  },
  caloriesText: {
    fontSize: 14,
    color: theme.colors.muted,
    marginTop: 2,
  },
  popularTag: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: 'bold',
    marginTop: 4,
  },
  scanButton: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: 25,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
    marginTop: theme.spacing.md,
  },
  scanButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default MealListScreen;

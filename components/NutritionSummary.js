import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import theme from '../styles/theme';

const NutritionSummary = ({
  totalCalories,
  calorieGoal,
  totalProteins,
  proteinGoal,
  totalCarbs,
  carbGoal,
  totalLipids,
  lipidGoal,
  getPercent,
}) => (
  <View style={styles.nutritionSummaryCard}>
    <Text style={styles.nutritionSummaryTitle}>Daily Total</Text>

    <View style={styles.nutritionSummaryRow}>
      <Text style={styles.nutritionSummaryLabel}>Calories :</Text>
      <Text style={styles.nutritionSummaryValue}>
        {totalCalories.toFixed(1)} / {calorieGoal.toFixed(1)} kcal
      </Text>
    </View>
    <View style={styles.progressBarBackground}>
      <View
        style={[
          styles.progressBarFill,
          {
            width: `${getPercent(totalCalories, calorieGoal).toFixed(1)}%`,
            backgroundColor: theme.colors.accent,
          },
        ]}
      />
    </View>

    <View style={styles.nutritionSummaryRow}>
      <Text style={styles.nutritionSummaryLabel}>Proteins :</Text>
      <Text style={styles.nutritionSummaryValue}>
        {totalProteins.toFixed(1)} / {proteinGoal.toFixed(1)} g
      </Text>
    </View>
    <View style={styles.progressBarBackground}>
      <View
        style={[
          styles.progressBarFill,
          {
            width: `${getPercent(totalProteins, proteinGoal).toFixed(1)}%`,
            backgroundColor: theme.colors.secondary || '#4CAF50',
          },
        ]}
      />
    </View>

    <View style={styles.nutritionSummaryRow}>
      <Text style={styles.nutritionSummaryLabel}>Carbs :</Text>
      <Text style={styles.nutritionSummaryValue}>
        {totalCarbs.toFixed(1)} / {carbGoal.toFixed(1)} g
      </Text>
    </View>
    <View style={styles.progressBarBackground}>
      <View
        style={[
          styles.progressBarFill,
          {
            width: `${getPercent(totalCarbs, carbGoal).toFixed(1)}%`,
            backgroundColor: '#2196F3',
          },
        ]}
      />
    </View>

    <View style={styles.nutritionSummaryRow}>
      <Text style={styles.nutritionSummaryLabel}>Lipids :</Text>
      <Text style={styles.nutritionSummaryValue}>
        {totalLipids.toFixed(1)} / {lipidGoal.toFixed(1)} g
      </Text>
    </View>
    <View style={styles.progressBarBackground}>
      <View
        style={[
          styles.progressBarFill,
          {
            width: `${getPercent(totalLipids, lipidGoal).toFixed(1)}%`,
            backgroundColor: theme.colors.error,
          },
        ]}
      />
    </View>
  </View>
);

const styles = StyleSheet.create({
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
});

// Toggle favorite status for a meal
export const toggleFavoriteMeal = async (userId, mealId, isFavorite) => {
  try {
    const favoriteDoc = doc(db, 'users', userId, 'favorites', 'meals', 'items', mealId);
    
    if (isFavorite) {
      // Add to favorites
      await setDoc(favoriteDoc, {
        mealId: mealId,
        addedAt: new Date().toISOString(),
      });
    } else {
      // Remove from favorites
      await deleteDoc(favoriteDoc);
    }
  } catch (error) {
    console.error('Error toggling favorite meal:', error);
    throw error;
  }
};

// Fetch user's favorite meals
export const fetchFavoriteMeals = async (userId) => {
  try {
    const favoritesCollection = collection(db, 'users', userId, 'favorites', 'meals', 'items');
    const favoritesSnapshot = await getDocs(favoritesCollection);
    
    const favoriteMealIds = favoritesSnapshot.docs.map(doc => doc.id);
    
    if (favoriteMealIds.length === 0) {
      return [];
    }

    // Fetch the actual meal data from both global and user meals
    const globalMealsSnapshot = await getDocs(collection(db, 'meals'));
    const userMealsSnapshot = await getDocs(collection(db, 'users', userId, 'meals'));
    
    const allMeals = [
      ...globalMealsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
      ...userMealsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), isUserCreated: true }))
    ];

    const favoriteMeals = allMeals.filter(meal => 
      favoriteMealIds.includes(meal.id)
    );

    return favoriteMeals;
  } catch (error) {
    console.error('Error fetching favorite meals:', error);
    throw error;
  }
};

// Check if a meal is favorited
export const isMealFavorited = async (userId, mealId) => {
  try {
    const favoriteDoc = doc(db, 'users', userId, 'favorites', 'meals', 'items', mealId);
    const favoriteSnapshot = await getDoc(favoriteDoc);
    return favoriteSnapshot.exists();
  } catch (error) {
    console.error('Error checking if meal is favorited:', error);
    return false;
  }
};

export default NutritionSummary;

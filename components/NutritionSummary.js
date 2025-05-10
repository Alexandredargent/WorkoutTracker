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
      <Text style={styles.nutritionSummaryValue}>{totalCalories} / {calorieGoal} kcal</Text>
    </View>
    <View style={styles.progressBarBackground}>
      <View style={[styles.progressBarFill, { width: `${getPercent(totalCalories, calorieGoal)}%`, backgroundColor: theme.colors.accent }]} />
    </View>
    <View style={styles.nutritionSummaryRow}>
      <Text style={styles.nutritionSummaryLabel}>Proteins :</Text>
      <Text style={styles.nutritionSummaryValue}>{totalProteins} / {proteinGoal} g</Text>
    </View>
    <View style={styles.progressBarBackground}>
      <View style={[styles.progressBarFill, { width: `${getPercent(totalProteins, proteinGoal)}%`, backgroundColor: theme.colors.secondary || '#4CAF50' }]} />
    </View>
    <View style={styles.nutritionSummaryRow}>
      <Text style={styles.nutritionSummaryLabel}>Carbs :</Text>
      <Text style={styles.nutritionSummaryValue}>{totalCarbs} / {carbGoal} g</Text>
    </View>
    <View style={styles.progressBarBackground}>
      <View style={[styles.progressBarFill, { width: `${getPercent(totalCarbs, carbGoal)}%`, backgroundColor: '#2196F3' }]} />
    </View>
    <View style={styles.nutritionSummaryRow}>
      <Text style={styles.nutritionSummaryLabel}>Lipids :</Text>
      <Text style={styles.nutritionSummaryValue}>{totalLipids} / {lipidGoal} g</Text>
    </View>
    <View style={styles.progressBarBackground}>
      <View style={[styles.progressBarFill, { width: `${getPercent(totalLipids, lipidGoal)}%`, backgroundColor: theme.colors.error }]} />
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

export default NutritionSummary;
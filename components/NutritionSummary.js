import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

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
      <View style={[styles.progressBarFill, { width: `${getPercent(totalCalories, calorieGoal)}%`, backgroundColor: '#FF9800' }]} />
    </View>
    <View style={styles.nutritionSummaryRow}>
      <Text style={styles.nutritionSummaryLabel}>Proteins :</Text>
      <Text style={styles.nutritionSummaryValue}>{totalProteins} / {proteinGoal} g</Text>
    </View>
    <View style={styles.progressBarBackground}>
      <View style={[styles.progressBarFill, { width: `${getPercent(totalProteins, proteinGoal)}%`, backgroundColor: '#4CAF50' }]} />
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
      <View style={[styles.progressBarFill, { width: `${getPercent(totalLipids, lipidGoal)}%`, backgroundColor: '#E91E63' }]} />
    </View>
  </View>
);

const styles = StyleSheet.create({
  nutritionSummaryCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 0,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  nutritionSummaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#232799',
    marginBottom: 8,
    textAlign: 'center',
  },
  nutritionSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 2,
  },
  nutritionSummaryLabel: {
    fontSize: 16,
    color: '#333',
  },
  nutritionSummaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#232799',
  },
  progressBarBackground: {
    width: '100%',
    height: 10,
    backgroundColor: '#eee',
    borderRadius: 5,
    marginBottom: 8,
    marginTop: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
  },
});

export default NutritionSummary;
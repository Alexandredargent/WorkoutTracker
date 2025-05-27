import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ImageBackground, ActivityIndicator } from 'react-native';
import { auth, db } from '../services/firebase';
import { doc, getDoc } from 'firebase/firestore';

import {
  calculateCalorieTarget,
  getProteinGoal,
  getLipidGoal,
  getCarbGoal
} from '../utils/nutrition';

import { useFocusEffect } from '@react-navigation/native';
import NutritionSummary from '../components/NutritionSummary';
import { calculateAge } from '../utils/date';
import theme from '../styles/theme';

const HomeScreen = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [calorieTarget, setCalorieTarget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState([]);

  const getGoalLabel = (goal) => {
    switch (goal) {
      case 'gain_weight': return 'Gain Weight';
      case 'lose_weight': return 'Lose Weight';
      case 'maintain_weight': return 'Maintain Weight';
      default: return '';
    }
  };

  const getActivityLabel = (level) => {
    switch (level) {
      case 'sedentary': return 'Sedentary (×1.2)';
      case 'light': return 'Light (×1.375)';
      case 'moderate': return 'Moderate (×1.55)';
      case 'intense': return 'Intense (×1.725)';
      case 'very_intense': return 'Very Intense (×1.9)';
      default: return 'Unknown';
    }
  };

  useFocusEffect(
    useCallback(() => {
      const fetchAll = async () => {
        setLoading(true);
        try {
          const user = auth.currentUser;
          if (!user) return;

          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            setUserInfo(data);

            const target = calculateCalorieTarget({
              age: calculateAge(data.dateOfBirth),
              height: data.height,
              weight: data.weight,
              gender: data.gender,
              goal: data.goal,
              activityLevel: data.activityLevel
            });

            setCalorieTarget(target);
          }
        } catch (err) {
          console.error('Error fetching data:', err);
        } finally {
          setLoading(false);
        }
      };

      fetchAll();
    }, [])
  );

  const weightEntry = entries.find(entry => entry.weight !== undefined);
  const currentWeight = weightEntry?.weight ?? userInfo?.weight ?? 0;

  const proteinGoal = getProteinGoal(currentWeight);
  const lipidGoal = getLipidGoal(currentWeight);
  const calorieGoal = userInfo
    ? calculateCalorieTarget({ ...userInfo, age: calculateAge(userInfo.dateOfBirth), weight: currentWeight })
    : 0;
  const carbGoal = getCarbGoal(calorieGoal, proteinGoal, lipidGoal);

  const mealEntries = entries.filter(entry => entry.mealName);
  const totalCalories = mealEntries.reduce((sum, m) => sum + ((+m.calories || 0) * (m.quantity || 100) / 100), 0);
  const totalProteins = mealEntries.reduce((sum, m) => sum + ((+m.proteins || 0) * (m.quantity || 100) / 100), 0);
  const totalCarbs = mealEntries.reduce((sum, m) => sum + ((+m.carbs || 0) * (m.quantity || 100) / 100), 0);
  const totalLipids = mealEntries.reduce((sum, m) => sum + ((+m.lipids || 0) * (m.quantity || 100) / 100), 0);

  const getPercent = (value, goal) => goal ? Math.min(100, (value / goal) * 100) : 0;

  <ImageBackground
  source={theme.backgroundImage.source}
  resizeMode={theme.backgroundImage.defaultResizeMode}
  style={styles.background}
>
  <View style={styles.contentWrapper}>
    {loading && (
      <ActivityIndicator
        size="small"
        color={theme.colors.primary}
        style={{ marginBottom: 10 }}
      />
    )}

    <Text style={styles.welcomeText}>Hello, ready for today's progress?</Text>
    {userInfo && (
      <>
        <Text style={styles.goalText}>🎯 Goal: {getGoalLabel(userInfo.goal)}</Text>
        <Text style={styles.goalText}>⚡ Activity: {getActivityLabel(userInfo.activityLevel)}</Text>
      </>
    )}

    <NutritionSummary
      totalCalories={totalCalories}
      calorieGoal={calorieGoal}
      totalProteins={totalProteins}
      proteinGoal={proteinGoal}
      totalCarbs={totalCarbs}
      carbGoal={carbGoal}
      totalLipids={totalLipids}
      lipidGoal={lipidGoal}
      getPercent={getPercent}
    />
  </View>
</ImageBackground>


  return (
    <ImageBackground
      source={theme.backgroundImage.source}
      resizeMode={theme.backgroundImage.defaultResizeMode}
      style={styles.background}
    >
      <View style={styles.contentWrapper}>
        {/* <Image source={require('../assets/Applogo.png')} style={styles.logo} /> */}
        <Text style={styles.welcomeText}>Hello, ready for today's progress?</Text>
        {userInfo && (
          <>
            <Text style={styles.goalText}>🎯 Goal: {getGoalLabel(userInfo.goal)}</Text>
            <Text style={styles.goalText}>⚡ Activity: {getActivityLabel(userInfo.activityLevel)}</Text>
          </>
        )}
        <NutritionSummary
          totalCalories={totalCalories}
          calorieGoal={calorieGoal}
          totalProteins={totalProteins}
          proteinGoal={proteinGoal}
          totalCarbs={totalCarbs}
          carbGoal={carbGoal}
          totalLipids={totalLipids}
          lipidGoal={lipidGoal}
          getPercent={getPercent}
        />
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  contentWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.26)',
  },
  logo: {
    width: 200,
    height: 200,
    marginBottom: theme.spacing.lg,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  goalText: {
    fontSize: 16,
    marginTop: 6,
    color: theme.colors.primary,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default HomeScreen;

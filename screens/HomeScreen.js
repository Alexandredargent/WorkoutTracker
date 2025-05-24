import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { auth, db } from '../services/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import {
  getActivityFactor,
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

  // --- STEPS LOGIC (commented out) ---
  // import { Pedometer } from 'expo-sensors';
  // const [stepCount, setStepCount] = useState(0);
  // --- END STEPS LOGIC ---

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
      let isMounted = true;
      let subscription;

      const fetchAll = async () => {
        setLoading(true);
        try {
          // Fetch user info
          const user = auth.currentUser;
          if (!user) return;

          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            setUserInfo(data);

            const target = calculateCalorieTarget({
              age: calculateAge(data.dateOfBirth), // ✅ USE CALCULATED AGE
              height: data.height,
              weight: data.weight,
              gender: data.gender,
              goal: data.goal,
              activityLevel: data.activityLevel
            });

            setCalorieTarget(target);
          }
          /*
          // Fetch today's diary entries
          const today = new Date();
          const yyyy = today.getFullYear();
          const mm = String(today.getMonth() + 1).padStart(2, '0');
          const dd = String(today.getDate()).padStart(2, '0');
          const todayStr = `${yyyy}-${mm}-${dd}`;
          const q = query(
            collection(db, 'diaryEntries'),
            where('userId', '==', user.uid),
            where('date', '==', todayStr)
          );
          const snapshot = await getDocs(q);
          setEntries(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

          // --- STEPS LOGIC (commented out) ---
          // Fetch today's steps
          const end = new Date();
          const start = new Date();
          start.setHours(0, 0, 0, 0);
          try {
            const result = await Pedometer.getStepCountAsync(start, end);
            if (isMounted) setStepCount(result.steps);
          } catch (e) {
            if (isMounted) setStepCount(0);
          }

          // Live step updates while focused
          Pedometer.isAvailableAsync().then((result) => {
            if (result) {
              subscription = Pedometer.watchStepCount(() => {
                fetchAll(); // re-fetch everything on new step
              });
            }
          });
          // --- END STEPS LOGIC ---
            */
        } catch (err) {
          console.error('Error fetching data:', err);
        } finally {
          setLoading(false);
        }
      };

      fetchAll();

      return () => {
        isMounted = false;
        if (subscription) subscription.remove();
      };
    }, [])
  );

  // Find weight entry for the day
  const weightEntry = entries.find(entry => entry.weight !== undefined);
  const currentWeight = weightEntry && weightEntry.weight ? weightEntry.weight : (userInfo ? userInfo.weight : 0);

  const proteinGoal = getProteinGoal(currentWeight);
  const lipidGoal = getLipidGoal(currentWeight);
  const calorieGoal = userInfo
    ? calculateCalorieTarget({
        ...userInfo,
        age: calculateAge(userInfo.dateOfBirth), // <-- use calculated age!
        weight: currentWeight,
      })
    : 0;
  const carbGoal = getCarbGoal(calorieGoal, proteinGoal, lipidGoal);

  const mealEntries = entries.filter(entry => entry.mealName);
  const totalCalories = mealEntries.reduce((sum, m) => sum + ((Number(m.calories) || 0) * (m.quantity || 100) / 100), 0);
  const totalProteins = mealEntries.reduce((sum, m) => sum + ((Number(m.proteins) || 0) * (m.quantity || 100) / 100), 0);
  const totalCarbs = mealEntries.reduce((sum, m) => sum + ((Number(m.carbs) || 0) * (m.quantity || 100) / 100), 0);
  const totalLipids = mealEntries.reduce((sum, m) => sum + ((Number(m.lipids) || 0) * (m.quantity || 100) / 100), 0);

  const getPercent = (value, goal) => goal ? Math.min(100, (value / goal) * 100) : 0;

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#232799" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image source={require('../assets/Applogo.png')} style={styles.logo} />
      <Text style={styles.welcomeText}>Welcome to Workout Tracker!</Text>
      {userInfo && (
        <>
          <Text style={styles.goalText}>🎯 Goal: {getGoalLabel(userInfo.goal)}</Text>
          <Text style={styles.goalText}>⚡ Activity Level: {getActivityLabel(userInfo.activityLevel)}</Text>
          {/*
          <Text style={styles.goalText}>👣 Steps Today: {stepCount}</Text>
          */}
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
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
  },
  goalText: {
    fontSize: 18,
    marginTop: 10,
    color: theme.colors.primary,
    fontWeight: '600',
  },
});

export default HomeScreen;

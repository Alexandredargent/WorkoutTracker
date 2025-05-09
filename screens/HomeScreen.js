import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { auth, db } from '../services/firebase';
import { doc, getDoc } from 'firebase/firestore';

const HomeScreen = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [calorieTarget, setCalorieTarget] = useState(null);
  const [loading, setLoading] = useState(true);

  const getGoalLabel = (goal) => {
    switch (goal) {
      case 'gain_weight': return 'Gain Weight';
      case 'lose_weight': return 'Lose Weight';
      case 'maintain_weight': return 'Maintain Weight';
      default: return '';
    }
  };

  const getActivityFactor = (level) => {
    switch (level) {
      case 'sedentary': return 1.2;
      case 'light': return 1.375;
      case 'moderate': return 1.55;
      case 'intense': return 1.725;
      case 'very_intense': return 1.9;
      default: return 1.2;
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

  const calculateCalorieTarget = ({ age, height, weight, gender, goal, activityLevel }) => {
    let bmr;

    // Mifflin-St Jeor Formula
    if (gender === 'male') {
      bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
    } else {
      bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161;
    }

    const activityFactor = getActivityFactor(activityLevel);
    let calories = bmr * activityFactor;

    if (goal === 'gain_weight') {
      calories += 300;
    } else if (goal === 'lose_weight') {
      calories -= 300;
    }

    return Math.round(calories);
  };

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserInfo(data);

          const target = calculateCalorieTarget({
            age: data.age,
            height: data.height,
            weight: data.weight,
            gender: data.gender,
            goal: data.goal,
            activityLevel: data.activityLevel
          });

          setCalorieTarget(target);
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, []);

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
          <Text style={styles.goalText}>🔥 Daily Calorie Target: {calorieTarget} kcal</Text>
          <Text style={styles.goalText}>⚡ Activity Level: {getActivityLabel(userInfo.activityLevel)}</Text>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f4f4f4',
  },
  logo: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  goalText: {
    fontSize: 18,
    marginTop: 10,
    color: '#232799',
    fontWeight: '600',
  },
});

export default HomeScreen;

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, ActivityIndicator } from 'react-native';
import { fetchStatistics } from '../services/firebaseStatisticsService';
import { auth } from '../services/firebase';

const StatisticsScreen = () => {
  const [totalWorkouts, setTotalWorkouts] = useState(0);
  const [mostFrequentExercises, setMostFrequentExercises] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const user = auth.currentUser;
      if (user) {
        try {
          const stats = await fetchStatistics(user.uid);
          setTotalWorkouts(stats.totalWorkouts);
          setMostFrequentExercises(stats.mostFrequentExercises);
        } catch (error) {
          console.error('Error fetching statistics:', error);
        }
      } else {
        console.log('No user is signed in.');
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#232799" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Statistics</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Total Workouts</Text>
        <Text style={styles.totalWorkouts}>{totalWorkouts}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Most Frequent Exercises</Text>
        {mostFrequentExercises.map((exercise, index) => (
          <Text key={index} style={styles.exercise}>
            {exercise.name}: {exercise.count} times
          </Text>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f4f4',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  totalWorkouts: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#232799',
    textAlign: 'center',
  },
  exercise: {
    fontSize: 16,
    marginBottom: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default StatisticsScreen;
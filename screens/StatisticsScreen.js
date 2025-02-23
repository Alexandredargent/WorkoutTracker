import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, ActivityIndicator } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useFocusEffect } from '@react-navigation/native';
import { fetchStatistics, fetchWeightHistory } from '../services/firebaseStatisticsService';
import { auth } from '../services/firebase';

const StatisticsScreen = () => {
  const [totalWorkouts, setTotalWorkouts] = useState(0);
  const [mostFrequentExercises, setMostFrequentExercises] = useState([]);
  const [weightHistory, setWeightHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    const user = auth.currentUser;
    if (user) {
      try {
        const stats = await fetchStatistics(user.uid);
        setTotalWorkouts(stats.totalWorkouts);
        setMostFrequentExercises(stats.mostFrequentExercises);

        const weightData = await fetchWeightHistory(user.uid);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Filter future dates and sort chronologically
        const formattedWeightData = weightData
          .filter(entry => {
            const entryDate = new Date(entry.date);
            entryDate.setHours(0, 0, 0, 0); // Normalize to midnight
            return entryDate <= today; // Include dates up to today
          })
          .map(entry => ({
            date: new Date(entry.date).toISOString().split('T')[0], // Format date as string (YYYY-MM-DD)
            weight: Number(entry.weight), // Ensure weight is a number
          }))
          .sort((a, b) => new Date(a.date) - new Date(b.date)); // Sort ascending by date

        setWeightHistory(formattedWeightData);
      } catch (error) {
        console.error('Error fetching statistics:', error);
      }
    } else {
      console.log('No user is signed in.');
    }
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#232799" />
      </View>
    );
  }

  const weightDates = weightHistory.map(entry => entry.date);
  const weightValues = weightHistory.map(entry => entry.weight);

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

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Weight Evolution</Text>
        {weightHistory.length > 0 ? (
          <ScrollView horizontal>
            <LineChart
              data={{
                labels: weightDates,
                datasets: [
                  {
                    data: weightValues,
                  },
                ],
              }}
              width={Math.max(Dimensions.get('window').width, weightDates.length * 50)} // Adjust width based on data length
              height={220}
              yAxisLabel=""
              yAxisSuffix="kg"
              chartConfig={{
                backgroundColor: '#e26a00',
                backgroundGradientFrom: '#fb8c00',
                backgroundGradientTo: '#ffa726',
                decimalPlaces: 2, // optional, defaults to 2dp
                color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                style: {
                  borderRadius: 16,
                },
                propsForDots: {
                  r: '6',
                  strokeWidth: '2',
                  stroke: '#ffa726',
                },
              }}
              bezier
              style={{
                marginVertical: 8,
                borderRadius: 16,
              }}
            />
          </ScrollView>
        ) : (
          <Text>No weight history available</Text>
        )}
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
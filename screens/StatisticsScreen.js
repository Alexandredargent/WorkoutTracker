import React, { useState, useCallback } from 'react';
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

        // Filter out future dates and sort chronologically
        const formattedWeightData = weightData
          .filter(entry => {
            const entryDate = new Date(entry.date);
            entryDate.setHours(0, 0, 0, 0);
            return entryDate <= today;
          })
          .map(entry => ({
            date: new Date(entry.date).toISOString().split('T')[0],
            weight: Number(entry.weight),
          }))
          .sort((a, b) => new Date(a.date) - new Date(b.date));

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

  // Prepare monthly data for the past 6 months (including the current month)
  const currentDate = new Date();
  const monthlyLabels = [];
  const monthlyData = [];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  let lastValue = null;

  // Loop through the past 6 months (oldest to most recent)
  for (let i = 0; i < 6; i++) {
    // Calculate the date for each month starting 5 months ago until the current month
    const d = new Date(currentDate.getFullYear(), currentDate.getMonth() - (5 - i), 1);
    const monthLabel = months[d.getMonth()];
    monthlyLabels.push(monthLabel);

    // Filter weightHistory entries for the same month and year
    const weightsForMonth = weightHistory.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate.getFullYear() === d.getFullYear() && entryDate.getMonth() === d.getMonth();
    }).map(entry => entry.weight);

    if (weightsForMonth.length > 0) {
      const value = weightsForMonth[weightsForMonth.length - 1];
      monthlyData.push(value);
      lastValue = value;
    } else {
      // Use the last known value or default to 0 if no previous data exists
      monthlyData.push(lastValue !== null ? lastValue : 0);
    }
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
            {exercise.Name}: {exercise.count} times
          </Text>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Weight Evolution (Past 6 Months)</Text>
        {weightHistory.length > 0 ? (
          <LineChart
            data={{
              labels: monthlyLabels,
              datasets: [
                {
                  data: monthlyData,
                },
              ],
            }}
            width={Dimensions.get('window').width - 40} // Adjust for container padding
            height={220}
            yAxisSuffix="kg"
            chartConfig={{
              backgroundColor: '#e26a00',
              backgroundGradientFrom: '#fb8c00',
              backgroundGradientTo: '#ffa726',
              decimalPlaces: 2,
              color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              style: { borderRadius: 16 },
              propsForDots: {
                r: '6',
                strokeWidth: '2',
                stroke: '#ffa726',
              },
            }}
            bezier
            style={{ marginVertical: 8, borderRadius: 16 }}
          />
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

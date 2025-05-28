import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, ActivityIndicator, TouchableOpacity } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useFocusEffect } from '@react-navigation/native';
import { fetchStatistics, fetchWeightHistory } from '../services/firebaseStatisticsService';
import { auth } from '../services/firebase';
import theme from '../styles/theme';
import { ImageBackground } from 'react-native';


const StatisticsScreen = () => {
  const [totalWorkouts, setTotalWorkouts] = useState(0);
  const [mostFrequentExercises, setMostFrequentExercises] = useState([]);
  const [weightHistory, setWeightHistory] = useState([]);
  const [mostTargetedMuscleGroups, setMostTargetedMuscleGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    const user = auth.currentUser;
    if (user) {
      try {
        const stats = await fetchStatistics(user.uid);
        setTotalWorkouts(stats.totalWorkouts);
        setMostFrequentExercises(stats.mostFrequentExercises);
        setMostTargetedMuscleGroups(stats.mostTargetedMuscleGroups);
        const weightData = await fetchWeightHistory(user.uid);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

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

  {loading && (
  <View style={styles.loadingOverlay}>
    <ActivityIndicator size="large" color="#232799" />
  </View>
)}


  const currentDate = new Date();
  const monthlyLabels = [];
  const monthlyData = [];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  let lastValue = null;

  for (let i = 0; i < 6; i++) {
    const d = new Date(currentDate.getFullYear(), currentDate.getMonth() - (5 - i), 1);
    const monthLabel = months[d.getMonth()];
    monthlyLabels.push(monthLabel);

    const weightsForMonth = weightHistory.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate.getFullYear() === d.getFullYear() && entryDate.getMonth() === d.getMonth();
    }).map(entry => entry.weight);

    if (weightsForMonth.length > 0) {
      const value = weightsForMonth[weightsForMonth.length - 1];
      monthlyData.push(value);
      lastValue = value;
    } else {
      monthlyData.push(lastValue !== null ? lastValue : 0);
    }
  }


  return (
    <ImageBackground
  source={theme.backgroundImage.source}
  resizeMode={theme.backgroundImage.defaultResizeMode}
  style={{ flex: 1 }}
  >
  
    <ScrollView style={styles.container}>
      

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Total Workouts</Text>
        <Text style={styles.totalWorkouts}>{totalWorkouts}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Most Frequent Exercises</Text>
        {mostFrequentExercises.length > 0 ? (
          mostFrequentExercises.map((exercise, index) => (
            <TouchableOpacity
              key={index}
              style={styles.exerciseCard}
              activeOpacity={0.7} // Subtle press effect
            >
              <Text style={styles.exerciseName}>{exercise.name}</Text>
              <Text style={styles.exerciseCount}>{exercise.count} times</Text>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.emptyText}>Keep logging workouts to see your favorites here!</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Most Targeted Muscle Groups</Text>
        {mostTargetedMuscleGroups.length > 0 ? (
          mostTargetedMuscleGroups.map((item, idx) => (
            <View key={idx} style={styles.exerciseCard}>
              <Text style={styles.exerciseName}>{item.group}</Text>
              <Text style={styles.exerciseCount}>{item.count} times</Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No muscle group data yet!</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Weight Evolution (Past 6 Months)</Text>
        {weightHistory.length > 0 ? (
          <LineChart
            data={{
              labels: monthlyLabels,
              datasets: [{ data: monthlyData }],
            }}
            width={Dimensions.get('window').width - 40}
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
              propsForDots: { r: '6', strokeWidth: '2', stroke: '#ffa726' },
            }}
            bezier
            style={{ marginVertical: 8, borderRadius: 16 }}
          />
        ) : (
          <Text>No weight history available</Text>
        )}
      </View>
    </ScrollView>
    </ImageBackground>

  );
};

const styles = StyleSheet.create({
  container: {
  padding: theme.spacing.lg,
  //backgroundColor: 'rgba(255, 255, 255, 0.26)',
},

  title: {
    ...theme.typography.title,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    ...theme.typography.sectionTitle,
  },
  totalWorkouts: {
    fontSize: 48,
    fontWeight: 'bold',
    color: theme.colors.primary,
    textAlign: 'center',
  },
  exerciseCard: {
    ...theme.card,
  },
  exerciseName: {
    ...theme.typography.exerciseName,
  },
  exerciseCount: {
    ...theme.typography.exerciseCount,
  },
  emptyText: {
    ...theme.typography.emptyText,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default StatisticsScreen;
import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, FlatList, Button } from 'react-native';
import { Calendar } from 'react-native-calendars';

const DiaryScreen = ({ navigation }) => {
  const [workouts, setWorkouts] = useState({}); // État pour stocker les entraînements par date
  const [selectedDate, setSelectedDate] = useState('');

  const onDayPress = (day) => {
    setSelectedDate(day.dateString);
    // Vérifier si des entraînements existent pour la date sélectionnée
    if (workouts[day.dateString]) {
      Alert.alert(`Workouts on ${day.dateString}`, JSON.stringify(workouts[day.dateString], null, 2));
    } else {
      Alert.alert('No workouts for this date.');
    }
  };

  const addWorkout = (date, exercise, sets) => {
    setWorkouts((prevWorkouts) => {
      const newWorkouts = { ...prevWorkouts };
      if (!newWorkouts[date]) {
        newWorkouts[date] = [];
      }
      newWorkouts[date].push({ exercise, sets });
      return newWorkouts;
    });
  };

  const getMarkedDates = () => {
    const marked = {};
    for (const date in workouts) {
      marked[date] = {
        dots: workouts[date].map((workout) => ({
          key: workout.exercise, // Assurez-vous que 'exercise' est unique
          color: '#3498db',
        })),
      };
    }
    return marked;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Diary</Text>
      <Calendar
        onDayPress={onDayPress}
        markingType={'multi-dot'}
        markedDates={getMarkedDates()} // Utilisez la fonction pour obtenir les dates marquées
        theme={{
          selectedDayBackgroundColor: '#3498db',
          todayTextColor: '#3498db',
          dayTextColor: '#2d4150',
          monthTextColor: '#2d4150',
          textDayFontFamily: 'monospace',
          textMonthFontFamily: 'monospace',
          textDayFontSize: 16,
          textMonthFontSize: 20,
          textDayHeaderFontSize: 14,
        }}
      />
      <Button
        title="Add Workout for Today"
        onPress={() => navigation.navigate('AddWorkout', { date: selectedDate })}
        disabled={!selectedDate}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});

export default DiaryScreen;

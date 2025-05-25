import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';

export const fetchStatistics = async (userId) => {
  try {
    const q = query(collection(db, 'users', userId, 'diaryEntries'), where('userId', '==', userId), where('type', '==', 'exercise'));
    const snapshot = await getDocs(q);
    const entries = snapshot.docs.map(doc => doc.data());

    const totalWorkouts = entries.length;

    // Most frequent exercises
    const exerciseCounts = {};
    entries.forEach(entry => {
      if (entry.exercise && entry.exercise.Name) {
        if (!exerciseCounts[entry.exercise.Name]) {
          exerciseCounts[entry.exercise.Name] = 0;
        }
        exerciseCounts[entry.exercise.Name]++;
      }
    });

    const mostFrequentExercises = Object.keys(exerciseCounts)
      .map(name => ({ name, count: exerciseCounts[name] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Most targeted muscle groups
    const muscleGroupCounts = {};
    entries.forEach(entry => {
      const group = entry.exercise && entry.exercise["Target Muscle Group"];
      if (group) {
        if (!muscleGroupCounts[group]) {
          muscleGroupCounts[group] = 0;
        }
        muscleGroupCounts[group]++;
      }
    });

    const mostTargetedMuscleGroups = Object.keys(muscleGroupCounts)
      .map(group => ({ group, count: muscleGroupCounts[group] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const weightProgress = entries
      .filter(entry => entry.weight)
      .map(entry => entry.weight);

    return { totalWorkouts, mostFrequentExercises, mostTargetedMuscleGroups, weightProgress };
  } catch (error) {
    console.error('Error fetching statistics:', error);
    throw error;
  }
};

export const fetchWeightHistory = async (userId) => {
  const weightEntries = [];
  const q = query(collection(db, 'users', userId, 'diaryEntries'), where('userId', '==', userId), where('type', '==', 'weight'));
  const querySnapshot = await getDocs(q);
  querySnapshot.forEach((doc) => {
    weightEntries.push({ date: doc.data().date, weight: doc.data().weight });
  });
  return weightEntries.sort((a, b) => new Date(a.date) - new Date(b.date));
};
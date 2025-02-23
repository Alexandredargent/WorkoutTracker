import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';

export const fetchStatistics = async (userId) => {
  try {
    const q = query(collection(db, 'diaryEntries'), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    const entries = snapshot.docs.map(doc => doc.data());

    // Calculate total workouts
    const totalWorkouts = entries.length;

    // Calculate most frequent exercises
    const exerciseCounts = {};
    entries.forEach(entry => {
      if (entry.exerciseName) {
        if (!exerciseCounts[entry.exerciseName]) {
          exerciseCounts[entry.exerciseName] = 0;
        }
        exerciseCounts[entry.exerciseName]++;
      }
    });
    const mostFrequentExercises = Object.keys(exerciseCounts)
      .map(name => ({ name, count: exerciseCounts[name] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Calculate weight progress (assuming weight is logged in the entries)
    const weightProgress = entries
      .filter(entry => entry.weight)
      .map(entry => entry.weight);

    return { totalWorkouts, mostFrequentExercises, weightProgress };
  } catch (error) {
    console.error('Error fetching statistics:', error);
    throw error;
  }
};

export const fetchWeightHistory = async (userId) => {
  const weightEntries = [];
  const q = query(collection(db, 'diaryEntries'), where('userId', '==', userId), where('type', '==', 'weight'));
  const querySnapshot = await getDocs(q);
  querySnapshot.forEach((doc) => {
    weightEntries.push({ date: doc.data().date, weight: doc.data().weight });
  });
  return weightEntries.sort((a, b) => new Date(a.date) - new Date(b.date));
};
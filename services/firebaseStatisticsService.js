import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';

export const fetchStatistics = async (userId) => {
  try {
    const q = query(collection(db, 'diaryEntries'), where('userId', '==', userId), where('type', '==', 'exercise'));
    const snapshot = await getDocs(q);
    const entries = snapshot.docs.map(doc => doc.data());

    console.log('User ID being queried:', userId);
    console.log('Number of documents found:', snapshot.docs.length);
    console.log('Raw entries:', entries);

    const totalWorkouts = entries.length;

    const exerciseCounts = {};
    entries.forEach(entry => {
      if (entry.exercise && entry.exercise.Name) { // Access nested Name
        if (!exerciseCounts[entry.exercise.Name]) {
          exerciseCounts[entry.exercise.Name] = 0;
        }
        exerciseCounts[entry.exercise.Name]++;
      }
    });

    console.log('Exercise counts:', exerciseCounts);

    const mostFrequentExercises = Object.keys(exerciseCounts)
      .map(name => ({ name, count: exerciseCounts[name] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

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
import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';

export const fetchExercises = async () => {
  try {
    const exercisesCollection = collection(db, 'exercises');
    const exerciseSnapshot = await getDocs(exercisesCollection);
    const exerciseList = exerciseSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return exerciseList;
  } catch (error) {
    console.error('Erreur lors de la récupération des exercices:', error);
    throw error;
  }
};

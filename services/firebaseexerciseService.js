import { collection, getDocs, query, limit, startAfter, orderBy } from 'firebase/firestore';
import { db } from './firebase';

export const fetchExercises = async (limitCount = 50, startAfterDoc = null) => {
  try {
    const exercisesCollection = collection(db, 'exercises');
    let exercisesQuery = query(exercisesCollection, orderBy('Name'), limit(limitCount));
    if (startAfterDoc) {
      exercisesQuery = query(exercisesCollection, orderBy('Name'), limit(limitCount), startAfter(startAfterDoc));
    }
    const exerciseSnapshot = await getDocs(exercisesQuery);
    const exerciseList = exerciseSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return { exerciseList, lastDoc: exerciseSnapshot.docs[exerciseSnapshot.docs.length - 1] };
  } catch (error) {
    console.error('Erreur lors de la récupération des exercices:', error);
    throw error;
  }
};
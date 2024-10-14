// services/exerciseService.js
import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase'; // Assure-toi que c'est le bon chemin vers ton fichier firebaseConfig.js

export const fetchExercises = async () => {
  try {
    const exercisesCollection = collection(db, 'exercises');
    const exerciseSnapshot = await getDocs(exercisesCollection);
    const exerciseList = exerciseSnapshot.docs.map(doc => doc.data());
    return exerciseList;
  } catch (error) {
    console.error('Erreur lors de la récupération des exercices:', error);
    throw error;
  }
};

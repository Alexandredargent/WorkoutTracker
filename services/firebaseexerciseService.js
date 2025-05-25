import { collection, getDocs, query, limit, startAfter, orderBy, addDoc, doc, deleteDoc } from 'firebase/firestore';
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

export const addExercise = async (exerciseData) => {
  try {
    // Add default fields like isPopular and date for consistency/filtering
    const dataToSave = {
      ...exerciseData,
      isPopular: exerciseData.isPopular ?? false, // Default to false if not provided
      date: exerciseData.date ?? new Date().toISOString(), // Add a timestamp
    };
    const exercisesCollection = collection(db, 'exercises');
    const docRef = await addDoc(exercisesCollection, dataToSave);
    return { id: docRef.id, ...dataToSave };
  } catch (error) {
    console.error('Error adding exercise to Firestore:', error);
    throw error;
  }
  
};
// Add a new function for user exercises
export const addUserExercise = async (userId, exerciseData) => {
  try {
    const dataToSave = {
      ...exerciseData,
      isPopular: false,
      date: new Date().toISOString(),
    };
    const userExercisesCollection = collection(db, 'users', userId, 'exercises');
    const docRef = await addDoc(userExercisesCollection, dataToSave);
    return { id: docRef.id, ...dataToSave };
  } catch (error) {
    console.error('Error adding user exercise:', error);
    throw error;
  }
};

export const fetchUserExercises = async (userId, limitCount = 50, startAfterDoc = null) => {
  try {
    const userExercisesCollection = collection(db, 'users', userId, 'exercises');
    let userExercisesQuery = query(userExercisesCollection, orderBy('Name'), limit(limitCount));
    if (startAfterDoc) {
      userExercisesQuery = query(userExercisesCollection, orderBy('Name'), limit(limitCount), startAfter(startAfterDoc));
    }
    const exerciseSnapshot = await getDocs(userExercisesQuery);
    const exerciseList = exerciseSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return { exerciseList, lastDoc: exerciseSnapshot.docs[exerciseSnapshot.docs.length - 1] };
  } catch (error) {
    console.error('Error fetching user exercises:', error);
    throw error;
  }
};

export const deleteUserExercise = async (userId, exerciseId) => {
  try {
    const exerciseDoc = doc(db, 'users', userId, 'exercises', exerciseId);
    await deleteDoc(exerciseDoc);
  } catch (error) {
    console.error('Error deleting user exercise:', error);
    throw error;
  }
};
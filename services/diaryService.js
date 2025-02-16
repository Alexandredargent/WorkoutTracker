import { collection, addDoc, query, where, getDocs, updateDoc, arrayUnion, doc } from 'firebase/firestore';
import { db } from './firebase';

export const addExerciseToDiary = async (userId, date, exercise) => {
  try {
    const docRef = await addDoc(collection(db, 'diaryEntries'), {
      userId: userId,
      date: date,
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      sets: []
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding exercise to diary:', error);
    throw error;
  }
};

export const fetchDiaryEntriesForDate = async (userId, date) => {
  try {
    const q = query(
      collection(db, 'diaryEntries'), 
      where('userId', '==', userId),
      where('date', '==', date)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching diary entries:', error);
    return [];
  }
};

export const addSetToExercise = async (entryId, set) => {
  try {
    const entryRef = doc(db, 'diaryEntries', entryId);
    await updateDoc(entryRef, {
      sets: arrayUnion(set)
    });
  } catch (error) {
    console.error('Error adding set to exercise:', error);
    throw error;
  }
};

export const addMealToDiary = async (userId, date, meal) => {
  try {
    await addDoc(collection(db, 'diaryEntries'), {
      userId: userId,
      date: date,
      mealName: meal.name,
      calories: meal.calories,
      type: 'meal'
    });
  } catch (error) {
    console.error('Error adding meal to diary:', error);
    throw error;
  }
};

export const addWeightToDiary = async (userId, weightEntry) => {
  try {
    await addDoc(collection(db, 'diaryEntries'), {
      userId: userId,
      date: weightEntry.date,
      weight: weightEntry.weight,
      type: 'weight'
    });
  } catch (error) {
    console.error('Error adding weight to diary:', error);
    throw error;
  }
};
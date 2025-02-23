import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  updateDoc, 
  arrayUnion, 
  doc 
} from 'firebase/firestore';
import { db } from './firebase';

// Add a new exercise entry
export const addExerciseToDiary = async (userId, date, exercise) => {
  try {
    const docRef = await addDoc(collection(db, 'diaryEntries'), {
      userId: userId,
      date: date,
      exercise: exercise,
      type: 'exercise'
    });
    console.log('Exercise added with ID: ', docRef.id);
  } catch (e) {
    console.error('Error adding exercise:', e);
  }
};

// Fetch all diary entries for a specific date
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

// Add a set to an existing exercise entry
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

// Add a meal entry
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

// Add a new weight entry (if there is no weight yet for the day)
export const addWeightToDiary = async (userId, weightEntry) => {
  try {
    const docRef = await addDoc(collection(db, 'diaryEntries'), {
      userId: userId,
      date: weightEntry.date,
      weight: weightEntry.weight,
      type: 'weight'
    });
    return docRef;
  } catch (error) {
    console.error('Error adding weight to diary:', error);
    throw error;
  }
};

// Update existing weight entry
export const updateWeightInDiary = async (userId, entryId, weightEntry) => {
  try {
    const entryRef = doc(db, 'diaryEntries', entryId);
    await updateDoc(entryRef, {
      weight: weightEntry.weight,
      date: weightEntry.date
    });
  } catch (error) {
    console.error('Error updating weight in diary:', error);
    throw error;
  }
};

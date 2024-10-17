
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';

export const addExerciseToDiary = async (userId, date, exercise) => {
    try {
      await addDoc(collection(db, 'diaryEntries'), {
        userId: userId,
        date: date,
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        // Add any other relevant exercise data
      });
    } catch (error) {
      console.error('Error adding exercise to diary:', error);
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
  

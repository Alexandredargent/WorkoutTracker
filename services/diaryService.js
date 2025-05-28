import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs,
  getDoc, 
  updateDoc as updateFirestoreDoc, // Alias updateDoc
  arrayUnion, 
  arrayRemove, 
  doc, 
  deleteDoc
} from 'firebase/firestore';
import { db } from './firebase';

// Add a new exercise entry
export const addExerciseToDiary = async (userId, date, exercise) => {
  try {
    const docRef = await addDoc(collection(db, 'users', userId, 'diaryEntries'), {
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
      collection(db, 'users', userId, 'diaryEntries'), 
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
export const addSetToExercise = async (userId, entryId, set) => {
  if (!userId) {
    console.error('Error adding set: userId is undefined');
    throw new Error('User ID is required to add a set.');
  }
  try {
    const entryRef = doc(db, 'users', userId, 'diaryEntries', entryId);
    await updateFirestoreDoc(entryRef, {
      sets: arrayUnion(set)
    });
  } catch (error) {
    console.error('Error adding set to exercise:', error);
    throw error;
  }
};

// Delete a set from an existing exercise entry
export const deleteSetFromExercise = async (userId, entryId, set) => {
  if (!userId) {
    console.error('Error deleting set: userId is undefined');
    throw new Error('User ID is required to delete a set.');
  }
  try {
    const entryRef = doc(db, 'users', userId, 'diaryEntries', entryId);
    await updateFirestoreDoc(entryRef, {
      sets: arrayRemove(set)
    });
  } catch (error) {
    console.error('Error deleting set from exercise:', error);
    throw error;
  }
};

// Update a set in an existing exercise entry
export const updateSetInExercise = async (userId, entryId, oldSet, newSet) => {
  if (!userId) {
    console.error('Error updating set: userId is undefined');
    throw new Error('User ID is required to update a set.');
  }
  try {
    const entryRef = doc(db, 'users', userId, 'diaryEntries', entryId);
    // Firestore array update: remove old, then add new.
    // For more complex array updates, consider fetching, modifying in code, then setting the whole array.
    await updateFirestoreDoc(entryRef, {
      sets: arrayRemove(oldSet)
    });
    await updateFirestoreDoc(entryRef, {
      sets: arrayUnion(newSet)
    });
  } catch (error) {
    console.error('Error updating set in exercise:', error);
    throw error;
  }
};

// Delete an exercise entry
export const deleteExerciseFromDiary = async (userId, entryId) => {
  if (!userId) {
    console.error('Error deleting exercise: userId is undefined');
    throw new Error('User ID is required to delete an exercise.');
  }
  try {
    const entryRef = doc(db, 'users', userId, 'diaryEntries', entryId);
    await deleteDoc(entryRef);
  } catch (error) {
    console.error('Error deleting exercise from diary:', error);
    throw error;
  }
};

// Add a meal entry
export const addMealToDiary = async (userId, date, meal) => {
  try {
    // Create a database entry with all the meal properties
    const mealEntry = {
      userId: userId,
      date: date,
      type: 'meal',
      // Basic meal info
      mealName: meal.name || meal.mealName || 'Unknown Meal',
      calories: meal.calories || 0,
      // Additional nutritional info
      carbs: meal.carbs || 0,
      lipids: meal.lipids || 0,
      proteins: meal.proteins || 0,
      // For scanned items
      image: meal.image || null,
      scanned: meal.scanned || false,
      // Open Food Facts specific data
      productId: meal.id || null,
      brand: meal.brand || null,
      nutritionGrade: meal.nutritionGrade || null,
      ingredients: meal.ingredients || null,
      allergens: meal.allergens || null,
    };

    // Add the document to Firestore
    const docRef = await addDoc(collection(db, 'users', userId, 'diaryEntries'), mealEntry);
    console.log('Meal added with ID: ', docRef.id);
    
    return { id: docRef.id, ...mealEntry };
  } catch (error) {
    console.error('Error adding meal to diary:', error);
    throw error;
  }
};
export const applyProgramToDate = async (userId, date, program) => {
  try {
    const exercises = program.exercises || [];

    const enrichedExercises = await Promise.all(
      exercises.map(async (ex) => {
        // Cherche les données complètes de l'exercice à partir de l'ID
        let exerciseData = null;

        const userExerciseRef = doc(db, 'users', userId, 'exercises', ex.exerciseId);
        const userExerciseSnap = await getDoc(userExerciseRef);

        if (userExerciseSnap.exists()) {
          exerciseData = userExerciseSnap.data();
        } else {
          const globalExerciseRef = doc(db, 'exercises', ex.exerciseId);
          const globalExerciseSnap = await getDoc(globalExerciseRef);
          if (globalExerciseSnap.exists()) {
            exerciseData = globalExerciseSnap.data();
          }
        }

        if (!exerciseData) return null;

        return {
          ...exerciseData,
          sets: [], // important : ne pas copier les sets
        };
      })
    );

    const batch = enrichedExercises
      .filter(Boolean)
      .map(async (exercise) => {
        return await addDoc(collection(db, 'users', userId, 'diaryEntries'), {
          userId,
          date,
          exercise,
          type: 'exercise',
        });
      });

    await Promise.all(batch);
  } catch (error) {
    console.error('Error applying program to diary:', error);
    throw error;
  }
};



// Add a new weight entry (if there is no weight yet for the day)
export const addWeightToDiary = async (userId, weightEntry, currentFormattedDate) => {
  if (!userId) {
    console.error('Error adding weight: userId is undefined');
    throw new Error('User ID is required to add weight.');
  }
  // Check if the diary entry date is in the future
  if (weightEntry.date > currentFormattedDate) {
    console.error('Error adding weight: Cannot log weight for a future date.');
    throw new Error('Cannot log weight for a future date.');
  }

  try {
    const docRef = await addDoc(collection(db, 'users', userId, 'diaryEntries'), {
      userId: userId,
      date: weightEntry.date,
      weight: weightEntry.weight,
      type: 'weight'
    });

    // Update user's main weight in their profile if the entry date is today or in the future
    if (weightEntry.date >= currentFormattedDate) {
      const userProfileRef = doc(db, 'users', userId);
      await updateFirestoreDoc(userProfileRef, {
        weight: weightEntry.weight
      });
      console.log(`User ${userId} main weight updated to ${weightEntry.weight} on profile.`);
    } else {
      console.log(`User ${userId} main weight not updated on profile as diary date ${weightEntry.date} is before ${currentFormattedDate} or it's a past entry.`);
    }
    return docRef;
  } catch (error) {
    console.error('Error adding weight to diary:', error);
    throw error;
  }
};

// Update existing weight entry
export const updateWeightInDiary = async (userId, entryId, weightEntry, currentFormattedDate) => {
  if (!userId) {
    console.error('Error updating weight: userId is undefined');
    throw new Error('User ID is required to update weight.');
  }
  // Check if the diary entry date is in the future
  if (weightEntry.date > currentFormattedDate) {
    console.error('Error updating weight: Cannot log weight for a future date.');
    throw new Error('Cannot log weight for a future date.');
  }

  try {
    const entryRef = doc(db, 'users', userId, 'diaryEntries', entryId);
    await updateFirestoreDoc(entryRef, {
      weight: weightEntry.weight,
      date: weightEntry.date
    });

    // Update user's main weight in their profile if the entry date is today or in the future
    if (weightEntry.date >= currentFormattedDate) {
      const userProfileRef = doc(db, 'users', userId);
      await updateFirestoreDoc(userProfileRef, {
        weight: weightEntry.weight
      });
      console.log(`User ${userId} main weight updated to ${weightEntry.weight} on profile after diary update.`);
    } else {
      console.log(`User ${userId} main weight not updated on profile as diary date ${weightEntry.date} is before ${currentFormattedDate} during update, or it's a past entry.`);
    }
  } catch (error) {
    console.error('Error updating weight in diary:', error);
    throw error;
  }
};

// Delete a meal entry
export const deleteMealFromDiary = async (userId, entryId) => {
  if (!userId) {
    console.error('Error deleting meal: userId is undefined');
    throw new Error('User ID is required to delete a meal.');
  }
  try {
    const entryRef = doc(db, 'users', userId, 'diaryEntries', entryId);
    await deleteDoc(entryRef);
  } catch (error) {
    console.error('Error deleting meal from diary:', error);
    throw error;
  }
};

// Ajoute ou met à jour le commentaire du jour
export const setDayComment = async (userId, date, comment) => {
  if (!userId) {
    console.error('Error setting day comment: userId is undefined');
    throw new Error('User ID is required to set a day comment.');
  }
  try {
    // Cherche s'il existe déjà une entrée de commentaire pour ce jour
    const q = query(
      collection(db, 'users', userId, 'diaryEntries'),
      where('userId', '==', userId),
      where('date', '==', date),
      where('type', '==', 'dayComment')
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      // Mise à jour si déjà existant
      const entryRef = doc(db, 'users', userId, 'diaryEntries', snapshot.docs[0].id);
      await updateFirestoreDoc(entryRef, { comment });
    } else {
      // Sinon, création
      await addDoc(collection(db, 'users', userId, 'diaryEntries'), {
        userId,
        date,
        type: 'dayComment',
        comment,
      });
    }
  } catch (error) {
    console.error('Error setting day comment:', error);
    throw error;
  }
};

// Pour récupérer le commentaire du jour
export const fetchDayComment = async (userId, date) => {
  if (!userId) {
    console.error('Error fetching day comment: userId is undefined');
    return ''; // Or throw an error, depending on desired behavior
  }
  try {
    const q = query(
      collection(db, 'users', userId, 'diaryEntries'),
      where('userId', '==', userId),
      where('date', '==', date),
      where('type', '==', 'dayComment')
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      return snapshot.docs[0].data().comment || '';
    }
    return '';
  } catch (error) {
    console.error('Error fetching day comment:', error);
    return '';
  }
};

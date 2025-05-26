import { collection, getDocs, query, limit, startAfter, orderBy, addDoc, doc, deleteDoc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
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

// --- Fonctions pour les Programmes d'Entraînement ---

/**
 * Ajoute un nouveau programme d'entraînement pour un utilisateur.
 * Un programme contient un nom, une description optionnelle, et une liste d'exercices.
 * Chaque exercice dans le programme peut avoir des détails spécifiques (ex: séries, répétitions).
 */
export const addUserProgram = async (userId, programData) => {
  try {
    const dataToSave = {
      ...programData, // ex: { name: "Mon Programme Haut du Corps", description: "...", exercises: [{exerciseId: "id1", sets: 3, reps: 10}, ...] }
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const userProgramsCollection = collection(db, 'users', userId, 'programs');
    const docRef = await addDoc(userProgramsCollection, dataToSave);
    return { id: docRef.id, ...dataToSave };
  } catch (error) {
    console.error('Error adding user program:', error);
    throw error;
  }
};

/**
 * Récupère les programmes d'entraînement d'un utilisateur.
 */
export const fetchUserPrograms = async (userId, limitCount = 50, startAfterDoc = null) => {
  try {
    const userProgramsCollection = collection(db, 'users', userId, 'programs');
    let programsQuery = query(userProgramsCollection, orderBy('name'), limit(limitCount)); // Ou orderBy('createdAt')
    if (startAfterDoc) {
      programsQuery = query(userProgramsCollection, orderBy('name'), limit(limitCount), startAfter(startAfterDoc));
    }
    const programSnapshot = await getDocs(programsQuery);
    const programList = programSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return { programList, lastDoc: programSnapshot.docs[programSnapshot.docs.length - 1] };
  } catch (error) {
    console.error('Error fetching user programs:', error);
    throw error;
  }
};

export const deleteUserProgram = async (userId, programId) => {
  try {
    const programDoc = doc(db, 'users', userId, 'programs', programId);
    await deleteDoc(programDoc);
  } catch (error) {
    console.error('Error deleting user program:', error);
    throw error;
  }
};

// Add this new function to fetch a single program
export const fetchUserProgram = async (userId, programId) => {
  try {
    const programDoc = doc(db, 'users', userId, 'programs', programId);
    const programSnapshot = await getDoc(programDoc);
    
    if (programSnapshot.exists()) {
      return { id: programSnapshot.id, ...programSnapshot.data() };
    } else {
      throw new Error('Program not found');
    }
  } catch (error) {
    console.error('Error fetching user program:', error);
    throw error;
  }
};

// Add this function to update a single program
export const updateUserProgram = async (userId, programId, updatedData) => {
  try {
    const programDoc = doc(db, 'users', userId, 'programs', programId);
    await updateDoc(programDoc, updatedData);
  } catch (error) {
    console.error('Error updating user program:', error);
    throw error;
  }
};

// --- Favorite Functions ---

/**
 * Toggle favorite status for an exercise
 */
export const toggleFavoriteExercise = async (userId, exerciseId, isFavorite) => {
  try {
    const favoriteDoc = doc(db, 'users', userId, 'favorites', 'exercises', 'items', exerciseId);
    
    if (isFavorite) {
      // Add to favorites
      await setDoc(favoriteDoc, {
        exerciseId: exerciseId,
        addedAt: new Date().toISOString(),
      });
    } else {
      // Remove from favorites
      await deleteDoc(favoriteDoc);
    }
  } catch (error) {
    console.error('Error toggling favorite exercise:', error);
    throw error;
  }
};

/**
 * Toggle favorite status for a program
 */
export const toggleFavoriteProgram = async (userId, programId, isFavorite) => {
  try {
    const favoriteDoc = doc(db, 'users', userId, 'favorites', 'programs', 'items', programId);
    
    if (isFavorite) {
      // Add to favorites
      await setDoc(favoriteDoc, {
        programId: programId,
        addedAt: new Date().toISOString(),
      });
    } else {
      // Remove from favorites
      await deleteDoc(favoriteDoc);
    }
  } catch (error) {
    console.error('Error toggling favorite program:', error);
    throw error;
  }
};

/**
 * Fetch user's favorite exercises
 */
export const fetchFavoriteExercises = async (userId) => {
  try {
    const favoritesCollection = collection(db, 'users', userId, 'favorites', 'exercises', 'items');
    const favoritesSnapshot = await getDocs(favoritesCollection);
    
    const favoriteExerciseIds = favoritesSnapshot.docs.map(doc => doc.data().exerciseId);
    
    if (favoriteExerciseIds.length === 0) {
      return { exerciseList: [] };
    }

    // Fetch the actual exercise data from both global and user exercises
    const globalExercisesSnapshot = await getDocs(collection(db, 'exercises'));
    const userExercisesSnapshot = await getDocs(collection(db, 'users', userId, 'exercises'));
    
    const allExercises = [
      ...globalExercisesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
      ...userExercisesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), isUserCreated: true }))
    ];

    const favoriteExercises = allExercises.filter(exercise => 
      favoriteExerciseIds.includes(exercise.id)
    );

    return { exerciseList: favoriteExercises };
  } catch (error) {
    console.error('Error fetching favorite exercises:', error);
    throw error;
  }
};

/**
 * Fetch user's favorite programs
 */
export const fetchFavoritePrograms = async (userId) => {
  try {
    const favoritesCollection = collection(db, 'users', userId, 'favorites', 'programs', 'items');
    const favoritesSnapshot = await getDocs(favoritesCollection);
    
    const favoriteProgramIds = favoritesSnapshot.docs.map(doc => doc.data().programId);
    
    if (favoriteProgramIds.length === 0) {
      return { programList: [] };
    }

    // Fetch the actual program data from both user and public programs
    const userProgramsSnapshot = await getDocs(collection(db, 'users', userId, 'programs'));
    const publicProgramsSnapshot = await getDocs(collection(db, 'publicPrograms')); // Assuming you have public programs
    
    const allPrograms = [
      ...userProgramsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), isUserCreated: true })),
      ...publicProgramsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), isUserCreated: false }))
    ];

    const favoritePrograms = allPrograms.filter(program => 
      favoriteProgramIds.includes(program.id)
    );

    return { programList: favoritePrograms };
  } catch (error) {
    console.error('Error fetching favorite programs:', error);
    throw error;
  }
};

/**
 * Check if an exercise is favorited
 */
export const isExerciseFavorited = async (userId, exerciseId) => {
  try {
    const favoriteDoc = doc(db, 'users', userId, 'favorites', 'exercises', 'items', exerciseId);
    const favoriteSnapshot = await getDoc(favoriteDoc);
    return favoriteSnapshot.exists();
  } catch (error) {
    console.error('Error checking if exercise is favorited:', error);
    return false;
  }
};

/**
 * Check if a program is favorited
 */
export const isProgramFavorited = async (userId, programId) => {
  try {
    const favoriteDoc = doc(db, 'users', userId, 'favorites', 'programs', 'items', programId);
    const favoriteSnapshot = await getDoc(favoriteDoc);
    return favoriteSnapshot.exists();
  } catch (error) {
    console.error('Error checking if program is favorited:', error);
    return false;
  }
};

/**
 * Fetch public programs (you'll need to implement this based on your data structure)
 */
export const fetchPublicPrograms = async (limitCount = 50, startAfterDoc = null) => {
  try {
    // This assumes you have a 'publicPrograms' collection
    // Adjust the collection name based on your Firebase structure
    const publicProgramsCollection = collection(db, 'publicPrograms');
    let programsQuery = query(publicProgramsCollection, orderBy('name'), limit(limitCount));
    if (startAfterDoc) {
      programsQuery = query(publicProgramsCollection, orderBy('name'), limit(limitCount), startAfter(startAfterDoc));
    }
    const programSnapshot = await getDocs(programsQuery);
    const programList = programSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return { programList, lastDoc: programSnapshot.docs[programSnapshot.docs.length - 1] };
  } catch (error) {
    console.error('Error fetching public programs:', error);
    // Return empty list if no public programs collection exists
    return { programList: [], lastDoc: null };
  }
};
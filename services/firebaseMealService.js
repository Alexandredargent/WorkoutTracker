import { collection, getDocs, addDoc, setDoc, getDoc, query, orderBy, limit, startAfter, doc, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';

// Fetch global meals (unchanged)
export const fetchMeals = async () => {
  try {
    const mealsCollection = collection(db, 'meals');
    const mealSnapshot = await getDocs(mealsCollection);
    const mealList = mealSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return mealList;
  } catch (error) {
    console.error('Error fetching meals:', error);
    throw error;
  }
};
// Toggle favorite status for a meal
export const toggleFavoriteMeal = async (userId, mealId, isFavorite) => {
  try {
    const favoriteDoc = doc(db, 'users', userId, 'favorites', 'meals', 'items', mealId);
    
    if (isFavorite) {
      // Add to favorites
      await setDoc(favoriteDoc, {
        mealId: mealId,
        addedAt: new Date().toISOString(),
      });
    } else {
      // Remove from favorites
      await deleteDoc(favoriteDoc);
    }
  } catch (error) {
    console.error('Error toggling favorite meal:', error);
    throw error;
  }
};

// Fetch user's favorite meals
export const fetchFavoriteMeals = async (userId) => {
  try {
    const favoritesCollection = collection(db, 'users', userId, 'favorites', 'meals', 'items');
    const favoritesSnapshot = await getDocs(favoritesCollection);
    
    const favoriteMealIds = favoritesSnapshot.docs.map(doc => doc.id);
    
    if (favoriteMealIds.length === 0) {
      return [];
    }

    // Fetch the actual meal data from both global and user meals
    const globalMealsSnapshot = await getDocs(collection(db, 'meals'));
    const userMealsSnapshot = await getDocs(collection(db, 'users', userId, 'meals'));
    
    const allMeals = [
      ...globalMealsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
      ...userMealsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), isUserCreated: true }))
    ];

    const favoriteMeals = allMeals.filter(meal => 
      favoriteMealIds.includes(meal.id)
    );

    return favoriteMeals;
  } catch (error) {
    console.error('Error fetching favorite meals:', error);
    throw error;
  }
};

// Check if a meal is favorited
export const isMealFavorited = async (userId, mealId) => {
  try {
    const favoriteDoc = doc(db, 'users', userId, 'favorites', 'meals', 'items', mealId);
    const favoriteSnapshot = await getDoc(favoriteDoc);
    return favoriteSnapshot.exists();
  } catch (error) {
    console.error('Error checking if meal is favorited:', error);
    return false;
  }
};


// Add meal to user's private collection
export const addUserMeal = async (userId, mealData) => {
  try {
    const dataToSave = {
      ...mealData,
      date: new Date().toISOString(),
    };
    const userMealsCollection = collection(db, 'users', userId, 'meals');
    const docRef = await addDoc(userMealsCollection, dataToSave);
    return { id: docRef.id, ...dataToSave };
  } catch (error) {
    console.error('Error adding user meal:', error);
    throw error;
  }
};

// Fetch meals from user's private collection
export const fetchUserMeals = async (userId, limitCount = 50, startAfterDoc = null) => {
  try {
    const userMealsCollection = collection(db, 'users', userId, 'meals');
    let userMealsQuery = query(userMealsCollection, orderBy('name'), limit(limitCount));
    if (startAfterDoc) {
      userMealsQuery = query(userMealsCollection, orderBy('name'), limit(limitCount), startAfter(startAfterDoc));
    }
    const mealSnapshot = await getDocs(userMealsQuery);
    const mealList = mealSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return mealList;
  } catch (error) {
    console.error('Error fetching user meals:', error);
    throw error;
  }
};

// Delete meal from user's private collection
export const deleteUserMeal = async (userId, mealId) => {
  try {
    const mealDoc = doc(db, 'users', userId, 'meals', mealId);
    await deleteDoc(mealDoc);
  } catch (error) {
    console.error('Error deleting user meal:', error);
    throw error;
  }
};
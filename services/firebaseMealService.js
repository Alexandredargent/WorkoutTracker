import { collection, getDocs, addDoc, query, orderBy, limit, startAfter, doc, deleteDoc } from 'firebase/firestore';
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
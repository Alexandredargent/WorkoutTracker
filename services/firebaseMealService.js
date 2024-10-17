import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';

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
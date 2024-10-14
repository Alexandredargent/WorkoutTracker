// Import des fonctions Firebase
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"; // Assurez-vous d'importer getFirestore
import { initializeAuth, getReactNativePersistence } from "firebase/auth"; // Modifier l'importation
import AsyncStorage from "@react-native-async-storage/async-storage"; // Importer AsyncStorage
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Configuration Firebase 
const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

// Initialisation de Firebase
const app = initializeApp(firebaseConfig);
// Initialisation de Firestore
const db = getFirestore(app);
// Initialisation de l'authentification avec AsyncStorage
const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage) // Utiliser AsyncStorage pour la persistance
});
// Exporter la base de données et l'authentification pour les utiliser dans d'autres fichiers
export { db, auth };


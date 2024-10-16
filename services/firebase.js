// Import des fonctions Firebase
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"; // Pour Firestore
import { initializeAuth, getReactNativePersistence } from "firebase/auth"; // Pour Auth
import AsyncStorage from "@react-native-async-storage/async-storage"; // Pour la persistance de l'authentification
import { FIREBASE_API_KEY, FIREBASE_AUTH_DOMAIN, FIREBASE_PROJECT_ID, FIREBASE_STORAGE_BUCKET, FIREBASE_MESSAGING_SENDER_ID, FIREBASE_APP_ID } from '@env'; // Import des variables d'environnement

// Configuration Firebase 
const firebaseConfig = {
    apiKey: FIREBASE_API_KEY,
    authDomain: FIREBASE_AUTH_DOMAIN,
    projectId: FIREBASE_PROJECT_ID,
    storageBucket: FIREBASE_STORAGE_BUCKET,
    messagingSenderId: FIREBASE_MESSAGING_SENDER_ID,
    appId: FIREBASE_APP_ID,
};

// Initialisation de Firebase
const app = initializeApp(firebaseConfig);

// Initialisation de Firestore
const db = getFirestore(app);

// Initialisation de l'authentification avec AsyncStorage pour la persistance
const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
});

// Exporter la base de données et l'authentification pour les utiliser dans d'autres fichiers
export { db, auth };

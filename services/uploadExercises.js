// Importer le SDK Firebase Admin
import admin from 'firebase-admin';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Charger la clé de service et le JSON des exercices via require
const serviceAccount = require('../workouttracker-33781-firebase-adminsdk-nqgkf-55e3c17280.json');
const exercises = require('../data/exerciseslist.json');


// Initialiser Firebase Admin SDK avec la clé de service
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Initialiser Firestore Admin
const dbAdmin = admin.firestore();



const uploadExercises = async () => {
  try {
    // Référence à la collection d'exercices
    const exercisesRef = dbAdmin.collection('exercises');

    // Ajouter chaque exercice dans Firestore
    for (const exercise of exercises) {
      await exercisesRef.add(exercise);
    }

    console.log('✅ Exercices importés avec succès !');
  } catch (error) {
    console.error('❌ Erreur lors de l\'importation :', error);
  }
};

// Lancer l'importation
uploadExercises();

import admin from 'firebase-admin';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Charger la clé de service et le JSON des exercices via require
const serviceAccount = require('../workouttracker-33781-firebase-adminsdk-nqgkf-55e3c17280.json');



// Initialiser Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Exporter Firestore
const dbAdmin = admin.firestore();

export { dbAdmin };

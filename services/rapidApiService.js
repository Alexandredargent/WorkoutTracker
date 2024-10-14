//connection to the API EXERCICEDB on rapidapi.com

import axios from 'axios';

// Define the base URL for the ExerciseDB API
const BASE_URL = 'https://exercisedb.p.rapidapi.com/exercises'; // URL de l'API ExerciseDB

// Define the fetchExercises function to retrieve exercises
export const fetchExercises = async () => {
  try {
    // Set up the headers with your RapidAPI key and host
    const options = {
      method: 'GET',
      url: BASE_URL,
      headers: {
        'X-RapidAPI-Key': process.env.REACT_APP_X-RapidAPI-Key,// Remplacez par votre clé API RapidAPI
        'X-RapidAPI-Host': process.env.REACT_APP_exercisedb.p.rapidapi.com,
      }
    };

    // Make the API request
    const response = await axios(options);
    return response.data; // Retourne la liste des exercices
  } catch (error) {
    console.error('Error fetching exercises:', error);
    throw error; // Propagation de l'erreur
  }
};

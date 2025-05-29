const muscleIcons = {
  Abdominals: require('../assets/Frontbodymuscles_EPS_PNG_SVG/PNG files/Rectus Abdominus.png'),
  Abductors: require('../assets/Backbodymuscles_EPS_PNG_SVG/PNG files/Gluteus medius.png'),
  Adductors: require('../assets/Frontbodymuscles_EPS_PNG_SVG/PNG files/Adductor Longus and Pectineus.png'),
  Back: require('../assets/Backbodymuscles_EPS_PNG_SVG/PNG files/Lattisimus dorsi.png'),
  Biceps: require('../assets/Frontbodymuscles_EPS_PNG_SVG/PNG files/Biceps brachii.png'),
  Calves: require('../assets/Frontbodymuscles_EPS_PNG_SVG/PNG files/Gastrocnemius (calf).png'),
  Chest: require('../assets/Frontbodymuscles_EPS_PNG_SVG/PNG files/Pectoralis Major.png'),
  Forearms: require('../assets/Frontbodymuscles_EPS_PNG_SVG/PNG files/Brachioradialis.png'),
  Glutes: require('../assets/Backbodymuscles_EPS_PNG_SVG/PNG files/Gluteus maximus.png'),
  Hamstrings: require('../assets/Backbodymuscles_EPS_PNG_SVG/PNG files/Biceps fermoris.png'),
  "Hip Flexors": require('../assets/Frontbodymuscles_EPS_PNG_SVG/PNG files/Sartorius.png'),
  Neck: require('../assets/Frontbodymuscles_EPS_PNG_SVG/PNG files/Omohyoid.png'),
  Quadriceps: require('../assets/Frontbodymuscles_EPS_PNG_SVG/PNG files/Rectus femoris.png'),
  Shins: require('../assets/Frontbodymuscles_EPS_PNG_SVG/PNG files/Soleus.png'),
  Shoulders: require('../assets/Frontbodymuscles_EPS_PNG_SVG/PNG files/Deltoids.png'),
  Trapezius: require('../assets/Frontbodymuscles_EPS_PNG_SVG/PNG files/Trapezius.png'),
  Triceps: require('../assets/Backbodymuscles_EPS_PNG_SVG/PNG files/Triceps Brachii ( long head, lateral head ).png'),
  FullBody: require('../assets/Frontbodymuscles_EPS_PNG_SVG/PNG files/Full_body_muscles.png'),
  
  Default: require('../assets/Frontbodymuscles_EPS_PNG_SVG/PNG files/Body black outline with white background.png'),
};

export const getMuscleIcon = (muscleGroup) => {
  if (!muscleGroup) return muscleIcons.Default;
  // Remove extra spaces and normalize case
  const cleaned = muscleGroup.trim();
  // Try direct match
  if (muscleIcons[cleaned]) return muscleIcons[cleaned];
  // Try case-insensitive match
  const foundKey = Object.keys(muscleIcons).find(
    key => key.toLowerCase() === cleaned.toLowerCase()
  );
  if (foundKey) return muscleIcons[foundKey];
  // Fallback
  return muscleIcons.Default;
};

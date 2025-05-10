// Calculate daily protein goal (g) based on weight (kg)
export const getProteinGoal = (weight) => Math.round(weight * 2);

// Calculate daily lipid (fat) goal (g) based on weight (kg)
export const getLipidGoal = (weight) => Math.round(weight * 1);

// Calculate daily carb goal (g) based on calorie target and other macros
export const getCarbGoal = (calorieGoal, proteinGoal, lipidGoal) => {
  const kcalFromProt = proteinGoal * 4;
  const kcalFromLip = lipidGoal * 9;
  const kcalLeft = calorieGoal - kcalFromProt - kcalFromLip;
  return Math.round(kcalLeft / 4);
};

// Get activity factor from activity level string
export const getActivityFactor = (level) => {
  switch (level) {
    case 'sedentary': return 1.2;
    case 'light': return 1.375;
    case 'moderate': return 1.55;
    case 'intense': return 1.725;
    case 'very_intense': return 1.9;
    default: return 1.2;
  }
};

// Calculate calorie target using Mifflin-St Jeor formula and user goal
export const calculateCalorieTarget = ({ age, height, weight, gender, goal, activityLevel }) => {
  let bmr;
  if (gender === 'male') {
    bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
  } else {
    bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161;
  }
  const activityFactor = getActivityFactor(activityLevel);
  let calories = bmr * activityFactor;
  if (goal === 'gain_weight') {
    calories += 300;
  } else if (goal === 'lose_weight') {
    calories -= 300;
  }
  return Math.round(calories);
};
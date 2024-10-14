import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';

const AddMealScreen = () => {
  const [mealName, setMealName] = useState('');
  const [calories, setCalories] = useState('');
  const [proteins, setProteins] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fats, setFats] = useState('');

  const handleSaveMeal = () => {
    // Logique de sauvegarde du repas ou ajout dans un état/calendrier
    console.log({
      mealName,
      calories,
      proteins,
      carbs,
      fats,
    });
    // Réinitialise les champs après l'ajout
    setMealName('');
    setCalories('');
    setProteins('');
    setCarbs('');
    setFats('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Meal</Text>

      <TextInput
        style={styles.input}
        placeholder="Meal Name"
        value={mealName}
        onChangeText={setMealName}
      />

      <TextInput
        style={styles.input}
        placeholder="Calories"
        value={calories}
        onChangeText={setCalories}
        keyboardType="numeric"
      />

      <TextInput
        style={styles.input}
        placeholder="Proteins (g)"
        value={proteins}
        onChangeText={setProteins}
        keyboardType="numeric"
      />

      <TextInput
        style={styles.input}
        placeholder="Carbs (g)"
        value={carbs}
        onChangeText={setCarbs}
        keyboardType="numeric"
      />

      <TextInput
        style={styles.input}
        placeholder="Fats (g)"
        value={fats}
        onChangeText={setFats}
        keyboardType="numeric"
      />

      <Button title="Save Meal" onPress={handleSaveMeal} />
    </View>
  );
};

export default AddMealScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
});

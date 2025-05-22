import React from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '../styles/theme';

const ExerciseCard = ({
  item,
  reps,
  weight,
  setReps,
  setWeight,
  onAddSet,
  onDelete,
  onDeleteSet,
  onEditSet,
  onInputFocus,
  iconSource,
}) => (
  <View style={styles.card}>
    <View style={styles.cardRow}>
      {iconSource && (
        <Image
          source={iconSource}
          style={{ width: 70, height: 70, marginRight: 8 }}
          resizeMode="contain"
        />
      )}
      <Text style={styles.cardTitle}>{item.exercise.Name}</Text>
      <TouchableOpacity onPress={() => onDelete(item.id)}>
        <Ionicons name="trash-outline" size={24} color={theme.colors.error} />
      </TouchableOpacity>
    </View>
    <View style={styles.setsHeader}>
      <Text style={styles.setsHeaderText}>Set</Text>
      <Text style={styles.setsHeaderText}>Reps</Text>
      <Text style={styles.setsHeaderText}>Weight (kg)</Text>
      <View style={{ width: 48 }} />
    </View>
    <View style={styles.setInputContainer}>
      <View style={{ flex: 1, alignItems: 'center' }} />
      <TextInput
        style={styles.input}
        placeholder="Reps"
        value={reps}
        onChangeText={setReps}
        onFocus={onInputFocus}
        keyboardType="numeric"
      />
      <TextInput
        style={styles.input}
        placeholder="Weight"
        value={weight}
        onChangeText={setWeight}
        onFocus={onInputFocus}
        keyboardType="numeric"
      />
      <TouchableOpacity style={styles.smallButton} onPress={() => onAddSet(item.id)}>
        <Text style={styles.smallButtonText}>Add Set</Text>
      </TouchableOpacity>
    </View>
    {item.sets &&
      item.sets.map((set, index) => (
        <View key={index} style={styles.setRow}>
          <Text style={styles.setText}>{index + 1}</Text>
          <Text style={styles.setText}>{set.reps}</Text>
          <Text style={styles.setText}>{set.weight}</Text>
          <TouchableOpacity onPress={() => onDeleteSet(item.id, set)}>
            <Ionicons name="trash-outline" size={24} color={theme.colors.error} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onEditSet(item.id, set)}>
            <Ionicons name="pencil-outline" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
      ))}
  </View>
);

const styles = StyleSheet.create({
  card: {
    ...theme.card,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginLeft: 12,
    flex: 1,
  },
  setInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  input: {
    ...theme.input,
    flex: 1,
    marginRight: 8,
    textAlign: 'center',
  },
  smallButton: {
    ...theme.button,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  smallButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  setsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  setsHeaderText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    textAlign: 'center',
  },
  setRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  setText: {
    flex: 1,
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
  },
});

export default ExerciseCard;
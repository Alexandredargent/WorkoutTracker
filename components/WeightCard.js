import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '../styles/theme';

const WeightCard = ({ item, onEdit, isEditable = true }) => (
  <View style={styles.card}>
    <View style={styles.centeredContainer}>
      <Text style={styles.cardTitle}>{item.weight} kg</Text>
      {isEditable && (
        <TouchableOpacity
          style={styles.editButton}
          onPress={onEdit}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="pencil-outline" size={30} color={theme.colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  </View>
);

const styles = StyleSheet.create({
  card: {
    ...theme.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centeredContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    width: '100%',
    paddingVertical: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'center',
  },
  editButton: {
    position: 'absolute',
    right: 16, // adapte selon ton padding/marge du card
    top: '50%',
    transform: [{ translateY: -10 }],
  },
});

export default WeightCard;

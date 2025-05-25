import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '../styles/theme';

const WeightCard = ({ item, onEdit, isEditable = true }) => (
  <View style={styles.card}>
    <View style={styles.cardRow}>
      <Text style={styles.cardTitle}>{item.weight} kg</Text>
      <TouchableOpacity
        style={[styles.updateButton, !isEditable && styles.disabledIconStyle]}
        onPress={onEdit} // The parent (DiaryScreen) already provides the correct onEdit behavior
        disabled={!isEditable}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons
          name="pencil-outline"
          size={24}
          color={isEditable ? theme.colors.primary : (theme.colors.disabledText || '#cccccc')}
        />
      </TouchableOpacity>
    </View>
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
  updateButton: {
    padding: 4,
  },
  disabledIconStyle: {
    opacity: 0.5, // Visually indicate that the button is less interactive
  },
});

export default WeightCard;
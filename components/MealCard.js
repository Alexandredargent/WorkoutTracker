import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet, Button } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '../styles/theme';

const MealCard = ({ item, onPress, onDelete, onEditQuantity }) => ( // Added onEditQuantity prop
  <TouchableOpacity
    style={styles.card}
    onPress={() => onPress(item)}
  >
    <View style={styles.cardRow}>
      <View style={styles.mealInfoContainer}>
        <Ionicons name="restaurant-outline" size={24} color={theme.colors.secondary || '#4CAF50'} style={styles.mealIcon} />
        <Text style={styles.cardTitle}>{item.mealName || item.name}</Text>
      </View>
      <View style={styles.actionsContainer}>
        {item.scanned && (
          <View style={styles.scannedBadge}>
            <Ionicons name="scan-outline" size={16} color="white" />
          </View>
        )}
        {onDelete && (
          <TouchableOpacity onPress={onDelete} style={styles.deleteButton}>
            <Ionicons name="trash-outline" size={22} color={theme.colors.danger || 'red'} />
          </TouchableOpacity>
        )}
        {onEditQuantity && (
          <TouchableOpacity onPress={onEditQuantity} style={styles.editButton}>
            <Ionicons name="create-outline" size={22} color={theme.colors.primary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
    {/* Calories row */}
    <View style={styles.caloriesRow}>
      {(() => {
        const qty = item.quantity || 100;
        return (
          <Text style={styles.caloriesItem}>
            <Text style={styles.nutritionLabel}>Calories:</Text> {((item.calories || 0) * qty / 100).toFixed(1)}
          </Text>
        );
      })()}
    </View>
    {/* Proteins, Carbs, Lipids row */}
    <View style={styles.nutritionRow}>
      {(() => {
        const qty = item.quantity || 100;
        return (
          <>
            <Text style={styles.nutritionItem}>
              <Text style={styles.nutritionLabel}>Proteins:</Text> {((item.proteins || 0) * qty / 100).toFixed(1)}g
            </Text>
            <Text style={styles.nutritionItem}>
              <Text style={styles.nutritionLabel}>Carbs:</Text> {((item.carbs || 0) * qty / 100).toFixed(1)}g
            </Text>
            <Text style={styles.nutritionItem}>
              <Text style={styles.nutritionLabel}>Lipids:</Text> {((item.lipids || 0) * qty / 100).toFixed(1)}g
            </Text>
            <Text style={styles.nutritionLabel}>({qty}g)</Text>
          </>
        );
      })()}
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  card: {
    ...theme.card, // Spread existing card styles from theme
    padding: theme.spacing.md || 15, // Ensure padding is applied
    marginVertical: theme.spacing.sm || 8, // Ensure vertical margin
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8, // Add some space before calorie info
  },
  mealInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1, // Allow meal info to take available space
  },
  mealIcon: {
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    flexShrink: 1, // Allow title to shrink if needed, prevents pushing actions off-screen
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8, // Add some space between title and actions
  },
  scannedBadge: {
    backgroundColor: theme.colors.secondary || '#4CAF50',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 6,
    // marginLeft: 8, // Spacing handled by actionsContainer or deleteButton
  },
  deleteButton: {
    padding: 8, // Make it easier to tap
    marginLeft: 8, // Space from scannedBadge or mealInfo
  },
  editButton: {
    padding: 8, // Make it easier to tap
    marginLeft: 8, // Space from deleteButton
  },
  caloriesRow: {
    flexDirection: 'row',
    marginTop: 4, // Adjusted from 8 to make it slightly closer to the title row
    marginBottom: 2,
  },
  caloriesItem: {
    fontSize: 14,
    color: theme.colors.textMuted || '#555',
    marginRight: 8,
    fontWeight: 'bold',
  },
  nutritionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    marginTop: 2,
  },
  nutritionItem: {
    fontSize: 14,
    color: theme.colors.textMuted || '#555',
    marginRight: 12, // Increased spacing between nutrition items
    marginBottom: 4,
    flexShrink: 1,
  },
  nutritionLabel: {
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  clickableIndicator: { // Kept for reference if you decide to use it
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center', // Center it if used
    marginTop: 10, // Increased top margin
    opacity: 0.7, // Make it less prominent
  },
  clickableText: {
    fontSize: 12,
    color: theme.colors.textMuted || '#999',
    marginRight: 4,
  },
});

export default MealCard;

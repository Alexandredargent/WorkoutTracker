import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '../styles/theme';

const MealCard = ({ item, onPress }) => (
  <TouchableOpacity 
    style={styles.card}
    onPress={() => onPress(item)}
  >
    <View style={styles.cardRow}>
      <Ionicons name="restaurant-outline" size={24} color={theme.colors.secondary || '#4CAF50'} />
      <Text style={styles.cardTitle}>{item.mealName || item.name}</Text>
      {item.scanned && (
        <View style={styles.scannedBadge}>
          <Ionicons name="scan-outline" size={16} color="white" />
        </View>
      )}
    </View>
    {/* Calories on its own line */}
    <View style={styles.caloriesRow}>
      <Text style={styles.caloriesItem}>
        <Text style={styles.nutritionLabel}>Calories:</Text> {item.calories}
      </Text>
    </View>
    {/* Macros below */}
    <View style={styles.nutritionRow}>
      <Text style={styles.nutritionItem}>
        <Text style={styles.nutritionLabel}>Proteins:</Text> {item.proteins}g
      </Text>
      <Text style={styles.nutritionItem}>
        <Text style={styles.nutritionLabel}>Carbs:</Text> {item.carbs}g
      </Text>
      <Text style={styles.nutritionItem}>
        <Text style={styles.nutritionLabel}>Lipids:</Text> {item.lipids}g
      </Text>
    </View>
    <View style={styles.clickableIndicator}>
      <Text style={styles.clickableText}>Tap for details</Text>
      <Ionicons name="chevron-down" size={16} color="#999" />
    </View>
  </TouchableOpacity>
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
  scannedBadge: {
    backgroundColor: theme.colors.secondary || '#4CAF50',
    borderRadius: 8,
    padding: 4,
    marginLeft: 8,
  },
  caloriesRow: {
    flexDirection: 'row',
    marginTop: 8,
    marginBottom: 2,
  },
  caloriesItem: {
    fontSize: 14,
    color: '#555',
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
    color: '#555',
    marginRight: 8,
    marginBottom: 4,
    flexShrink: 1,
  },
  nutritionLabel: {
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  clickableIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  clickableText: {
    fontSize: 12,
    color: '#999',
    marginRight: 4,
  },
});

export default MealCard;
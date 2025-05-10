import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const MealCard = ({ item, onPress }) => (
  <TouchableOpacity 
    style={styles.card}
    onPress={() => onPress(item)}
  >
    <View style={styles.cardRow}>
      <Ionicons name="restaurant-outline" size={24} color="#4CAF50" />
      <Text style={styles.cardTitle}>{item.mealName || item.name}</Text>
      {item.scanned && (
        <View style={styles.scannedBadge}>
          <Ionicons name="scan-outline" size={16} color="white" />
        </View>
      )}
    </View>
    <View style={styles.nutritionRow}>
      <Text style={styles.nutritionItem}>
        <Text style={styles.nutritionLabel}>Calories:</Text> {item.calories}
      </Text>
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
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 12,
    flex: 1,
  },
  scannedBadge: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 4,
    marginLeft: 8,
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  nutritionItem: {
    fontSize: 14,
    color: '#555',
    marginRight: 8,
  },
  nutritionLabel: {
    fontWeight: 'bold',
    color: '#232799',
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
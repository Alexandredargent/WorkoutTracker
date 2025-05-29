import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, StyleSheet, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '../styles/theme';
import { getMuscleIcon } from '../utils/muscleIcons';

const MUSCLE_GROUPS = [
  'Abdominals',
  'Abductors', 
  'Adductors',
  'Back',
  'Biceps',
  'Calves',
  'Chest',
  'Forearms',
  'Glutes',
  'Hamstrings',
  'Hip Flexors',
  'Neck',
  'Quadriceps',
  'Shins',
  'Shoulders',
  'Trapezius',
  'Triceps',
  'FullBody',
];

const MuscleGroupSelector = ({ selectedMuscleGroups, onSelectMuscleGroups, visible, onClose }) => {
  const toggleMuscleGroup = (muscleGroup) => {
    if (selectedMuscleGroups.includes(muscleGroup)) {
      // Remove if already selected
      onSelectMuscleGroups(selectedMuscleGroups.filter(mg => mg !== muscleGroup));
    } else {
      // Add if not selected and under limit
      if (selectedMuscleGroups.length >= 3) {
        Alert.alert('Limit Reached', 'You can select up to 3 muscle groups per program.');
        return;
      }
      onSelectMuscleGroups([...selectedMuscleGroups, muscleGroup]);
    }
  };

  const renderMuscleGroupItem = ({ item }) => {
    const isSelected = selectedMuscleGroups.includes(item);
    const iconSource = getMuscleIcon(item);
    
    return (
      <TouchableOpacity
        style={[
          styles.muscleGroupItem,
          isSelected && styles.selectedMuscleGroupItem
        ]}
        onPress={() => toggleMuscleGroup(item)}
      >
        <View style={styles.imageContainer}>
          <Image 
            source={iconSource} 
            style={styles.muscleGroupImage}
            resizeMode="contain"
          />
          {isSelected && (
            <View style={styles.selectedOverlay}>
              <Ionicons name="checkmark-circle" size={24} color="#fff" />
            </View>
          )}
        </View>
        <Text style={[
          styles.muscleGroupName,
          isSelected && styles.selectedMuscleGroupName
        ]}>
          {item}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Select Muscle Groups ({selectedMuscleGroups.length}/3)
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={MUSCLE_GROUPS}
            renderItem={renderMuscleGroupItem}
            keyExtractor={(item) => item}
            numColumns={2}
            contentContainerStyle={styles.muscleGroupGrid}
            showsVerticalScrollIndicator={false}
          />
          
          <TouchableOpacity style={styles.confirmButton} onPress={onClose}>
            <Text style={styles.confirmButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    padding: theme.spacing.lg,
    width: '95%',
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  muscleGroupGrid: {
    paddingBottom: theme.spacing.md,
  },
  muscleGroupItem: {
    flex: 1,
    margin: theme.spacing.sm,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
    alignItems: 'center',
    minHeight: 120,
  },
  selectedMuscleGroupItem: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '10', // 10% opacity
  },
  imageContainer: {
    position: 'relative',
    width: 60,
    height: 60,
    marginBottom: theme.spacing.sm,
  },
  muscleGroupImage: {
    width: '100%',
    height: '100%',
  },
  selectedOverlay: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  muscleGroupName: {
    fontSize: 12,
    color: theme.colors.text,
    textAlign: 'center',
    fontWeight: '500',
  },
  selectedMuscleGroupName: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default MuscleGroupSelector;
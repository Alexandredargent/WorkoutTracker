import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Image, Modal, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { auth } from '../services/firebase';
import { fetchExerciseHistory } from '../services/diaryService';
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
}) => {
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [exerciseHistory, setExerciseHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const handleShowHistory = async () => {
    try {
      setLoadingHistory(true);
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'You must be logged in to view exercise history.');
        return;
      }
      
      const history = await fetchExerciseHistory(user.uid, item.exercise.Name);
      setExerciseHistory(history);
      setHistoryModalVisible(true);
    } catch (error) {
      console.error('Error fetching exercise history:', error);
      Alert.alert('Error', 'Failed to load exercise history.');
    } finally {
      setLoadingHistory(false);
    }
  };

  const formatDate = (dateString) => {
    return format(new Date(dateString), 'MMM d, yyyy');
  };

  return (
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
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.historyButton}
            onPress={handleShowHistory}
            disabled={loadingHistory}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {loadingHistory ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : (
              <Ionicons name="time-outline" size={20} color={theme.colors.primary} />
            )}
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => onDelete(item.id)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="trash-outline" size={24} color={theme.colors.error} />
          </TouchableOpacity>
        </View>
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
          style={styles.exerciseInput}
          placeholder="Reps"
          value={reps}
          onChangeText={setReps}
          onFocus={onInputFocus}
          keyboardType="numeric"
        />
        <TextInput
          style={styles.exerciseInput}
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

      {/* Exercise History Modal */}
      <Modal
        visible={historyModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setHistoryModalVisible(false)}
      >
        <View style={styles.historyModalOverlay}>
          <View style={styles.historyModalContainer}>
            <View style={styles.historyModalHeader}>
              <Text style={styles.historyModalTitle}>
                {item.exercise.Name} History
              </Text>
              <TouchableOpacity
                onPress={() => setHistoryModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.historyScrollView} showsVerticalScrollIndicator={true}>
              {exerciseHistory.length === 0 ? (
                <Text style={styles.noHistoryText}>
                  No previous records found for this exercise.
                </Text>
              ) : (
                <>
                  <Text style={styles.historyCountText}>
                    Found {exerciseHistory.length} workout{exerciseHistory.length !== 1 ? 's' : ''}:
                  </Text>
                  {exerciseHistory.map((historyEntry, index) => (
                    <View key={historyEntry.id} style={styles.historyEntry}>
                      <Text style={styles.historyDate}>
                        {formatDate(historyEntry.date)}
                      </Text>
                      
                      {/* Modern sets table header */}
                      <View style={styles.setsTableHeader}>
                        <Text style={styles.setsTableHeaderText}>Set</Text>
                        <Text style={styles.setsTableHeaderText}>Reps</Text>
                        <Text style={styles.setsTableHeaderText}>Weight</Text>
                      </View>
                      
                      {/* Modern sets table rows */}
                      <View style={styles.setsTable}>
                        {historyEntry.sets && historyEntry.sets.length > 0 ? (
                          historyEntry.sets.map((set, setIndex) => (
                            <View key={setIndex} style={styles.setsTableRow}>
                              <View style={styles.setsTableCell}>
                                <Text style={styles.setNumber}>{setIndex + 1}</Text>
                              </View>
                              <View style={styles.setsTableCell}>
                                <Text style={styles.setsTableValue}>{set.reps}</Text>
                                <Text style={styles.setsTableLabel}>reps</Text>
                              </View>
                              <View style={styles.setsTableCell}>
                                <Text style={styles.setsTableValue}>{set.weight}</Text>
                                <Text style={styles.setsTableLabel}>kg</Text>
                              </View>
                            </View>
                          ))
                        ) : (
                          <Text style={styles.noSetsText}>No sets recorded</Text>
                        )}
                      </View>
                      
                      {/* Summary stats */}
                      <View style={styles.workoutSummary}>
                        <View style={styles.summaryItem}>
                          <Text style={styles.summaryValue}>
                            {historyEntry.sets?.length || 0}
                          </Text>
                          <Text style={styles.summaryLabel}>Sets</Text>
                        </View>
                        <View style={styles.summaryItem}>
                          <Text style={styles.summaryValue}>
                            {historyEntry.sets?.reduce((total, set) => total + (set.reps || 0), 0) || 0}
                          </Text>
                          <Text style={styles.summaryLabel}>Total Reps</Text>
                        </View>
                        <View style={styles.summaryItem}>
                          <Text style={styles.summaryValue}>
                            {Math.max(...(historyEntry.sets?.map(set => set.weight || 0) || [0]))}
                          </Text>
                          <Text style={styles.summaryLabel}>Max Weight</Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

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
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  historyButton: {
    padding: 8,
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
  exerciseInput: {
    ...theme.input,
    backgroundColor: '#fff5e0',
    borderWidth: 1,
    borderColor: theme.colors.primary,
    color: theme.colors.primary,
    textAlign: 'center',
    flex: 1,
    marginRight: 8,
  },
  // Updated History Modal Styles
  historyModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)', // Darker overlay
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10, // Minimal padding
  },
  historyModalContainer: {
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    padding: theme.spacing.lg,
    width: '98%', // Almost full width
    height: '95%', // Almost full height
    // Remove maxWidth, maxHeight, minHeight constraints
  },
  historyModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  historyModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    flex: 1,
  },
  closeButton: {
    padding: 8, // Increase touch area
    backgroundColor: theme.colors.background,
    borderRadius: 6,
  },
  historyScrollView: {
    flex: 1,
  },
  noHistoryText: {
    textAlign: 'center',
    color: theme.colors.muted,
    fontSize: 16,
    marginTop: theme.spacing.lg,
    padding: theme.spacing.md,
  },
  historyCountText: {
    color: theme.colors.text,
    fontSize: 16,
    marginBottom: theme.spacing.md,
    fontWeight: '500',
  },
  historyEntry: {
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md, // Reduced from theme.spacing.lg
    borderRadius: 8, // Reduced from 12
    marginBottom: theme.spacing.sm, // Reduced from theme.spacing.md
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, // Reduced shadow
    shadowOpacity: 0.05, // Reduced shadow opacity
    shadowRadius: 2, // Reduced shadow radius
    elevation: 2, // Reduced elevation
  },
  historyDate: {
    fontSize: 16, // Reduced from 18
    fontWeight: '700',
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm, // Reduced from theme.spacing.md
    textAlign: 'center',
  },
  
  // Compact table styles
  setsTableHeader: {
    flexDirection: 'row',
    backgroundColor: theme.colors.primary,
    borderTopLeftRadius: 6, // Reduced from 8
    borderTopRightRadius: 6,
    paddingVertical: 8, // Reduced from 12
    paddingHorizontal: 6, // Reduced from 8
    marginBottom: 1, // Reduced from 2
  },
  setsTableHeaderText: {
    flex: 1,
    color: '#fff',
    fontWeight: '600',
    fontSize: 14, // Reduced from 16
    textAlign: 'center',
  },
  setsTable: {
    borderBottomLeftRadius: 6, // Reduced from 8
    borderBottomRightRadius: 6,
    overflow: 'hidden',
  },
  setsTableRow: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    paddingVertical: 8, // Reduced from 12
    paddingHorizontal: 6, // Reduced from 8
  },
  setsTableCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setNumber: {
    fontSize: 16, // Reduced from 18
    fontWeight: '700',
    color: theme.colors.primary,
  },
  setsTableValue: {
    fontSize: 16, // Reduced from 18
    fontWeight: '600',
    color: theme.colors.text,
  },
  setsTableLabel: {
    fontSize: 10, // Reduced from 12
    color: theme.colors.muted,
    marginTop: 1, // Reduced from 2
  },
  
  // Compact summary section
  workoutSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: theme.spacing.sm, // Reduced from theme.spacing.md
    paddingTop: theme.spacing.sm, // Reduced from theme.spacing.md
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 18, // Reduced from 20
    fontWeight: '700',
    color: theme.colors.primary,
  },
  summaryLabel: {
    fontSize: 10, // Reduced from 12
    color: theme.colors.muted,
    marginTop: 2, // Reduced from 4
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

export default ExerciseCard;
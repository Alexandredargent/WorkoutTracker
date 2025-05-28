import React from 'react';

import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import theme from '../styles/theme';

const DiaryHeaderToday = () => {
  const today = new Date();

  return (
    <View style={styles.header}>
      <Ionicons name="calendar-outline" size={20} color={theme.colors.primary} style={styles.calendarIcon} />
      <Text style={styles.dateText}>{format(today, 'MMMM d, yyyy')}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.card,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderRadius: 12,
    marginBottom: theme.spacing.sm,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
    marginLeft: 8,
  },
  calendarIcon: { marginRight: 4 },
});

export default DiaryHeaderToday;

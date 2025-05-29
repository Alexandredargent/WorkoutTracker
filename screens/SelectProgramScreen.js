import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ImageBackground, ActivityIndicator, Alert, StyleSheet, Image } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { fetchUserPrograms } from '../services/firebaseExerciseService';
import { applyProgramToDate } from '../services/diaryService';
import { auth } from '../services/firebase';
import theme from '../styles/theme';
import { getMuscleIcon } from '../utils/muscleIcons';

const SelectProgramScreen = () => {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();
  const route = useRoute();
  const { selectedDate } = route.params;

  useEffect(() => {
    const loadPrograms = async () => {
      try {
        const userId = auth.currentUser.uid;
        const { programList } = await fetchUserPrograms(userId);
        setPrograms(programList);
      } catch (e) {
        console.error(e);
        Alert.alert('Error', 'Could not load programs');
      } finally {
        setLoading(false);
      }
    };

    loadPrograms();
  }, []);

  const handleSelectProgram = async (program) => {
    try {
      const userId = auth.currentUser.uid;
      await applyProgramToDate(userId, selectedDate, program);
      Alert.alert('Success', 'Program applied to diary.');
      navigation.goBack();
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Could not apply program');
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" color={theme.colors.primary} />;
  }

  return (
    <ImageBackground
      source={theme.backgroundImage.source}
      resizeMode={theme.backgroundImage.defaultResizeMode}
      style={styles.background}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Select a Program to Apply</Text>
        <FlatList
          data={programs}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.programItem}
              onPress={() =>
                navigation.navigate('ProgramDetailScreen', {
                  programId: item.id,
                  programName: item.name,
                  fromSelect: true,
                  selectedDate,
                })
              }
            >
              <View style={styles.iconRow}>
                {item.muscleGroups && item.muscleGroups.length > 0 ? (
                  item.muscleGroups.slice(0, 3).map((muscleGroup, idx) => (
                    <Image
                      key={muscleGroup}
                      source={getMuscleIcon(muscleGroup)}
                      style={[styles.muscleIcon, { marginRight: idx < 2 ? 4 : 0 }]}
                      resizeMode="contain"
                    />
                  ))
                ) : (
                  <Image
                    source={getMuscleIcon('Default')}
                    style={styles.muscleIcon}
                    resizeMode="contain"
                  />
                )}
              </View>
              <Text style={styles.programName}>{item.name}</Text>
              <Text style={styles.programExercises}>{item.exercises?.length || 0} exercises</Text>
            </TouchableOpacity>
          )}
        />
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  background: {
    flex: 1,
    backgroundColor: '#101924',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: theme.spacing.md,
  },
  programItem: {
    backgroundColor: theme.colors.card,
    padding: theme.spacing.md,
    borderRadius: 12,
    marginBottom: theme.spacing.sm,
    width: 200, // Remove the quotes
    alignItems: 'center',
  },
  programName: {
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '600',
    color: theme.colors.text,
  },
  programExercises: {
    fontSize: 14,
    color: theme.colors.muted,
    marginTop: 4,
    textAlign: 'center',
  },
  iconRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  muscleIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
});

export default SelectProgramScreen;

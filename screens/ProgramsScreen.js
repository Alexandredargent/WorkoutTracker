// d:\Applications\WorkoutTracker\screens\ProgramsScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, FlatList, ActivityIndicator, Alert, TextInput, Image } from 'react-native';
import theme from '../styles/theme';
import { fetchUserPrograms, fetchPublicPrograms, deleteUserProgram, toggleFavoriteProgram, fetchFavoritePrograms } from '../services/firebaseExerciseService.js'; // Import Firebase functions
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../services/firebase';
import { useFocusEffect } from '@react-navigation/native';
import { ImageBackground } from 'react-native';
import { getMuscleIcon } from '../utils/muscleIcons';

const ProgramsScreen = ({ navigation }) => {
  const [programs, setPrograms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [favoritePrograms, setFavoritePrograms] = useState([]);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      setUserId(currentUser.uid);
    }
  }, []);

  const loadPrograms = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      let programList = [];
      
      if (filter === 'all') {
        // Load both user programs and public programs
        const { programList: userPrograms } = await fetchUserPrograms(userId);
        const { programList: publicPrograms } = await fetchPublicPrograms();
        
        // Mark user programs and combine
        const markedUserPrograms = userPrograms.map(program => ({ ...program, isUserCreated: true }));
        const markedPublicPrograms = publicPrograms.map(program => ({ ...program, isUserCreated: false }));
        
        programList = [...markedUserPrograms, ...markedPublicPrograms];
      } else if (filter === 'created') {
        // Load only user-created programs
        const { programList: userPrograms } = await fetchUserPrograms(userId);
        programList = userPrograms.map(program => ({ ...program, isUserCreated: true }));
      } else if (filter === 'favorites') {
        // Load favorite programs
        const { programList: favPrograms } = await fetchFavoritePrograms(userId);
        programList = favPrograms;
      }

      setPrograms(programList);
      
      // Load favorite program IDs for heart icons
      if (filter !== 'favorites') {
        const { programList: favPrograms } = await fetchFavoritePrograms(userId);
        setFavoritePrograms(favPrograms.map(p => p.id));
      }
    } catch (error) {
      console.error("Failed to fetch programs:", error);
      Alert.alert("Error", "Unable to load programs.");
    } finally {
      setIsLoading(false);
    }
  }, [userId, filter]);

  // useFocusEffect to reload data when screen comes to foreground
  useFocusEffect(
    useCallback(() => {
      if (userId) {
        loadPrograms();
      }
    }, [userId, loadPrograms])
  );

  const handleCreateProgram = () => {
    navigation.navigate('CreateProgramScreen');
  };

  const handleDeleteProgram = async (programId, isUserCreated) => {
    if (!isUserCreated) {
      Alert.alert("Error", "You can only delete programs you created.");
      return;
    }

    Alert.alert(
      "Delete Program",
      "Are you sure you want to delete this program?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteUserProgram(userId, programId);
              setPrograms(prevPrograms => prevPrograms.filter(p => p.id !== programId));
              Alert.alert("Success", "Program deleted.");
            } catch (error) {
              console.error("Failed to delete program:", error);
              Alert.alert("Error", "Unable to delete program.");
            }
          },
        },
      ]
    );
  };

  const handleToggleFavorite = async (programId, isCurrentlyFavorite) => {
    try {
      await toggleFavoriteProgram(userId, programId, !isCurrentlyFavorite);
      
      if (isCurrentlyFavorite) {
        setFavoritePrograms(prev => prev.filter(id => id !== programId));
        if (filter === 'favorites') {
          setPrograms(prev => prev.filter(p => p.id !== programId));
        }
      } else {
        setFavoritePrograms(prev => [...prev, programId]);
      }
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
      Alert.alert("Error", "Unable to update favorite status.");
    }
  };

  const applyFilters = (data) => {
    let filtered = [...data];

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(program => 
        program.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (program.description && program.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Sort by name for consistency
    filtered = filtered.sort((a, b) => a.name.localeCompare(b.name));

    return filtered;
  };

  const renderProgramItem = ({ item }) => {
    const isUserCreated = item.isUserCreated;
    const isFavorite = favoritePrograms.includes(item.id);
    
    return (
      <TouchableOpacity 
        style={styles.programItem} 
        onPress={() => navigation.navigate('ProgramDetailScreen', { programId: item.id, programName: item.name })}
      >
        <View style={styles.itemContent}>
          {/* Muscle group icons - fixed positioning */}
          <View style={styles.muscleGroupIcons}>
            {item.muscleGroups && item.muscleGroups.length > 0 ? (
              item.muscleGroups.slice(0, 3).map((muscleGroup, index) => (
                <Image
                  key={muscleGroup}
                  source={getMuscleIcon(muscleGroup)}
                  style={[
                    styles.muscleGroupIcon,
                    { marginRight: index < 2 ? 4 : 0 } // Small gap between icons
                  ]}
                  resizeMode="contain"
                />
              ))
            ) : (
              <View style={styles.defaultIconContainer}>
                <Ionicons name="fitness-outline" size={24} color={theme.colors.primary} />
              </View>
            )}
          </View>
          
          {/* Program content - with proper margin */}
          <View style={styles.programItemContent}>
            {/* Header with name and badges */}
            <View style={styles.programHeader}>
              <Text style={styles.programName} numberOfLines={1}>{item.name}</Text>
              <View style={styles.programBadges}>
                {!isUserCreated && (
                  <View style={styles.publicBadge}>
                    <Text style={styles.publicBadgeText}>Public</Text>
                  </View>
                )}
                {isUserCreated && (
                  <View style={styles.createdBadge}>
                    <Text style={styles.createdBadgeText}>Created</Text>
                  </View>
                )}
              </View>
            </View>
            
            {/* Description */}
            {!!item.description && (
              <Text style={styles.programDescription} numberOfLines={2}>
                {item.description}
              </Text>
            )}
            
            {/* Stats row */}
            <View style={styles.programStats}>
              <View style={styles.tag}>
                <Text style={styles.tagText}>{item.exercises?.length || 0} exercises</Text>
              </View>
              
              {/* Muscle group tags - simplified */}
              {item.muscleGroups && item.muscleGroups.length > 0 && (
                <View style={styles.muscleGroupTags}>
                  {item.muscleGroups.slice(0, 2).map((muscleGroup) => (
                    <View key={muscleGroup} style={styles.muscleGroupTag}>
                      <Text style={styles.muscleGroupTagText}>{muscleGroup}</Text>
                    </View>
                  ))}
                  {item.muscleGroups.length > 2 && (
                    <View style={styles.muscleGroupTag}>
                      <Text style={styles.muscleGroupTagText}>+{item.muscleGroups.length - 2}</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
            
            {/* Author info if applicable */}
            {item.author && !isUserCreated && (
              <Text style={styles.authorText}>by {item.author}</Text>
            )}
          </View>
        </View>
        
        {/* Action buttons */}
        <View style={styles.programActions}>
          <TouchableOpacity 
            onPress={() => handleToggleFavorite(item.id, isFavorite)} 
            style={styles.favoriteButton}
          >
            <Ionicons 
              name={isFavorite ? "heart" : "heart-outline"} 
              size={24} 
              color={isFavorite ? theme.colors.error : theme.colors.muted} 
            />
          </TouchableOpacity>
          {isUserCreated && (
            <TouchableOpacity 
              onPress={() => handleDeleteProgram(item.id, isUserCreated)} 
              style={styles.deleteButton}
            >
              <Ionicons name="trash-outline" size={24} color={theme.colors.error} />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderTabButton = (tabName, label) => (
    <TouchableOpacity
      onPress={() => setFilter(tabName)}
      style={[styles.tab, filter === tabName && styles.activeTab]}
    >
      <Text style={[styles.tabText, filter === tabName && styles.activeTabText]}>{label}</Text>
    </TouchableOpacity>
  );

  const filteredPrograms = applyFilters(programs);

  const getEmptyStateText = () => {
    if (searchQuery.trim()) {
      return 'No programs found matching your search.';
    }
    
    switch (filter) {
      case 'favorites':
        return 'You haven\'t favorited any programs yet. Browse programs and tap the heart icon to add them to favorites.';
      case 'created':
        return 'You haven\'t created any programs yet. Tap \'+\' to create your first program.';
      default:
        return 'No programs available. Tap \'+\' to create your first program.';
    }
  };

 

  return (
    <ImageBackground
    source={theme.backgroundImage.source}
    resizeMode={theme.backgroundImage.defaultResizeMode}
    style={{ flex: 1 }}
  >
    <SafeAreaView style={styles.container}>
      {/* Search and Add Button Container */}
      <View style={styles.searchAddContainer}>
        <TextInput
          style={styles.searchBar}
          placeholder="Search programs..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={theme.colors.muted}
        />
        <TouchableOpacity
          style={styles.addProgramButton}
          onPress={handleCreateProgram}
        >
          <Ionicons name="add-circle-outline" size={24} color="white" />
          <Text style={styles.addProgramButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {renderTabButton('all', 'All')}
        {renderTabButton('favorites', 'Favorites')}
        {renderTabButton('created', 'Created')}
      </View>

      {/* Programs List */}
      {filteredPrograms.length === 0 ? (
        <View style={styles.content}>
          <Ionicons name="fitness-outline" size={64} color={theme.colors.muted} />
          <Text style={styles.placeholderText}>
            {getEmptyStateText()}
          </Text>
          {(filter === 'created' || filter === 'all') && !searchQuery.trim() && (
            <TouchableOpacity style={styles.createFirstButton} onPress={handleCreateProgram}>
              <Text style={styles.createFirstButtonText}>Create Your First Program</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredPrograms}
          renderItem={renderProgramItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContentContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
    

    </ImageBackground>
    
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  searchAddContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  searchBar: {
    flex: 1,
    height: 45,
    borderColor: theme.colors.primary,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: theme.spacing.md,
    marginRight: theme.spacing.md,
    backgroundColor: theme.colors.card,
    fontSize: 16,
    color: theme.colors.text,
  },
  addProgramButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.sm + 2,
    paddingHorizontal: theme.spacing.md,
    borderRadius: 20,
    height: 45,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  addProgramButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  tabs: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.card,
    borderRadius: 25,
    marginHorizontal: theme.spacing.lg,
    padding: theme.spacing.xs + 1,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  tab: {
    flex: 1,
    paddingVertical: theme.spacing.sm + 2,
    alignItems: 'center',
    borderRadius: 20,
  },
  activeTab: {
    backgroundColor: theme.colors.primary,
  },
  tabText: {
    fontSize: 16,
    color: theme.colors.primary,
  },
  activeTabText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  placeholderText: {
    fontSize: 16,
    color: theme.colors.muted,
    textAlign: 'center',
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    lineHeight: 22,
  },
  createFirstButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.button.borderRadius,
  },
  createFirstButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  listContentContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },

  // IMPROVED PROGRAM ITEM STYLES:
  programItem: {
    backgroundColor: '#ffff',
    padding: theme.spacing.md,
    borderRadius: theme.card.borderRadius,
    marginBottom: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start', // Changed from 'center' to 'flex-start'
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
    minHeight: 80, // Ensure minimum height
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'flex-start', // Changed alignment
    flex: 1,
  },
  
  // MUSCLE GROUP ICONS:
  muscleGroupIcons: {
    flexDirection: 'row',
    marginRight: theme.spacing.md,
    alignItems: 'center',
    width: 120, // Width for 3 icons side by side
    height: 40,
  },
  muscleGroupIcon: {
    width: 32, // Slightly smaller to fit 3
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: theme.colors.background,
  },
  defaultIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  
  // PROGRAM CONTENT - ensure proper spacing:
  programItemContent: {
    flex: 1,
    justifyContent: 'flex-start',
    marginLeft: 0, // Reset any margin that might cause overlap
  },
  programHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4, // Reduced spacing
  },
  programName: {
    fontSize: 16, // Slightly smaller
    fontWeight: 'bold',
    color: theme.colors.text,
    flex: 1, // Take available space
    marginRight: theme.spacing.sm,
  },
  programDescription: {
    fontSize: 13,
    color: theme.colors.muted,
    marginBottom: theme.spacing.xs,
    lineHeight: 18,
  },
  
  // BADGES:
  programBadges: {
    flexDirection: 'row',
    gap: 4,
  },
  publicBadge: {
    backgroundColor: '#6c757d',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  publicBadgeText: {
    color: 'white',
    fontSize: 9,
    fontWeight: 'bold',
  },
  createdBadge: {
    backgroundColor: '#28a745',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  createdBadgeText: {
    color: 'white',
    fontSize: 9,
    fontWeight: 'bold',
  },
  
  // STATS AND TAGS:
  programStats: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap', // Allow wrapping
    gap: 6, // Consistent spacing
  },
  tag: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  tagText: {
    fontSize: 11,
    color: 'white',
    fontWeight: 'bold',
  },
  muscleGroupTags: {
    flexDirection: 'row',
    gap: 4,
    flexWrap: 'wrap',
  },
  muscleGroupTag: {
    backgroundColor: theme.colors.primary + '20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.primary + '40',
  },
  muscleGroupTagText: {
    color: theme.colors.primary,
    fontSize: 9,
    fontWeight: '500',
  },
  
  // AUTHOR:
  authorText: {
    fontSize: 11,
    color: theme.colors.muted,
    fontStyle: 'italic',
    marginTop: 4,
  },
  
  // ACTIONS:
  programActions: {
    flexDirection: 'column', // Stack vertically for better layout
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginLeft: theme.spacing.sm,
  },
  favoriteButton: {
    padding: theme.spacing.sm,
  },
  deleteButton: {
    padding: theme.spacing.sm,
  },
});

export default ProgramsScreen;

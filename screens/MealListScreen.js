import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, SafeAreaView, StatusBar, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { fetchMeals, addUserMeal, fetchUserMeals, deleteUserMeal } from '../services/firebaseMealService.js';
import { addMealToDiary } from '../services/diaryService';
import { auth } from '../services/firebase';
import { Ionicons } from '@expo/vector-icons';
import theme from '../styles/theme';
import { Modal, TextInput } from 'react-native';

const MealListScreen = ({ navigation, route }) => {
  const [meals, setMeals] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { date } = route.params;
  const [modalVisible, setModalVisible] = useState(false);
  const [newIngredient, setNewIngredient] = useState({
  name: '',
  calories: '',
  carbs: '',
  lipids: '',
  proteins: '',
  });

  const loadMeals = useCallback(async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      let userMeals = [];
      if (user) {
        userMeals = await fetchUserMeals(user.uid);
      }
      const globalMeals = await fetchMeals();
      // Merge and remove duplicates by name (or id if you prefer)
      const allMeals = [
        ...userMeals,
        ...globalMeals.filter(gm => !userMeals.some(um => um.name === gm.name))
      ];
      setMeals(allMeals);
    } catch (error) {
      console.error('Error fetching meals:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMeals();
  }, [loadMeals]);


  const getFilteredMeals = useCallback(() => {
    let filtered = [...meals];

    if (filter === 'created') {
      const user = auth.currentUser;
      if (user) {
        filtered = filtered.filter(meal => meal.uid === user.uid);
      } else {
        filtered = [];
      }
    }

    if (searchQuery.trim() !== '') {
      filtered = filtered.filter(meal =>
        meal.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return filtered;
  }, [meals, filter, searchQuery]);

  const handleAddMeal = async (meal) => {
    const user = auth.currentUser;
    if (user) {
      try {
        await addMealToDiary(user.uid, date, meal);
        console.log('Meal added successfully');
        navigation.goBack();
      } catch (error) {
        console.error('Error adding meal:', error);
      }
    } else {
      console.log('No user is signed in.');
    }
  };

  const renderMealItem = ({ item }) => {
    const user = auth.currentUser;
    const isCreatedByUser = item.uid === user?.uid;

    const handleDelete = () => {
      Alert.alert(
        "Delete Meal",
        "Are you sure you want to delete this meal?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              try {
                await deleteUserMeal(user.uid, item.id);
                setMeals(prev => prev.filter(meal => meal.id !== item.id));
              } catch (error) {
                alert('Failed to delete meal.');
              }
            }
          }
        ]
      );
    };

    return (
      <TouchableOpacity
        style={styles.item}
        onPress={() => handleAddMeal(item)}
      >
        <View style={styles.itemContent}>
          <Ionicons name="restaurant-outline" size={24} color={theme.colors.primary} style={styles.itemIcon} />
          <View style={styles.itemTextContainer}>
            <Text style={styles.itemText}>{item.name}</Text>
            <Text style={styles.caloriesText}>{item.calories} calories</Text>
            <Text style={styles.caloriesText}>{item.carbs} carbs</Text>
            <Text style={styles.caloriesText}>{item.lipids} lipids</Text>
            <Text style={styles.caloriesText}>{item.proteins} proteins</Text>
            {item.isPopular && <Text style={styles.popularTag}>Popular</Text>}
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="add-circle-outline" size={24} color={theme.colors.primary} />
          {isCreatedByUser && (
            <TouchableOpacity onPress={handleDelete} style={{ marginLeft: 12 }}>
              <Ionicons name="trash-outline" size={24} color="red" />
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.topButtonsContainer}>
        <TouchableOpacity
          style={styles.scanButton}
          onPress={() => navigation.navigate('BarcodeScannerScreen', { date })}
        >
          <Ionicons name="scan-outline" size={24} color="white" />
          <Text style={styles.scanButtonText}>Scan</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add-circle-outline" size={24} color="white" />
          <Text style={styles.addButtonText}>Add Meal</Text>
        </TouchableOpacity>
      </View>

        <Modal
  visible={modalVisible}
  animationType="fade"
  transparent={true}
>
  <View style={styles.modalContainer}>
    <View style={styles.modalContent}>
      <Text style={styles.modalTitle}>New Meal</Text>
      {['name', 'calories', 'carbs', 'lipids', 'proteins'].map((field) => (
        <TextInput
          key={field}
          placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
          value={newIngredient[field]}
          onChangeText={(value) => setNewIngredient({ ...newIngredient, [field]: value })}
          keyboardType={field === 'name' ? 'default' : 'numeric'}
          style={styles.input}
        />
      ))}

      <View style={styles.modalButtons}>
        <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalCancel}>
          <Text style={styles.modalButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={async () => {
            if (!newIngredient.name.trim()) {
              alert('Please enter an ingredient name.');
              return;
            }
            try {
              const user = auth.currentUser;
if (user) {
  const mealToSave = {
    ...newIngredient,
    calories: parseFloat(newIngredient.calories) || 0,
    carbs: parseFloat(newIngredient.carbs) || 0,
    lipids: parseFloat(newIngredient.lipids) || 0,
    proteins: parseFloat(newIngredient.proteins) || 0,
    isPopular: false,
    date: new Date().toISOString(),
    uid: user.uid, // Now user is defined!
  };
  await addUserMeal(user.uid, mealToSave);
} else {
  alert('You must be signed in to add an ingredient.');
  return;
}
              await loadMeals(); // Refresh the list
              setModalVisible(false);
              setNewIngredient({ name: '', calories: '', carbs: '', lipids: '', proteins: '' });
            } catch (error) {
              console.error('Error saving new ingredient:', error);
              alert('Failed to save ingredient. Please try again.');
            }
          }}
          style={styles.modalSave}
        >
          <Text style={styles.modalButtonText}>Save</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
</Modal>
      <TextInput
        style={styles.searchInput}
        placeholder="Search meals..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholderTextColor={theme.colors.muted}
      />
      <View style={styles.tabs}>
        {renderTabButton('all', 'All Meals')}
        {renderTabButton('created', 'Created')}
      </View>

      <FlatList
        data={getFilteredMeals()}
        keyExtractor={(item) => item.id}
        renderItem={renderMealItem}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  topButtonsContainer: {
    flexDirection: 'row',
    // justifyContent: 'space-around', // No longer needed as flex:1 on children and gap will manage distribution
    alignItems: 'center',
    marginTop: theme.spacing.md,
    paddingHorizontal: theme.spacing.md, // Add padding to the container for side spacing
    gap: theme.spacing.md, // Add gap between buttons
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  searchInput: {
    height: 45,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: 25,
    marginTop: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    fontSize: 16,
  },
  tabs: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.card,
    borderRadius: 25,
    margin: theme.spacing.lg,
    padding: theme.spacing.xs,
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
  listContent: {
    paddingHorizontal: theme.spacing.lg,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.card,
    borderRadius: 10,
    marginBottom: theme.spacing.sm,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemIcon: {
    marginRight: theme.spacing.md,
  },
  itemTextContainer: {
    flex: 1,
  },
  itemText: {
    fontSize: 18,
    color: theme.colors.text,
  },
  caloriesText: {
    fontSize: 14,
    color: theme.colors.muted,
    marginTop: 2,
  },
  popularTag: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: 'bold',
    marginTop: 4,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center', // Add this to center content horizontally
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: 25,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
    // marginTop: theme.spacing.md, // Removed to be handled by topButtonsContainer
    flex: 1, // Make button take equal width
  },
  scanButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  addButton: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center', // Add this to center content horizontally
  backgroundColor: theme.colors.primary,
  paddingVertical: theme.spacing.lg,
  paddingHorizontal: theme.spacing.lg,
  borderRadius: 25,
  shadowColor: theme.colors.shadow,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.2,
  shadowRadius: 3,
  elevation: 4,
  // marginTop: theme.spacing.md, // Removed to be handled by topButtonsContainer
  flex: 1, // Make button take equal width
},
addButtonText: {
  color: 'white',
  fontSize: 16,
  fontWeight: 'bold',
  marginLeft: 8,
},
modalContainer: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: 'rgba(0,0,0,0.5)',
},
modalContent: {
  width: '90%',
  backgroundColor: '#fff',
  borderRadius: 10,
  padding: 20,
  elevation: 5,
},
modalTitle: {
  fontSize: 20,
  fontWeight: 'bold',
  marginBottom: 10,
},
input: {
  borderBottomWidth: 1,
  borderColor: '#ccc',
  paddingVertical: 8,
  marginBottom: 10,
},
modalButtons: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginTop: 20,
},
modalCancel: {
  backgroundColor: '#ccc',
  padding: 10,
  borderRadius: 5,
  flex: 1,
  marginRight: 5,
},
modalSave: {
  backgroundColor: theme.colors.primary,
  padding: 10,
  borderRadius: 5,
  flex: 1,
  marginLeft: 5,
},
modalButtonText: {
  color: 'white',
  textAlign: 'center',
  fontWeight: 'bold',
},

});

export default MealListScreen;

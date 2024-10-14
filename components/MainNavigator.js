import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '../screens/HomeScreen'; 
import AddWorkoutScreen from '../screens/AddWorkoutScreen';
import AddMealScreen from '../screens/AddMealScreen';
import DiaryScreen from '../screens/DiaryScreen';
import AccountScreen from '../screens/AccountScreen'; // Importez l'écran de gestion du compte
import { signOut } from 'firebase/auth';
import { auth } from '../services/firebase'; // Assurez-vous d'importer Firebase

const Tab = createBottomTabNavigator();

const MainNavigator = ({ user, setUser, navigation }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const handleLogout = async () => {
        try {
            await auth.signOut(); // Méthode correcte pour déconnecter           
            console.log("User logged out");
            navigation.navigate('Login'); // Rediriger vers la page de connexion
        } catch (error) {
            console.error("Erreur de déconnexion : ", error.message);
        }
    };
    
    return (
        <View style={styles.container}>
            {/* Icône de profil en haut à droite */}
            <TouchableOpacity style={styles.profileIcon} onPress={toggleMenu}>
                <Ionicons name="person-circle-outline" size={30} color="black" />
            </TouchableOpacity>
            
            {/* Menu déroulant */}
            {isMenuOpen && (
                <View style={styles.menuContainer}>
                    <TouchableOpacity onPress={() => {
                        toggleMenu();
                        navigation.navigate('Account'); // Naviguer vers l'écran du compte
                    }}>
                        <Text style={styles.menuItem}>Gérer le Profil</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleLogout}>
                        <Text style={styles.menuItem}>Déconnexion</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Navigation par onglets */}
            <Tab.Navigator
                screenOptions={({ route }) => ({
                    tabBarIcon: ({ focused, color, size }) => {
                        let iconName;
                        if (route.name === 'Home') {
                            iconName = focused ? 'home' : 'home-outline';
                        } else if (route.name === 'AddWorkout') {
                            iconName = focused ? 'barbell' : 'barbell-outline';
                        } else if (route.name === 'AddMeal') {
                            iconName = focused ? 'fast-food' : 'fast-food-outline';
                        } else if (route.name === 'Diary') {
                            iconName = focused ? 'calendar' : 'calendar-outline';
                        }

                        return <Ionicons name={iconName} size={size} color={color} />;
                    },
                    tabBarActiveTintColor: '#3498db',
                    tabBarInactiveTintColor: 'gray',
                })}
            >
                <Tab.Screen name="Home" component={HomeScreen} />
                <Tab.Screen name="AddWorkout" component={AddWorkoutScreen} />
                <Tab.Screen name="AddMeal" component={AddMealScreen} />
                <Tab.Screen name="Diary" component={DiaryScreen} />
            </Tab.Navigator>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    profileIcon: {
        position: 'absolute',
        top: 40,
        right: 20,
        zIndex: 1,
    },
    menuContainer: {
        position: 'absolute',
        top: 80,
        right: 20,
        backgroundColor: 'white',
        padding: 10,
        borderRadius: 5,
        elevation: 5,
        zIndex: 10,
    },
    menuItem: {
        paddingVertical: 10,
        fontSize: 16,
    },
});

export default MainNavigator;

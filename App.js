import React, { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MainNavigator from './components/MainNavigator';
import LoginScreen from './screens/LoginScreen';
import SignUpScreen from './screens/SignUpScreen';
import FitnessProfileScreen from './screens/FitnessProfileScreen';
import GoalScreen from './screens/GoalScreen'; 
import AccountScreen from './screens/AccountScreen';
import ExerciseListScreen from './screens/ExerciseListScreen';
import MealListScreen from './screens/MealListScreen';
import { auth } from './services/firebase';
import { onAuthStateChanged } from 'firebase/auth';

const Stack = createNativeStackNavigator();

export default function App() {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);

    return (
        <NavigationContainer>
            <Stack.Navigator 
                initialRouteName={user ? "Main" : "Login"}
                screenOptions={{
                    animation: 'fade',
                    animationDuration: 300,
                }}
            >
                <Stack.Screen 
                    name="Login" 
                    options={{ headerShown: false }} 
                >
                    {props => <LoginScreen {...props} setUser={setUser} />} 
                </Stack.Screen>
                <Stack.Screen 
                    name="SignUp" 
                    options={{ headerShown: false }} 
                >
                    {props => <SignUpScreen {...props} setUser={setUser} />}
                </Stack.Screen>
                <Stack.Screen 
                    name="FitnessProfileScreen" 
                    component={FitnessProfileScreen} 
                    options={{ 
                        headerShown: false,
                        animation: Platform.OS === 'ios' ? 'default' : 'none'
                    }} 
                />
                <Stack.Screen 
                    name="GoalScreen" 
                    component={GoalScreen} 
                    options={{ title: 'Set Your Goal', headerShown: false }} 
                />
                <Stack.Screen 
                    name="Main" 
                    component={MainNavigator} 
                    options={{ headerShown: false }} 
                />        
                <Stack.Screen 
                    name="Account" 
                    component={AccountScreen} 
                    options={{ title: 'Account Settings' }} 
                />
                <Stack.Screen 
                    name="ExerciseListScreen" 
                    component={ExerciseListScreen} 
                    options={{ title: 'Exercises' }}
                />
                <Stack.Screen 
                    name="MealListScreen" 
                    component={MealListScreen} 
                    options={{ title: 'Meals' }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
}
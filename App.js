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
import BarcodeScannerScreen from './screens/BarcodeScannerScreen';
import MessagesScreen from './screens/MessagesScreen';
import CreateProgramScreen from './screens/CreateProgramScreen';
import NotificationScreen from './screens/NotificationScreen';
import ChatScreen from './screens/ChatScreen';
import { auth } from './services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import ProgramDetailScreen from './screens/ProgramDetailScreen';


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
                    <Stack.Screen 
                        name="BarcodeScannerScreen" 
                        component={BarcodeScannerScreen} 
                        options={{ title: 'Barcode Scanner' }}
                    />
                    <Stack.Screen 
                        name="MessagesScreen" 
                        component={MessagesScreen} 
                        options={{ title: 'Messages' }}
                    />
                    <Stack.Screen 
                        name="NotificationScreen" 
                        component={NotificationScreen} 
                        options={{ title: 'Notification' }}
                    />
                    <Stack.Screen 
                        name="ChatScreen" 
                        component={ChatScreen} 
                        options={{ title: 'Chat' }}
                    />
                    <Stack.Screen 
                        name="CreateProgramScreen" 
                        component={CreateProgramScreen} 
                        options={{ title: 'Create Program' }}
                    />
                    <Stack.Screen 
                        name="ProgramDetailScreen" 
                        component={ProgramDetailScreen} 
                        options={{ title: 'Detail Program' }}
                    />
                    
                </Stack.Navigator>
            </NavigationContainer>
       
    );
}

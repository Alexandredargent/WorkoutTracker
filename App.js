import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MainNavigator from './components/MainNavigator';
import LoginScreen from './screens/LoginScreen'; 
import SignUpScreen from './screens/SignUpScreen'; 
import AccountScreen from './screens/AccountScreen'; 
import { auth } from './services/firebase'; // Importez votre configuration Firebase
import { onAuthStateChanged } from 'firebase/auth';

const Stack = createNativeStackNavigator();

export default function App() {
    const [user, setUser] = useState(null); // État de l'utilisateur

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);

    return (
        <NavigationContainer>
            <Stack.Navigator initialRouteName={user ? "Main" : "Login"}>
                <Stack.Screen 
                    name="Login" 
                    options={{ title: 'Se connecter', headerShown: false }} 
                >
                    {props => <LoginScreen {...props} setUser={setUser} />} 
                </Stack.Screen>
                <Stack.Screen 
                    name="SignUp" 
                    options={{ title: 'Créer un compte', headerShown: false }} 
                >
                    {props => <SignUpScreen {...props} setUser={setUser} />}
                </Stack.Screen>
                <Stack.Screen 
                    name="Main" 
                    component={MainNavigator} 
                    options={{ headerShown: false }} 
                />        
               <Stack.Screen 
                 name="Account" 
                 component={AccountScreen} 
                 options={{ title: 'Gestion du Compte' }} 
               />

            </Stack.Navigator>
        </NavigationContainer>
    );
}

import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet, Alert } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase'; // Assurez-vous d'importer votre configuration Firebase

const LoginScreen = ({ navigation, setUser }) => { // Ajout de setUser ici
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async () => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            setUser(userCredential.user);
            
            navigation.navigate('Main');
        } catch (error) {
            Alert.alert('Erreur de connexion', error.message);
        }
    };
    

    return (
        <View style={styles.container}>
            <TextInput
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                style={styles.input}
            />
            <TextInput
                placeholder="Mot de passe"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                style={styles.input}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Button title="Se connecter" onPress={handleLogin} />
            <Text style={styles.link} onPress={() => navigation.navigate('SignUp')}>
                Créer un compte
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', padding: 16 },
    input: { height: 40, borderColor: 'gray', borderWidth: 1, marginBottom: 12, paddingLeft: 8 },
    error: { color: 'red' },
    link: { color: 'blue', marginTop: 12, textAlign: 'center' },
});

export default LoginScreen;

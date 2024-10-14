// AccountScreen.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const AccountScreen = () => {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Gestion du Compte</Text>
            {/* Ajoutez ici des options pour gérer le compte */}
            <Text style={styles.option}>Modifier le profil</Text>
            <Text style={styles.option}>Paramètres de sécurité</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    title: { fontSize: 24, fontWeight: 'bold' },
    option: { marginVertical: 10, fontSize: 18 },
});

export default AccountScreen;

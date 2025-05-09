import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { auth, db } from '../services/firebase';
import { doc, getDoc, collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

const AccountScreen = () => {
  const [user, setUser] = useState(null);
  const [userInfo, setUserInfo] = useState({});
  const [lastWeight, setLastWeight] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const currentUser = auth.currentUser;
        if (currentUser) {
          setUser(currentUser);
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            setUserInfo(userDoc.data());
          } else {
            console.log('User document does not exist');
          }

          // Fetch the latest weight entry
          const weightQuery = query(
            collection(db, 'diaryEntries'),
            where('userId', '==', currentUser.uid),
            where('type', '==', 'weight'),
            orderBy('date', 'desc'),
            limit(1)
          );
          const weightSnapshot = await getDocs(weightQuery);
          if (!weightSnapshot.empty) {
            const weightData = weightSnapshot.docs[0].data();
            setLastWeight(weightData.weight);
          } else {
            console.log('No weight entries found, using initial weight');
            setLastWeight(userDoc.data().weight);
          }
        } else {
          console.log('No user is signed in');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#232799" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Account Management</Text>
      {user ? (
        <View style={styles.userInfo}>
          <Text style={styles.option}>Username: {userInfo.username}</Text>
          <Text style={styles.option}>Gender: {user.gender}</Text>
          <Text style={styles.option}>Email: {user.email}</Text>
          <Text style={styles.option}>Age: {userInfo.age}</Text>
          <Text style={styles.option}>Weight: {lastWeight !== null ? `${lastWeight} kg` : 'N/A'}</Text>
          <Text style={styles.option}>Size: {userInfo.height} cm</Text>
        </View>
      ) : (
        <Text style={styles.option}>No user connected</Text>
      )}
      <Text style={styles.option}>Modifier le profil</Text>
      <Text style={styles.option}>Paramètres de sécurité</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold' },
  userInfo: { marginVertical: 20 },
  option: { marginVertical: 10, fontSize: 18 },
});

export default AccountScreen;
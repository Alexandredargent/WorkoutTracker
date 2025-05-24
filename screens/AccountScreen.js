import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Modal, TouchableOpacity, Button, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { auth, db } from '../services/firebase';
import { doc, getDoc, updateDoc, collection, query, where, orderBy, limit, getDocs, deleteDoc } from 'firebase/firestore';

import theme from '../styles/theme';
import { calculateAge } from '../utils/date';

const GOALS = [
  { value: 'gain_weight', label: 'Gain Weight' },
  { value: 'lose_weight', label: 'Lose Weight' },
  { value: 'maintain_weight', label: 'Maintain Weight' },
];
const ACTIVITY_LEVELS = [
  { value: 'sedentary', label: 'Sedentary (no sport)' },
  { value: 'light', label: 'Light (1–3 times/week)' },
  { value: 'moderate', label: 'Moderate (3–5 times/week)' },
  { value: 'intense', label: 'Intense (6–7 times/week)' },
  { value: 'very_intense', label: 'Very intense (physical job or 2x training)' },
];

const AccountScreen = () => {
  const [user, setUser] = useState(null);
  const [userInfo, setUserInfo] = useState({});
  const [lastWeight, setLastWeight] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [editGoal, setEditGoal] = useState('');
  const [editActivity, setEditActivity] = useState('');

  

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

  const handleOpenModal = () => {
    setEditGoal(userInfo.goal || '');
    setEditActivity(userInfo.activityLevel || '');
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        goal: editGoal,
        activityLevel: editActivity,
      });
      setUserInfo({ ...userInfo, goal: editGoal, activityLevel: editActivity });
      setModalVisible(false);
    } catch (e) {
      alert('Failed to update profile');
    }
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete user document from Firestore
              await deleteDoc(doc(db, 'users', user.uid));
              // Optionally: delete user's diary entries, etc.
              // Delete Firebase Auth user
              await auth.currentUser.delete();
              // Optionally: navigate to login screen or show a message
            } catch (error) {
              alert('Failed to delete account. Please re-login and try again.');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{userInfo.username}</Text>
      {user ? (
        <View style={styles.userInfo}>
          <Text style={styles.option}>         
          </Text>
          <Text style={styles.option}>
            Gender: <Text style={styles.value}>{user.gender}</Text>
          </Text>
          <Text style={styles.option}>
            Email: <Text style={styles.value}>{user.email}</Text>
          </Text>
          <Text style={styles.option}>
            Age: <Text style={styles.value}>{calculateAge(userInfo.dateOfBirth)}</Text>
          </Text>
          <Text style={styles.option}>
            Date of Birth: <Text style={styles.value}>{userInfo.dateOfBirth}</Text>
          </Text>
          <Text style={styles.option}>
            Weight: <Text style={styles.value}>{lastWeight !== null ? `${lastWeight} kg` : 'N/A'}</Text>
          </Text>
          <Text style={styles.option}>
            Size: <Text style={styles.value}>{userInfo.height} cm</Text>
          </Text>
          <Text style={styles.option}>
            Goal: <Text style={styles.value}>{GOALS.find(g => g.value === userInfo.goal)?.label || ''}</Text>
          </Text>
          <Text style={styles.option}>
            Activity Level: <Text style={styles.value}>{ACTIVITY_LEVELS.find(a => a.value === userInfo.activityLevel)?.label || ''}</Text>
          </Text>
        </View>
      ) : (
        <Text style={styles.option}>No user connected</Text>
      )}
      <TouchableOpacity style={styles.editButton} onPress={handleOpenModal}>
        <Text style={styles.editButtonText}>Edit Goal & Activity</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
        <Text style={styles.deleteButtonText}>Delete Account</Text>
      </TouchableOpacity>

      {/* Modal for editing */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Edit Goal & Activity</Text>
            <Text style={styles.modalLabel}>Goal</Text>
            <Picker
              selectedValue={editGoal}
              onValueChange={setEditGoal}
              style={{ width: 300 }}
            >
              {GOALS.map(g => (
                <Picker.Item key={g.value} label={g.label} value={g.value} />
              ))}
            </Picker>
            <Text style={styles.modalLabel}>Activity Level</Text>
            <Picker
              selectedValue={editActivity}
              onValueChange={setEditActivity}
              style={{ width: 300 }}
            >
              {ACTIVITY_LEVELS.map(a => (
                <Picker.Item key={a.value} label={a.label} value={a.value} />
              ))}
            </Picker>
            <View style={{ flexDirection: 'row', marginTop: 16 }}>
              <Button title="Cancel" onPress={() => setModalVisible(false)} />
              <View style={{ width: 16 }} />
              <Button title="Save" onPress={handleSave} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  title: { 
    fontSize: 48, 
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: theme.spacing.lg,
  },
  userInfo: { 
    marginVertical: 20,
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    padding: theme.spacing.md,
    width: 320,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  option: { 
    marginVertical: 6, 
    fontSize: 17,
    color: theme.colors.text,
  },
  value: {
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  editButton: {
    marginTop: 18,
    backgroundColor: theme.colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  deleteButton: {
    marginTop: 18,
    backgroundColor: theme.colors.error,
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#0008',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    padding: 24,
    width: 300,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: theme.colors.primary,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 2,
    color: theme.colors.text,
    alignSelf: 'flex-start',
  },
});

export default AccountScreen;
import React, { useState, useRef, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Animated, Dimensions, PanResponder, SafeAreaView, Platform, StatusBar, Alert } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import HomeScreen from '../screens/HomeScreen';
import DiaryScreen from '../screens/DiaryScreen';
import StatisticsScreen from '../screens/StatisticsScreen';
import AccountScreen from '../screens/AccountScreen';
import MessagesScreen from '../screens/MessagesScreen';
import ProgramsScreen from '../screens/ProgramsScreen';
import ChatScreen from '../screens/ChatScreen';
import NotificationScreen from '../screens/NotificationScreen';
import { signOut } from 'firebase/auth';
import { auth, db } from '../services/firebase';
import { onSnapshot, collection, query, where } from 'firebase/firestore';
import theme from '../styles/theme';

const Tab = createBottomTabNavigator();
const { width } = Dimensions.get('window');

const MainNavigator = ({ user, setUser, navigation }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hasPendingRequests, setHasPendingRequests] = useState(false);
  const menuAnimation = useRef(new Animated.Value(0)).current;

  const toggleMenu = () => {
    const toValue = isMenuOpen ? 0 : 1;
    setIsMenuOpen(!isMenuOpen);
    Animated.spring(menuAnimation, {
      toValue,
      useNativeDriver: true,
      friction: 8,
      tension: 40,
    }).start();
  };

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Logout", style: "destructive", onPress: async () => {
            try {
              await signOut(auth);
              navigation.navigate('Login');
            } catch (error) {
              console.error("Logout error: ", error.message);
            }
          }
        }
      ]
    );
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      setIsMenuOpen(false);
    });
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;
    const q = query(
      collection(db, 'friendRequests'),
      where('recipientId', '==', userId),
      where('status', '==', 'pending')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setHasPendingRequests(!snapshot.empty);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
    menuAnimation.setValue(0);
  }, []);

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      return isMenuOpen && gestureState.dx > 0;
    },
    onPanResponderMove: (evt, gestureState) => {
      let newValue = 1 - gestureState.dx / (width * 0.7);
      if (newValue < 0) newValue = 0;
      if (newValue > 1) newValue = 1;
      menuAnimation.setValue(newValue);
    },
    onPanResponderRelease: (evt, gestureState) => {
      if (gestureState.dx > width * 0.3) {
        toggleMenu();
      } else {
        Animated.spring(menuAnimation, {
          toValue: 1,
          useNativeDriver: true,
          friction: 8,
          tension: 40,
        }).start();
      }
    },
  });

  const menuTranslateX = menuAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [width * 0.7, 0],
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.notificationIcon}
          onPress={() => navigation.navigate('NotificationScreen')}
        >
          <Ionicons name="notifications-outline" size={30} color={theme.colors.primary} />
          {hasPendingRequests && (
            <View style={styles.notificationDot} />
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuIcon} onPress={toggleMenu}>
          <Ionicons name={isMenuOpen ? "close" : "menu"} size={30} color={theme.colors.primary} />
        </TouchableOpacity>
        
      </View>

      {isMenuOpen && (
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={toggleMenu}
        >
          <BlurView intensity={100} style={StyleSheet.absoluteFill} />
        </TouchableOpacity>
      )}
      {/* side menu */}
      <Animated.View
        style={[
          styles.menuContainer,
          { transform: [{ translateX: menuTranslateX }] }
        ]}
        pointerEvents={isMenuOpen ? 'auto' : 'none'}
        {...panResponder.panHandlers}
      >
        <View style={styles.menuContent}>
          <TouchableOpacity style={styles.menuItem} onPress={() => {
            toggleMenu();
            navigation.navigate('Account');
          }}>
            <Ionicons name="person-outline" size={24} color={theme.colors.primary} />
            <Text style={styles.menuItemText}>Manage Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color={theme.colors.primary} />
            <Text style={styles.menuItemText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* bottom tab navigation */}
      <Tab.Navigator
  screenOptions={({ route }) => ({
    tabBarIcon: ({ focused, color, size }) => {
      let iconName;
      if (route.name === 'Home') {
        iconName = focused ? 'home' : 'home-outline';
      } else if (route.name === 'Diary') {
        iconName = focused ? 'calendar' : 'calendar-outline';
      } else if (route.name === 'Statistics') {
        iconName = focused ? 'stats-chart' : 'stats-chart-outline';
      } else if (route.name === 'Programs') {
        iconName = focused ? 'book' : 'book-outline';
      } else if (route.name === 'Messages') {
        iconName = focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline';
      }
      return <Ionicons name={iconName} size={size} color={color} />;
    },
    tabBarActiveTintColor: theme.colors.primary,
    tabBarInactiveTintColor: 'gray',
    tabBarStyle: styles.tabBar,
    tabBarLabelStyle: styles.tabBarLabel,
    headerShown: false,
  })}
  // charge les écrans à la demande
  sceneContainerStyle={{ backgroundColor: theme.colors.background }} // évite les flashs blancs entre transitions
>

        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Diary" component={DiaryScreen} />
        <Tab.Screen name="Statistics" component={StatisticsScreen} />
        <Tab.Screen name="Programs" component={ProgramsScreen} />
        <Tab.Screen name="Messages" component={MessagesScreen} />
      </Tab.Navigator>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    //backgroundColor: '#175c5b',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 20 : 20,
    paddingBottom: 4,
    zIndex: 2,
  },
  menuIcon: {
    marginLeft: 15,
  },
  notificationIcon: {},
  messageIcon: {
    marginLeft: 15,
  },
  menuContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: width * 0.7,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    zIndex: 1,
  },
  menuContent: {
    flex: 1,
    paddingTop: 100,
    paddingHorizontal: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  menuItemText: {
    marginLeft: 15,
    fontSize: 18,
    color: theme.colors.primary,
  },
  tabBar: {
    backgroundColor: theme.colors.card,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    height: 60,
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  notificationDot: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'red',
  },
});

export default MainNavigator;
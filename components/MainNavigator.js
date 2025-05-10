import React, { useState, useRef, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Animated, Dimensions, PanResponder, SafeAreaView, Platform, StatusBar, Alert } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import HomeScreen from '../screens/HomeScreen';
import DiaryScreen from '../screens/DiaryScreen';
import AddMealScreen from '../screens/AddMealScreen';
import StatisticsScreen from '../screens/StatisticsScreen';
import AccountScreen from '../screens/AccountScreen';
import { signOut } from 'firebase/auth';
import { auth } from '../services/firebase';
import theme from '../styles/theme';

const Tab = createBottomTabNavigator();
const { width } = Dimensions.get('window');

const MainNavigator = ({ user, setUser, navigation }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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
        <TouchableOpacity style={styles.notificationIcon} onPress={() => {/* Handle notification press */}}>
          <Ionicons name="notifications-outline" size={30} color={theme.colors.primary} />
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

      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;
            if (route.name === 'Home') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'AddMeal') {
              iconName = focused ? 'fast-food' : 'fast-food-outline';
            } else if (route.name === 'Diary') {
              iconName = focused ? 'calendar' : 'calendar-outline';
            }
            else if (route.name === 'Statistics') {
              iconName = focused ? 'stats-chart' : 'stats-chart-outline';
            }
            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: 'gray',
          tabBarStyle: styles.tabBar,
          tabBarLabelStyle: styles.tabBarLabel,
          headerShown: false,
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Diary" component={DiaryScreen} />
        <Tab.Screen name="AddMeal" component={AddMealScreen} options={{ title: 'Meal' }} />
        <Tab.Screen name="Statistics" component={StatisticsScreen} />
      </Tab.Navigator>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 30 : 10,
    paddingBottom: 4,
    zIndex: 2,
  },
  menuIcon: {
    marginLeft: 15,
  },
  notificationIcon: {},
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
});

export default MainNavigator;
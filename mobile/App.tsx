import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect } from 'react';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import HomeScreen from './src/screens/HomeScreen';
import AskScreen from './src/screens/AskScreen';
import SellScreen from './src/screens/SellScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
          paddingTop: 8,
          height: 90,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginBottom: 8,
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarIcon: ({ focused, color }) => {
          let icon;
          
          if (route.name === 'Home') {
            icon = focused ? '🏠' : '🏡';
          } else if (route.name === 'Ask') {
            icon = focused ? '💬' : '💭';
          } else if (route.name === 'Sell') {
            icon = focused ? '💰' : '💵';
          }
          
          return (
            <Text style={{ 
              fontSize: 24, 
              marginBottom: 4,
              transform: [{ scale: focused ? 1.1 : 1 }],
            }}>
              {icon}
            </Text>
          );
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ title: 'Home' }}
      />
      <Tab.Screen 
        name="Ask" 
        component={AskScreen}
        options={{ title: 'Ask AI' }}
      />
      <Tab.Screen 
        name="Sell" 
        component={SellScreen}
        options={{ title: 'Sell Data' }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [isOnboarded, setIsOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const onboarded = await AsyncStorage.getItem('@onboarding_complete');
      setIsOnboarded(onboarded === 'true');
    } catch (error) {
      console.error('Failed to check onboarding status:', error);
      setIsOnboarded(false);
    }
  };

  if (isOnboarded === null) {
    return null; // Loading state
  }

  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isOnboarded ? (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : (
          <Stack.Screen name="Main" component={MainTabNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

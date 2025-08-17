import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect } from 'react';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import IntroScreen from './src/screens/IntroScreen';
import HomeScreen from './src/screens/HomeScreen';
import AskScreen from './src/screens/AskScreen';
import SellScreen from './src/screens/SellScreen';
import WalletScreen from './src/screens/WalletScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  const [showIntro, setShowIntro] = useState<boolean | null>(null);

  useEffect(() => {
    checkFirstLaunch();
  }, []);

  const checkFirstLaunch = async () => {
    try {
      const hasSeenIntro = await AsyncStorage.getItem('@fitcentive_intro_seen');
      setShowIntro(!hasSeenIntro);
    } catch (error) {
      console.error('Error checking first launch:', error);
      setShowIntro(true);
    }
  };

  const handleIntroComplete = async () => {
    try {
      await AsyncStorage.setItem('@fitcentive_intro_seen', 'true');
      setShowIntro(false);
    } catch (error) {
      console.error('Error saving intro state:', error);
    }
  };

  if (showIntro === null) {
    // Still checking, you could show a loading screen here
    return null;
  }

  if (showIntro) {
    return <IntroScreen onGenerateMockData={handleIntroComplete} />;
  }
  return (
    <NavigationContainer>
      <StatusBar style="auto" />
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
            } else if (route.name === 'Wallet') {
              icon = focused ? '👛' : '💳';
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
          options={{ title: 'Ask' }}
        />
        <Tab.Screen 
          name="Sell" 
          component={SellScreen}
          options={{ title: 'Sell' }}
        />
        <Tab.Screen 
          name="Wallet" 
          component={WalletScreen}
          options={{ title: 'Wallet' }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

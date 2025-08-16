import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from './src/screens/HomeScreen';
import AskScreen from './src/screens/AskScreen';
import SellScreen from './src/screens/SellScreen';

const Tab = createBottomTabNavigator();

export default function App() {
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
          options={{ title: 'Wellrus' }}
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
    </NavigationContainer>
  );
}

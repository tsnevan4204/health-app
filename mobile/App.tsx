import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import HealthImportScreen from './src/screens/HealthImportScreen';

export default function App() {
  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <HealthImportScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Provider as PaperProvider } from 'react-native-paper';
import MainScreen from './src/screens/MainScreen';

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider>
        <MainScreen />
        <StatusBar style="auto" />
      </PaperProvider>
    </SafeAreaProvider>
  );
}
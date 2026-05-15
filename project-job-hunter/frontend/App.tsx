// Main App Component
import { COLORS } from '@constants/theme';
import { RootNavigator } from '@navigation/RootNavigator';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync().catch(() => {
  // Error: Splash screen wasn't displayed
});

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar
        style="light"
        backgroundColor={COLORS.primary}
        translucent={false}
      />
      <RootNavigator />
    </SafeAreaProvider>
  );
}
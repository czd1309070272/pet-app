import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AppProvider, useApp } from './src/context/AppContext';
import { TabBarVisibilityProvider } from './src/context/TabBarVisibilityContext';
import RootNavigator from './src/navigation/RootNavigator';
import { navigationRef } from './src/navigation/rootNavigation';

function AppContent() {
  const { isDarkMode } = useApp();
  return (
    <>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      <TabBarVisibilityProvider>
        <RootNavigator />
      </TabBarVisibilityProvider>
    </>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <SafeAreaProvider>
      <AppProvider>
        <NavigationContainer ref={navigationRef}>
          <AppContent />
        </NavigationContainer>
      </AppProvider>
    </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

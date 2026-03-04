import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';
import { useApp } from '../context/AppContext';
import LoginScreen from '../screens/LoginScreen';
import MainTabs from './MainTabs';
import { colors } from '../theme/tokens';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { isLoggedIn, isLoading, loginSuccess, isDarkMode } = useApp();

  if (isLoading) {
    return (
      <View style={[styles.loading, { backgroundColor: isDarkMode ? colors.glassBg.dark : colors.glassBg.light }]}>
        <ActivityIndicator size="large" color={colors.orange[500]} />
      </View>
    );
  }

  if (!isLoggedIn) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Auth">
          {() => <LoginScreen onLoginSuccess={loginSuccess} />}
        </Stack.Screen>
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={MainTabs} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff9f5',
  },
});

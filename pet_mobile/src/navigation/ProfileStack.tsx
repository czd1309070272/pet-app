import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from './types';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import PersonalInfoScreen from '../screens/PersonalInfoScreen';
import AddressScreen from '../screens/AddressScreen';
import CartScreen from '../screens/CartScreen';
import MedicationScreen from '../screens/MedicationScreen';
import WalletScreen from '../screens/WalletScreen';
import PlaceholderScreen from '../screens/PlaceholderScreen';
import HistoryReportScreen from '../screens/HistoryReportScreen';
import AlbumScreen from '../screens/AlbumScreen';
import { useApp } from '../context/AppContext';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export default function ProfileStack() {
  const { user, isDarkMode, logout, toggleDarkMode } = useApp();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="Profile">
        {({ navigation, route }) => (
          <ProfileScreen navigation={navigation} route={route} user={user} />
        )}
      </Stack.Screen>
      <Stack.Screen name="Settings">
        {({ navigation }) => (
          <SettingsScreen
            navigation={navigation}
            onBack={() => navigation.goBack()}
            isDarkMode={isDarkMode}
            onToggleDarkMode={toggleDarkMode}
            onLogout={async () => {
              await logout();
            }}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="PersonalInfo">
        {({ navigation }) => <PersonalInfoScreen navigation={navigation} user={user} />}
      </Stack.Screen>
      <Stack.Screen name="Address">
        {({ navigation }) => <AddressScreen navigation={navigation} />}
      </Stack.Screen>
      <Stack.Screen name="Cart">
        {({ navigation }) => <CartScreen navigation={navigation as any} />}
      </Stack.Screen>
      <Stack.Screen name="Medication">
        {({ navigation, route }) => <MedicationScreen navigation={navigation as any} route={route} />}
      </Stack.Screen>
      <Stack.Screen name="Wallet">
        {({ navigation }) => <WalletScreen navigation={navigation as any} />}
      </Stack.Screen>
      <Stack.Screen name="Appointment">
        {({ navigation }) => <PlaceholderScreen title="我的預約" onBack={() => navigation.goBack()} />}
      </Stack.Screen>
      <Stack.Screen name="Orders">
        {({ navigation }) => <PlaceholderScreen title="我的訂單" onBack={() => navigation.goBack()} />}
      </Stack.Screen>
      <Stack.Screen name="Logistics">
        {({ navigation }) => <PlaceholderScreen title="物流" onBack={() => navigation.goBack()} />}
      </Stack.Screen>
      <Stack.Screen name="Membership">
        {({ navigation }) => <PlaceholderScreen title="會員中心" onBack={() => navigation.goBack()} />}
      </Stack.Screen>
      <Stack.Screen name="Album" component={AlbumScreen} />
      <Stack.Screen name="Insurance">
        {({ navigation }) => <PlaceholderScreen title="保單管理" onBack={() => navigation.goBack()} />}
      </Stack.Screen>
      <Stack.Screen name="HistoryReport" component={HistoryReportScreen} />
    </Stack.Navigator>
  );
}

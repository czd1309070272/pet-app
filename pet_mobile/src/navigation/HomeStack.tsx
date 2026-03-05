import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { HomeStackParamList } from './types';
import HomeScreen from '../screens/HomeScreen';
import PlaceholderScreen from '../screens/PlaceholderScreen';
import MedicationScreen from '../screens/MedicationScreen';
import WalletScreen from '../screens/WalletScreen';
import DetectScreen from '../screens/DetectScreen';
import AIConsultantScreen from '../screens/AIConsultantScreen';
import HistoryReportScreen from '../screens/HistoryReportScreen';
import CalendarScreen from '../screens/CalendarScreen';
import DiaryScreen from '../screens/DiaryScreen';
import AlbumScreen from '../screens/AlbumScreen';
import ArticleListScreen from '../screens/ArticleListScreen';
import ArticleDetailScreen from '../screens/ArticleDetailScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import PetProfileScreen from '../screens/PetProfileScreen';
import PetBehaviorAnalysisScreen from '../screens/PetBehaviorAnalysisScreen';
import PetBehaviorAnalysisResultScreen from '../screens/PetBehaviorAnalysisResultScreen';

const Stack = createNativeStackNavigator<HomeStackParamList>();

export default function HomeStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="PetProfile" component={PetProfileScreen} />
      <Stack.Screen name="Diary" component={DiaryScreen} />
      <Stack.Screen name="PetBehaviorAnalysis" component={PetBehaviorAnalysisScreen} />
      <Stack.Screen name="PetBehaviorAnalysisResult" component={PetBehaviorAnalysisResultScreen} />
      <Stack.Screen name="Medication" component={MedicationScreen} />
      <Stack.Screen name="Calendar" component={CalendarScreen} />
      <Stack.Screen name="Wallet" component={WalletScreen} />
      <Stack.Screen name="Appointment">
        {({ navigation }) => (
          <PlaceholderScreen title="預約" onBack={() => navigation.goBack()} />
        )}
      </Stack.Screen>
      <Stack.Screen name="Detect" component={DetectScreen} />
      <Stack.Screen name="HistoryReport" component={HistoryReportScreen} />
      <Stack.Screen name="AIConsultant" component={AIConsultantScreen} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <Stack.Screen name="ArticleList" component={ArticleListScreen} />
      <Stack.Screen name="ArticleDetail" component={ArticleDetailScreen} />
      <Stack.Screen name="Album" component={AlbumScreen} />
      <Stack.Screen name="StarryMemorial">
        {({ navigation }) => (
          <PlaceholderScreen title="星空紀念" onBack={() => navigation.goBack()} />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { DiscoveryStackParamList } from './types';
import VideoFeedScreen from '../screens/VideoFeedScreen';
import DiscoveryScreen from '../screens/DiscoveryScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import CartScreen from '../screens/CartScreen';

const Stack = createNativeStackNavigator<DiscoveryStackParamList>();

export default function DiscoveryStack() {
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
      initialRouteName="VideoFeed"
    >
      <Stack.Screen name="VideoFeed" component={VideoFeedScreen} />
      <Stack.Screen name="Discovery" component={DiscoveryScreen} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <Stack.Screen name="Cart" component={CartScreen} />
    </Stack.Navigator>
  );
}

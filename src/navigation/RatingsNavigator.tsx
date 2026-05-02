import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import DiscoverScreen from '../screens/discover/DiscoverScreen';
import DiscoverDetailScreen from '../screens/discover/DiscoverDetailScreen';
import DetailScreen from '../screens/detail/DetailScreen';
import { RatingsStackParamList } from '../types';

const Stack = createStackNavigator<RatingsStackParamList>();

const RatingsNavigator = () => {
  return (
    <Stack.Navigator id="ratings-navigator" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="RatingsMain" component={DiscoverScreen} />
      <Stack.Screen name="DiscoverDetail" component={DiscoverDetailScreen} />
      <Stack.Screen name="Details" component={DetailScreen} />
    </Stack.Navigator>
  );
};

export default RatingsNavigator;

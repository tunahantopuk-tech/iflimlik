import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { ListsStackParamList } from '../types';
import ListsScreen from '../screens/lists/ListsScreen';
import DetailScreen from '../screens/detail/DetailScreen';

const Stack = createStackNavigator<ListsStackParamList>();

const ListsNavigator = () => {
  return (
    <Stack.Navigator id="lists-navigator" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ListsScreen" component={ListsScreen} />
      <Stack.Screen name="Detail" component={DetailScreen} />
    </Stack.Navigator>
  );
};

export default ListsNavigator;
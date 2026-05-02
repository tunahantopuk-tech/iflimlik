import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { SearchStackParamList } from '../types';
import SearchScreen from '../screens/search/SearchScreen';
import DetailScreen from '../screens/detail/DetailScreen';

const Stack = createStackNavigator<SearchStackParamList>();

const SearchNavigator = () => {
  return (
    <Stack.Navigator id="search-navigator" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SearchScreen" component={SearchScreen} />
      <Stack.Screen name="Detail" component={DetailScreen} />
    </Stack.Navigator>
  );
};

export default SearchNavigator;
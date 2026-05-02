import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import {
  CompareTypeScreen,
  CompareGenreScreen,
  CompareGameScreen,
  CompareResultScreen,
} from '../screens/compare';
import DetailScreen from '../screens/detail/DetailScreen';

export type CompareStackParamList = {
  CompareType: undefined;
  CompareGenre: { type: 'movie' | 'tv' };
  CompareGame: { type: 'movie' | 'tv'; genre: string };
  CompareResult: { winner: any };
  Detail: { id: number; type: 'movie' | 'tv' };
};

const Stack = createStackNavigator<CompareStackParamList>();

const CompareNavigator = () => {
  return (
    <Stack.Navigator
      id="compare-navigator"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="CompareType" component={CompareTypeScreen} />
      <Stack.Screen name="CompareGenre" component={CompareGenreScreen} />
      <Stack.Screen name="CompareGame" component={CompareGameScreen} />
      <Stack.Screen name="CompareResult" component={CompareResultScreen} />
      <Stack.Screen name="Detail" component={DetailScreen} />
    </Stack.Navigator>
  );
};

export default CompareNavigator;

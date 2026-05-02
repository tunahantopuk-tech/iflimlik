import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import GamesScreen from '../screens/games/GamesScreen';

const Stack = createStackNavigator();

const GamesNavigator = () => (
  <Stack.Navigator id="games-navigator" screenOptions={{ headerShown: false }}>
    <Stack.Screen name="GamesMain" component={GamesScreen} />
  </Stack.Navigator>
);

export default GamesNavigator;

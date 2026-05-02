import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { SetupScreen, GameScreen, ResultScreen } from '../screens/silentcinema';

export type SilentCinemaStackParamList = {
  SilentCinemaSetup: undefined;
  SilentCinemaGame: {
    team1Name: string;
    team2Name: string;
    team1Players: string;
    team2Players: string;
    rounds: string;
  };
  SilentCinemaResult: {
    team1Name: string;
    team2Name: string;
    team1Score: string;
    team2Score: string;
    team1Players: string; // JSON string of player names
    team2Players: string; // JSON string of player names
    team1PlayerScores: string; // JSON string of player scores [number[]]
    team2PlayerScores: string; // JSON string of player scores [number[]]
  };
};

const Stack = createStackNavigator<SilentCinemaStackParamList>();

const SilentCinemaNavigator = () => {
  return (
    <Stack.Navigator id="silent-cinema-navigator" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SilentCinemaSetup" component={SetupScreen} />
      <Stack.Screen name="SilentCinemaGame" component={GameScreen} />
      <Stack.Screen name="SilentCinemaResult" component={ResultScreen} />
    </Stack.Navigator>
  );
};

export default SilentCinemaNavigator;

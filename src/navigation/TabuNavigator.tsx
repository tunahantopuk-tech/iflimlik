import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { TabuSetupScreen, TabuGameScreen, TabuResultScreen } from '../screens/tabu';

export type TabuStackParamList = {
  TabuSetup: undefined;
  TabuGame: {
    team1Name: string;
    team2Name: string;
    team1Players: string;
    team2Players: string;
    rounds: string;
  };
  TabuResult: {
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

const Stack = createStackNavigator<TabuStackParamList>();

export default function TabuNavigator() {
  return (
    <Stack.Navigator id="tabu-navigator"
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#0f0624' },
      }}
    >
      <Stack.Screen name="TabuSetup" component={TabuSetupScreen} />
      <Stack.Screen name="TabuGame" component={TabuGameScreen} />
      <Stack.Screen name="TabuResult" component={TabuResultScreen} />
    </Stack.Navigator>
  );
}

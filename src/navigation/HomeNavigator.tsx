import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { HomeStackParamList } from '../types';
import HomeScreen from '../screens/home/HomeScreen';
import DetailScreen from '../screens/detail/DetailScreen';
import MoodSelectionScreen from '../screens/mood/MoodSelectionScreen';
import MoodRecommendationsScreen from '../screens/mood/MoodRecommendationsScreen';
import iFishingCompletionScreen from '../screens/mood/iFishingCompletionScreen';
import ChatScreen from '../screens/chat/ChatScreen';
import ChatHistoryScreen from '../screens/chat/ChatHistoryScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import AboutScreen from '../screens/AboutScreen';
import CompareNavigator from './CompareNavigator';
import PersonDetailScreen from '../screens/person/PersonDetailScreen';
import StatsScreen from '../screens/stats/StatsScreen';
import SilentCinemaNavigator from './SilentCinemaNavigator';
import TabuNavigator from './TabuNavigator';

const Stack = createStackNavigator<HomeStackParamList>();

const HomeNavigator = () => {
  return (
    <Stack.Navigator id="home-navigator" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeScreen" component={HomeScreen} />
      <Stack.Screen name="Detail" component={DetailScreen} />
      <Stack.Screen name="MoodSelection" component={MoodSelectionScreen} />
      <Stack.Screen name="MoodRecommendations" component={MoodRecommendationsScreen} />
      <Stack.Screen name="iFishingCompletion" component={iFishingCompletionScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="ChatHistory" component={ChatHistoryScreen} />
      <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
      <Stack.Screen name="About" component={AboutScreen} />
      <Stack.Screen name="PersonDetail" component={PersonDetailScreen} />
      <Stack.Screen name="Stats" component={StatsScreen} />
      <Stack.Screen name="Compare" component={CompareNavigator} options={{ headerShown: false }} />
      <Stack.Screen name="SilentCinema" component={SilentCinemaNavigator} options={{ headerShown: false }} />
      <Stack.Screen name="Tabu" component={TabuNavigator} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
};

export default HomeNavigator;
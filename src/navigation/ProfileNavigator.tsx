import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { ProfileStackParamList } from '../types';
import ChatHistoryScreen from '../screens/chat/ChatHistoryScreen';

const Stack = createStackNavigator<ProfileStackParamList>();

const ProfileNavigator = () => {
  return (
    <Stack.Navigator id="profile-navigator" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ChatHistory" component={ChatHistoryScreen} />
    </Stack.Navigator>
  );
};

export default ProfileNavigator;

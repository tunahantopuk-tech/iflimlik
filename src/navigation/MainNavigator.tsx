import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { MainTabParamList } from '../types';
import { colors } from '../theme';
import HomeNavigator from './HomeNavigator';
import GamesNavigator from './GamesNavigator';
import RatingsNavigator from './RatingsNavigator';
import ListsNavigator from './ListsNavigator';
import ProfileNavigator from './ProfileNavigator';

const Tab = createBottomTabNavigator<MainTabParamList>();

const MainNavigator = () => {
  return (
    <Tab.Navigator
      id="main-navigator"
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#292929',
          borderTopColor: 'rgba(255, 255, 255, 0.1)',
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 65,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.grayLight,
        tabBarShowLabel: false, // Hide labels
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeNavigator}
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name={focused ? "home-sharp" : "home-outline"} 
              size={28} 
              color={color} 
            />
          ),
        }}
      />
      <Tab.Screen
        name="Games"
        component={GamesNavigator}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "game-controller" : "game-controller-outline"}
              size={28}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Ratings"
        component={RatingsNavigator}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "compass" : "compass-outline"}
              size={28}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Lists"
        component={ListsNavigator}
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name={focused ? "bookmark-sharp" : "bookmark-outline"} 
              size={28} 
              color={color} 
            />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileNavigator}
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name={focused ? "chatbubbles" : "chatbubbles-outline"} 
              size={28} 
              color={color} 
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default MainNavigator;

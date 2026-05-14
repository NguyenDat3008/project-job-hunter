// App Navigator (Tab + Stack)
import { COLORS, SPACING } from '@constants/theme';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen, ProfileScreen } from '@screens/index';
import React from 'react';
import { AppStackParamList, TabParamList } from './types';

const Stack = createNativeStackNavigator<AppStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const getTabIcon = (routeName: string) => {
  const icons: Record<string, string> = {
    HomeTab: '🏠',
    SavedJobsTab: '❤️',
    CVTab: '📋',
    ProfileTab: '👤',
  };

  return icons[routeName] || '?';
};

const TabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: () => (
          <>{getTabIcon(route.name)}</>
        ),
        tabBarLabel: () => null,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.text.light,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: SPACING.sm,
        },
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} />
      <Tab.Screen name="SavedJobsTab" component={HomeScreen as any} />
      <Tab.Screen name="CVTab" component={HomeScreen as any} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

export const AppNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.white },
      }}
    >
      <Stack.Screen
        name="MainTabs"
        component={TabNavigator}
        options={{
          animation: 'none',
        }}
      />
    </Stack.Navigator>
  );
};

export default AppNavigator;
// Root Navigator
import { COLORS } from '@constants/theme';
import { useAuth } from '@hooks/index';
import { NavigationContainer } from '@react-navigation/native';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { AppNavigator } from './AppNavigator';
import { AuthNavigator } from './AuthNavigator';

export const RootNavigator: React.FC = () => {
  const { state } = useAuth();

  console.log('DEBUG ROOT NAVIGATOR: State:', {
    isLoading: state.isLoading,
    isAuthenticated: state.isAuthenticated,
    user: state.user ? state.user.name : 'null',
  });

  if (state.isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {state.isAuthenticated && state.user ? (
        <AppNavigator />
      ) : (
        <AuthNavigator />
      )}
    </NavigationContainer>
  );
};

export default RootNavigator;
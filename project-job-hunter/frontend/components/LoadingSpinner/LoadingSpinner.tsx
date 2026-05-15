// Loading Spinner component
import { COLORS, SPACING, TYPOGRAPHY } from '@constants/theme';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  message?: string;
  fullScreen?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'large',
  color = COLORS.primary,
  message,
  fullScreen = false,
}) => {
  const styles = StyleSheet.create({
    container: {
      justifyContent: 'center',
      alignItems: 'center',
      ...(fullScreen && {
        flex: 1,
        backgroundColor: COLORS.white,
      }),
    },
    message: {
      ...TYPOGRAPHY.body2,
      color: COLORS.text.secondary,
      marginTop: SPACING.lg,
    },
  });

  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={color} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
};

export default LoadingSpinner;
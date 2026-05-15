// Header component
import { COLORS, SHADOW, SPACING, TYPOGRAPHY } from '@constants/theme';
import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  style?: ViewStyle;
  backgroundColor?: string;
}

const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onBack,
  rightAction,
  style,
  backgroundColor = COLORS.primary,
}) => {
  const styles = StyleSheet.create({
    container: {
      backgroundColor,
      paddingHorizontal: SPACING.lg,
      paddingVertical: SPACING.lg,
      ...SHADOW.sm,
    },
    content: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    titleSection: {
      flex: 1,
      marginLeft: onBack ? SPACING.md : 0,
    },
    title: {
      ...TYPOGRAPHY.h3,
      color: COLORS.white,
      marginBottom: subtitle ? SPACING.xs : 0,
    },
    subtitle: {
      ...TYPOGRAPHY.caption,
      color: COLORS.white,
      opacity: 0.9,
    },
    backButton: {
      padding: SPACING.sm,
    },
    backButtonText: {
      fontSize: 24,
    },
  });

  return (
    <SafeAreaView style={[styles.container, style]}>
      <View style={styles.content}>
        {onBack && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
          >
            <Text style={styles.backButtonText}>‹</Text>
          </TouchableOpacity>
        )}
        <View style={styles.titleSection}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
        {rightAction && <View>{rightAction}</View>}
      </View>
    </SafeAreaView>
  );
};

export default Header;
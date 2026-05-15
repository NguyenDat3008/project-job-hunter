import React from 'react';
import { StyleSheet, Text, View, ImageBackground, TouchableOpacity, ViewStyle } from 'react-native';
import { BORDER_RADIUS, COLORS, SPACING, TYPOGRAPHY } from '@constants/theme';

interface BannerProps {
  title?: string;
  subtitle?: string;
  buttonText?: string;
  onButtonPress?: () => void;
  backgroundImage?: any;
  style?: ViewStyle;
  variant?: 'primary' | 'secondary';
}

const Banner: React.FC<BannerProps> = ({
  title,
  subtitle,
  buttonText,
  onButtonPress,
  backgroundImage,
  style,
  variant = 'primary',
}) => {
  const gradientBackgroundColor =
    variant === 'primary' ? COLORS.primary : COLORS.secondary;

  return (
    <View style={[styles.container, style]}>
      {backgroundImage ? (
        <ImageBackground
          source={backgroundImage}
          style={styles.backgroundImage}
          resizeMode="cover"
        >
          <View style={[styles.gradient, { backgroundColor: COLORS.primary + 'D9' }]} />
        </ImageBackground>
      ) : (
        <View style={[styles.gradient, { backgroundColor: gradientBackgroundColor }]}>
          <View style={styles.content}>
            {title && <Text style={styles.title}>{title}</Text>}
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
            {buttonText && (
              <TouchableOpacity
                style={styles.button}
                onPress={onButtonPress}
                activeOpacity={0.8}
              >
                <Text style={styles.buttonText}>{buttonText}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    marginVertical: SPACING.md,
  },
  backgroundImage: {
    width: '100%',
    minHeight: 200,
  },
  gradient: {
    width: '100%',
    minHeight: 200,
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  content: {
    justifyContent: 'center',
  },
  title: {
    ...TYPOGRAPHY.h2,
    color: COLORS.white,
    marginBottom: SPACING.sm,
    fontWeight: '700',
  },
  subtitle: {
    ...TYPOGRAPHY.body2,
    color: COLORS.white,
    marginBottom: SPACING.lg,
    opacity: 0.95,
    lineHeight: 20,
  },
  button: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.sm,
  },
  buttonText: {
    ...TYPOGRAPHY.buttonSmall,
    color: COLORS.primary,
    fontWeight: '700',
  },
});

export default Banner;

// TextField component - Refined minimalist look
import { BORDER_RADIUS, COLORS, SPACING, TYPOGRAPHY } from '@constants/theme';
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';

interface TextFieldProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  onBlur?: () => void;
  error?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  editable?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  maxLength?: number;
  containerStyle?: ViewStyle;
  style?: TextStyle;
  showPasswordToggle?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const TextField: React.FC<TextFieldProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  onBlur,
  error,
  secureTextEntry = false,
  keyboardType = 'default',
  editable = true,
  multiline = false,
  numberOfLines = 1,
  maxLength,
  containerStyle,
  style,
  showPasswordToggle = false,
  leftIcon,
  rightIcon,
}) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const styles = StyleSheet.create({
    container: {
      marginBottom: SPACING.xl,
    },
    label: {
      ...TYPOGRAPHY.label,
      color: isFocused ? COLORS.primary : COLORS.text.secondary,
      marginBottom: SPACING.xs,
      fontSize: 11,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: multiline ? 'flex-start' : 'center',
      backgroundColor: '#F3F4F6', // Xám sáng để dễ nhìn thấy khung nhập liệu
      borderWidth: 0, // Không dùng viền
      borderColor: 'transparent',
      borderRadius: BORDER_RADIUS.md,
      paddingHorizontal: SPACING.md,
      paddingVertical: multiline ? SPACING.md : 0,
      minHeight: multiline ? 80 : 46,
    },
    input: {
      flex: 1,
      ...TYPOGRAPHY.body1,
      color: COLORS.text.primary,
      paddingVertical: SPACING.sm,
      fontSize: 14,
      outlineStyle: 'none', // Tắt viền đen mặc định của trình duyệt (trên Web)
    } as any,
    icon: {
      marginRight: SPACING.sm,
    },
    errorText: {
      ...TYPOGRAPHY.caption,
      color: COLORS.error,
      marginTop: SPACING.xs,
      fontWeight: '500',
    },
    toggleButton: {
      paddingHorizontal: SPACING.sm,
    },
    toggleText: {
      ...TYPOGRAPHY.captionBold,
      color: COLORS.primary,
    },
  });

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.inputContainer}>
        {leftIcon && <View style={styles.icon}>{leftIcon}</View>}
        <TextInput
          style={[styles.input, style]}
          placeholder={placeholder}
          placeholderTextColor={COLORS.text.light}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            onBlur?.();
          }}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          editable={editable}
          keyboardType={keyboardType}
          maxLength={maxLength}
          multiline={multiline}
          numberOfLines={numberOfLines}
          selectionColor={COLORS.primary}
        />
        {showPasswordToggle && secureTextEntry ? (
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            activeOpacity={0.6}
          >
            <Text style={styles.toggleText}>
              {isPasswordVisible ? 'ẨN' : 'HIỆN'}
            </Text>
          </TouchableOpacity>
        ) : null}
        {rightIcon && !showPasswordToggle && (
          <View style={styles.icon}>{rightIcon}</View>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

export default TextField;
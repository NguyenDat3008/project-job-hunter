import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Animated, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useToastStore, ToastType } from '../store/toastStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const Toast = () => {
  const { visible, message, type, duration, hide } = useToastStore();
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(-150)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (visible) {
      if (timerRef.current) clearTimeout(timerRef.current);

      // Slide in based on Platform and Safe Area
      const finalTop = Platform.OS === 'web' ? 20 : (insets.top > 0 ? insets.top + 8 : 16);

      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: finalTop,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();

      timerRef.current = setTimeout(() => {
        handleDismiss();
      }, duration);
    } else {
      handleDismiss();
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [visible, message, type, insets.top]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -150,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      hide();
    });
  };

  if (!visible) return null;

  const getToastConfig = (toastType: ToastType) => {
    switch (toastType) {
      case 'success':
        return {
          icon: 'checkmark-circle' as const,
          color: '#10B981', // Emerald green
          borderColor: '#A7F3D0',
          bg: '#F0FDF4',
          text: '#065F46',
          title: 'Thành công',
        };
      case 'error':
        return {
          icon: 'alert-circle' as const,
          color: '#EF4444', // Red
          borderColor: '#FEE2E2',
          bg: '#FEF2F2',
          text: '#991B1B',
          title: 'Thất bại',
        };
      case 'warning':
        return {
          icon: 'warning' as const,
          color: '#F59E0B', // Amber
          borderColor: '#FEF3C7',
          bg: '#FFFBEB',
          text: '#92400E',
          title: 'Cảnh báo',
        };
      case 'info':
      default:
        return {
          icon: 'information-circle' as const,
          color: '#3B82F6', // Blue
          borderColor: '#DBEAFE',
          bg: '#EFF6FF',
          text: '#1E40AF',
          title: 'Thông báo',
        };
    }
  };

  const config = getToastConfig(type);

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        {
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
          backgroundColor: config.bg,
          borderColor: config.borderColor,
        },
      ]}
    >
      <View style={[styles.statusIndicator, { backgroundColor: config.color }]} />
      <View style={styles.iconContainer}>
        <Ionicons name={config.icon} size={26} color={config.color} />
      </View>
      <View style={styles.contentContainer}>
        <Text style={[styles.titleText, { color: config.text }]}>{config.title}</Text>
        <Text style={styles.messageText}>
          {message}
        </Text>
      </View>
      <TouchableOpacity onPress={handleDismiss} style={styles.closeButton} activeOpacity={0.6}>
        <Ionicons name="close-outline" size={18} color="#9CA3AF" />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    zIndex: 999999,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
      web: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        maxWidth: 400,
        alignSelf: 'center',
        left: '50%',
        right: 'auto',
        transform: [{ translateX: -200 }], // Handled separately or using left/marginLeft
      },
    }),
  },
  statusIndicator: {
    position: 'absolute',
    left: 0,
    top: 10,
    bottom: 10,
    width: 4,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  iconContainer: {
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    flex: 1,
    paddingRight: 6,
  },
  titleText: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
  messageText: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 18,
    fontWeight: '500',
  },
  closeButton: {
    padding: 3,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    alignSelf: 'center',
  },
});

export default Toast;

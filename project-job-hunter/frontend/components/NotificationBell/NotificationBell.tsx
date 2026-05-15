// Modern Premium Notification Bell component
import { COLORS, SHADOW, SPACING } from '@constants/theme';
import React, { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { notificationService } from '@services/notificationService';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@store/authStore';

interface NotificationBellProps {
  onPress: () => void;
  light?: boolean;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ onPress, light = false }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, isAuthenticated } = useAuthStore();
  const bounceAnim = new Animated.Value(1);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadUnreadCount();
      // Polling for new notifications
      const interval = setInterval(loadUnreadCount, 30000);
      return () => clearInterval(interval);
    } else {
      setUnreadCount(0);
    }
  }, [isAuthenticated, user?.id]);

  const loadUnreadCount = async () => {
    try {
      const count = await notificationService.getUnreadCount();
      if (count !== unreadCount) {
        setUnreadCount(count);
        if (count > unreadCount) {
          // Subtle pop animation
          Animated.sequence([
            Animated.timing(bounceAnim, { toValue: 1.2, duration: 200, useNativeDriver: true }),
            Animated.spring(bounceAnim, { toValue: 1, friction: 4, useNativeDriver: true }),
          ]).start();
        }
      }
    } catch (e) {
      // ignore
    }
  };

  const iconColor = light ? COLORS.white : COLORS.text.primary;
  const containerBg = light ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.05)';

  const handlePress = () => {
    setUnreadCount(0);
    onPress();
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.7} style={[styles.container, { backgroundColor: containerBg }]}>
      <Animated.View style={{ transform: [{ scale: bounceAnim }] }}>
        <Ionicons name="notifications-outline" size={22} color={iconColor} />
      </Animated.View>
      
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: COLORS.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: 'transparent', // Will be visually distinct due to positioning
    ...SHADOW.sm,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: '800',
  },
});

export default NotificationBell;

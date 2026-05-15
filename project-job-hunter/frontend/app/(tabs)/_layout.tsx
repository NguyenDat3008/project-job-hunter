import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, SHADOW, BORDER_RADIUS } from '@constants/theme';
import { notificationService } from '@services/notificationService';
import { useAuthStore } from '@store/authStore';

function NotificationIcon({ color, focused }: { color: string; focused: boolean }) {
  const [count, setCount] = React.useState(0);
  const { user, isAuthenticated } = useAuthStore();

  React.useEffect(() => {
    if (isAuthenticated && user) {
      const loadCount = async () => {
        try {
          const c = await notificationService.getUnreadCount();
          setCount(c);
        } catch (e) {
          // ignore
        }
      };
      loadCount();
      // Polling every 30s
      const interval = setInterval(loadCount, 30000);
      return () => clearInterval(interval);
    } else {
      setCount(0);
    }
  }, [isAuthenticated, user?.id]);

  return (
    <View>
      <Ionicons name={focused ? 'notifications' : 'notifications-outline'} size={24} color={color} />
      {count > 0 && (
        <View style={styles.notifBadge}>
          <Text style={styles.notifBadgeText}>{count > 9 ? '9+' : count}</Text>
        </View>
      )}
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.text.light,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Khám phá',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'compass' : 'compass-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="cv"
        options={{
          title: 'Hồ sơ',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'document-text' : 'document-text-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="ai-match"
        options={{
          title: 'Kết nối',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'people' : 'people-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Thông báo',
          tabBarIcon: ({ color, focused }) => <NotificationIcon color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Cá nhân',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen name="applications" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: COLORS.white,
    borderRadius: 24,
    height: 64,
    paddingBottom: 0,
    paddingTop: 0,
    borderTopWidth: 0,
    ...SHADOW.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 0,
  },
  notifBadge: {
    position: 'absolute',
    top: -2,
    right: -4,
    backgroundColor: COLORS.error,
    minWidth: 12,
    height: 12,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  notifBadgeText: {
    color: COLORS.white,
    fontSize: 7,
    fontWeight: '900',
  },
});
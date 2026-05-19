import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const Marker = (props: any) => {
  // Return children (like custom marker icons) to avoid breakages, otherwise null
  return props.children ? <View style={props.style}>{props.children}</View> : null;
};

export const UrlTile = (props: any) => {
  return null;
};

const MapView = React.forwardRef((props: any, ref: any) => {
  return (
    <View style={[styles.mapPlaceholder, props.style]} ref={ref}>
      <View style={styles.iconContainer}>
        <Ionicons name="map-outline" size={48} color="#9CA3AF" />
      </View>
      <Text style={styles.text}>Bản đồ chỉ hỗ trợ trên thiết bị di động</Text>
      <Text style={styles.subtext}>
        Vui lòng quét mã QR bằng ứng dụng Expo Go trên điện thoại để trải nghiệm đầy đủ tính năng bản đồ định vị.
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  mapPlaceholder: {
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
  },
  iconContainer: {
    marginBottom: 12,
    backgroundColor: '#E5E7EB',
    padding: 16,
    borderRadius: 40,
  },
  text: {
    color: '#1F2937',
    fontWeight: 'bold',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtext: {
    color: '#6B7280',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    maxWidth: 280,
  },
});

export default MapView;

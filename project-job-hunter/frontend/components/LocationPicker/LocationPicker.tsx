import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  Dimensions,
  ActivityIndicator,
  Platform,
  TextInput,
} from 'react-native';
import MapView, { Marker, UrlTile } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SHADOW, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '@constants/theme';

const { width, height } = Dimensions.get('window');

interface LocationPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (lat: number, lng: number, address?: string) => void;
  initialLocation?: { latitude: number; longitude: number };
}

const LocationPicker: React.FC<LocationPickerProps> = ({
  visible,
  onClose,
  onSelect,
  initialLocation,
}) => {
  const insets = useSafeAreaInsets();
  const [region, setRegion] = useState({
    latitude: initialLocation?.latitude || 21.0285,
    longitude: initialLocation?.longitude || 105.8542,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [selectedLocation, setSelectedLocation] = useState({
    latitude: initialLocation?.latitude || 21.0285,
    longitude: initialLocation?.longitude || 105.8542,
  });
  const [address, setAddress] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && !initialLocation) {
      getCurrentLocation();
    }
  }, [visible]);

  const getCurrentLocation = async () => {
    try {
      setLoading(true);
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLoading(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      const newRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      setRegion(newRegion);
      setSelectedLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      reverseGeocode(location.coords.latitude, location.coords.longitude);
    } catch (error) {
      console.error('Get current location error:', error);
    } finally {
      setLoading(false);
    }
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const [result] = await Location.reverseGeocodeAsync({
        latitude: lat,
        longitude: lng,
      });
      if (result) {
        const addr = `${result.name ? result.name + ', ' : ''}${result.street ? result.street + ', ' : ''}${result.district ? result.district + ', ' : ''}${result.city || result.region || ''}`;
        setAddress(addr);
      }
    } catch (error) {
      console.error('Reverse geocode error:', error);
    }
  };

  const handleMapPress = (e: any) => {
    const coords = e.nativeEvent.coordinate;
    setSelectedLocation(coords);
    reverseGeocode(coords.latitude, coords.longitude);
  };

  const handleConfirm = () => {
    onSelect(selectedLocation.latitude, selectedLocation.longitude, address);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn}>
            <Ionicons name="close" size={24} color={COLORS.text.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>Chọn vị trí trên bản đồ</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.mapWrapper}>
          <MapView
            style={styles.map}
            initialRegion={region}
            onPress={handleMapPress}
            showsUserLocation={true}
          >
            <UrlTile
              urlTemplate="https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maximumZ={19}
              flipY={false}
            />
            <Marker coordinate={selectedLocation} />
          </MapView>

          <TouchableOpacity style={styles.currentLocationBtn} onPress={getCurrentLocation}>
            <Ionicons name="locate" size={24} color={COLORS.primary} />
          </TouchableOpacity>

          {loading && (
            <View style={styles.loaderOverlay}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerLabel}>Địa chỉ xác định:</Text>
          <View style={styles.addressBox}>
            <Ionicons name="location" size={20} color={COLORS.primary} />
            <TextInput
              style={styles.addressInput}
              value={address}
              onChangeText={setAddress}
              placeholder="Nhập địa chỉ hoặc chọn trên bản đồ..."
              multiline
            />
          </View>
          <Text style={styles.hintText}>
            Bạn có thể chỉnh sửa địa chỉ trên nếu bản đồ định vị chưa hoàn toàn chính xác.
          </Text>
          <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
            <Text style={styles.confirmBtnText}>Xác nhận vị trí này</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingTop: 16, // Base padding
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...TYPOGRAPHY.body1,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  mapWrapper: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  currentLocationBtn: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOW.md,
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    ...SHADOW.lg,
  },
  addressBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
    padding: SPACING.sm,
    backgroundColor: COLORS.gray[50],
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  addressInput: {
    flex: 1,
    ...TYPOGRAPHY.body2,
    color: COLORS.text.primary,
    paddingTop: 0,
    minHeight: 40,
  },
  footerLabel: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.text.secondary,
    marginBottom: 6,
  },
  hintText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.light,
    fontSize: 10,
    marginBottom: SPACING.lg,
    fontStyle: 'italic',
  },
  confirmBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: 16,
    alignItems: 'center',
    ...SHADOW.md,
  },
  confirmBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
});

export default LocationPicker;

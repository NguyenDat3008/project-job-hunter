import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOW } from '@constants/theme';
import TextField from '@components/TextField/TextField';
import Button from '@components/Button/Button';
import { LocationPicker } from '@components/index';
import { Ionicons } from '@expo/vector-icons';
import api from '@services/api';
import { ENDPOINTS } from '@constants/endpoints';

const RegisterCompanyScreen = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    website: '',
    description: '',
    industry: '',
    size: '',
    latitude: 0,
    longitude: 0,
  });
  const [showMap, setShowMap] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.address) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên và địa chỉ công ty.');
      return;
    }

    setLoading(true);
    try {
      await api.post(ENDPOINTS.COMPANIES.CREATE, formData);
      Alert.alert(
        'Thành công',
        'Yêu cầu đăng ký đã được gửi. Vui lòng chờ Admin xác minh và liên hệ.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể gửi yêu cầu đăng ký.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <Stack.Screen
        options={{
          headerTitle: 'Đăng ký doanh nghiệp',
          headerTintColor: COLORS.text.primary,
          headerShadowVisible: false,
        }}
      />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="business" size={40} color={COLORS.primary} />
          </View>
          <Text style={styles.title}>Tham gia mạng lưới Job Hunter</Text>
          <Text style={styles.subtitle}>
            Điền thông tin doanh nghiệp của bạn để bắt đầu đăng tin tuyển dụng.
          </Text>
        </View>

        <View style={styles.form}>
          <TextField
            label="Tên công ty *"
            placeholder="Ví dụ: FPT Software"
            value={formData.name}
            onChangeText={(text) => handleInputChange('name', text)}
          />
          <View style={styles.addressContainer}>
            <View style={{ flex: 1 }}>
              <TextField
                label="Địa chỉ trụ sở *"
                placeholder="Số, Đường, Quận, Thành phố"
                value={formData.address}
                onChangeText={(text) => handleInputChange('address', text)}
              />
            </View>
            <TouchableOpacity 
              style={styles.mapBtn} 
              onPress={() => setShowMap(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="map-outline" size={24} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          <LocationPicker
            visible={showMap}
            onClose={() => setShowMap(false)}
            onSelect={(lat, lng, addr) => {
              setFormData(prev => ({ 
                ...prev, 
                latitude: lat, 
                longitude: lng,
                address: addr || prev.address 
              }));
            }}
          />
          <TextField
            label="Website"
            placeholder="https://example.com"
            value={formData.website}
            onChangeText={(text) => handleInputChange('website', text)}
          />
          <TextField
            label="Lĩnh vực kinh doanh"
            placeholder="Ví dụ: Công nghệ thông tin"
            value={formData.industry}
            onChangeText={(text) => handleInputChange('industry', text)}
          />
          <TextField
            label="Quy mô nhân sự"
            placeholder="Ví dụ: 100-500 nhân viên"
            value={formData.size}
            onChangeText={(text) => handleInputChange('size', text)}
          />
          <TextField
            label="Mô tả ngắn gọn"
            placeholder="Giới thiệu về công ty của bạn..."
            value={formData.description}
            onChangeText={(text) => handleInputChange('description', text)}
            multiline
            numberOfLines={4}
            style={styles.textArea}
          />

          <Button
            title="Gửi yêu cầu đăng ký"
            onPress={handleSubmit}
            isLoading={loading}
            style={styles.submitBtn}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text.primary,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  subtitle: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  form: {
    gap: SPACING.md,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  submitBtn: {
    marginTop: SPACING.lg,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: SPACING.sm,
  },
  mapBtn: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.gray[50],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 0, // Align with TextField input
  },
});

export default RegisterCompanyScreen;

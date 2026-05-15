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
  });

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
          <TextField
            label="Địa chỉ trụ sở *"
            placeholder="Số, Đường, Quận, Thành phố"
            value={formData.address}
            onChangeText={(text) => handleInputChange('address', text)}
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
});

export default RegisterCompanyScreen;

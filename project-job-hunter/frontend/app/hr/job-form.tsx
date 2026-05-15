// app/hr/job-form.tsx
// Màn hình Tạo/Sửa việc làm — Dành cho HR & Company Representative
// Sử dụng useState chuẩn để tránh phụ thuộc vào thư viện bên ngoài (react-hook-form)

import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BORDER_RADIUS, COLORS, SHADOW, SPACING, TYPOGRAPHY } from '@constants/theme';
import { jobService } from '@services/jobService';
import api from '@services/api';
import { ENDPOINTS } from '@constants/endpoints';
import LoadingSpinner from '@components/LoadingSpinner/LoadingSpinner';

const LEVELS = ['INTERN', 'FRESHER', 'JUNIOR', 'MIDDLE', 'SENIOR', 'LEAD', 'MANAGER'];

export default function JobFormScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const isEdit = !!id;

  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    salary: '',
    quantity: '1',
    location: 'Hà Nội',
    level: 'JUNIOR',
    description: '',
    skills: '',
    startDate: '',
    endDate: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isEdit) {
      loadJobData();
    }
  }, [id]);

  const loadJobData = async () => {
    try {
      const job = await jobService.getJobById(Number(id));
      setFormData({
        name: job.name,
        salary: job.salary.toString(),
        quantity: job.quantity.toString(),
        location: job.location,
        level: job.level,
        description: job.description,
        skills: (job.skills || []).map(s => s.name).join(', '),
        startDate: job.startDate ? job.startDate.split('T')[0] : '',
        endDate: job.endDate ? job.endDate.split('T')[0] : '',
      });
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể tải thông tin công việc.');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name) newErrors.name = 'Vui lòng nhập tên công việc';
    if (!formData.salary) newErrors.salary = 'Vui lòng nhập lương';
    if (!formData.skills) newErrors.skills = 'Vui lòng nhập ít nhất 1 kỹ năng';
    if (!formData.description) newErrors.description = 'Vui lòng nhập mô tả';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      setSubmitting(true);
      
      const skillsArray = formData.skills.split(',').map(s => ({ name: s.trim() })).filter(s => s.name);

      const payload = {
        name: formData.name,
        salary: Number(formData.salary),
        quantity: Number(formData.quantity),
        location: formData.location,
        level: formData.level,
        description: formData.description,
        skills: skillsArray,
        startDate: formData.startDate ? `${formData.startDate}T00:00:00Z` : undefined,
        endDate: formData.endDate ? `${formData.endDate}T23:59:59Z` : undefined,
        active: true,
      };

      if (isEdit) {
        await api.put(ENDPOINTS.JOBS.UPDATE, { ...payload, id: Number(id) });
        Alert.alert('Thành công', 'Cập nhật tin tuyển dụng thành công.');
      } else {
        await api.post(ENDPOINTS.JOBS.CREATE, payload);
        Alert.alert('Thành công', 'Đăng tin tuyển dụng thành công.');
      }
      router.back();
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
      style={{ flex: 1 }}
    >
      <Stack.Screen options={{ title: isEdit ? 'Sửa tin tuyển dụng' : 'Đăng tin mới' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Tên vị trí tuyển dụng *</Text>
          <TextInput
            style={[styles.input, !!errors.name && styles.inputError]}
            value={formData.name}
            onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
            placeholder="VD: Senior React Native Developer"
          />
          {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
            <Text style={styles.label}>Mức lương (VNĐ) *</Text>
            <TextInput
              style={[styles.input, !!errors.salary && styles.inputError]}
              value={formData.salary}
              onChangeText={(text) => setFormData(prev => ({ ...prev, salary: text }))}
              keyboardType="numeric"
              placeholder="VD: 20000000"
            />
            {errors.salary && <Text style={styles.errorText}>{errors.salary}</Text>}
          </View>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>Số lượng tuyển *</Text>
            <TextInput
              style={styles.input}
              value={formData.quantity}
              onChangeText={(text) => setFormData(prev => ({ ...prev, quantity: text }))}
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Địa điểm làm việc *</Text>
          <TextInput
            style={styles.input}
            value={formData.location}
            onChangeText={(text) => setFormData(prev => ({ ...prev, location: text }))}
            placeholder="VD: Hà Nội"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Cấp bậc</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.levelList}>
            {LEVELS.map(level => (
              <TouchableOpacity
                key={level}
                style={[styles.levelChip, formData.level === level && styles.levelChipActive]}
                onPress={() => setFormData(prev => ({ ...prev, level }))}
              >
                <Text style={[styles.levelChipText, formData.level === level && styles.levelChipTextActive]}>
                  {level}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Kỹ năng (cách nhau bằng dấu phẩy) *</Text>
          <TextInput
            style={[styles.input, !!errors.skills && styles.inputError]}
            value={formData.skills}
            onChangeText={(text) => setFormData(prev => ({ ...prev, skills: text }))}
            placeholder="VD: Java, Spring Boot, SQL"
          />
          {errors.skills && <Text style={styles.errorText}>{errors.skills}</Text>}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Mô tả công việc *</Text>
          <TextInput
            style={[styles.input, styles.textArea, !!errors.description && styles.inputError]}
            value={formData.description}
            onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            placeholder="Mô tả chi tiết công việc, yêu cầu và quyền lợi..."
          />
          {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
            <Text style={styles.label}>Ngày bắt đầu (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              value={formData.startDate}
              onChangeText={(text) => setFormData(prev => ({ ...prev, startDate: text }))}
              placeholder="2024-05-01"
            />
          </View>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>Ngày kết thúc (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              value={formData.endDate}
              onChangeText={(text) => setFormData(prev => ({ ...prev, endDate: text }))}
              placeholder="2024-06-01"
            />
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.submitBtn, submitting && { opacity: 0.7 }]} 
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <Text style={styles.submitBtnText}>Đang xử lý...</Text>
          ) : (
            <>
              <Ionicons name="cloud-upload-outline" size={20} color={COLORS.white} />
              <Text style={styles.submitBtnText}>{isEdit ? 'Cập nhật tin' : 'Đăng tin ngay'}</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  content: {
    padding: SPACING.lg,
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  label: {
    ...TYPOGRAPHY.body2,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.text.primary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  textArea: {
    height: 120,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
  },
  levelList: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  levelChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.background.secondary,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  levelChipActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  levelChipText: {
    fontSize: 12,
    color: COLORS.text.secondary,
    fontWeight: '600',
  },
  levelChipTextActive: {
    color: COLORS.primary,
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.lg,
    gap: 8,
    ...SHADOW.md,
  },
  submitBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
});

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  StatusBar,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { COLORS, SHADOW, SPACING, TYPOGRAPHY } from '@constants/theme';
import { Button, LoadingSpinner } from '@components/index';
import { cvService } from '@services/cvService';
import { jobService } from '@services/jobService';
import { useAuthStore } from '@store/authStore';

export default function ApplyScreen() {
  const router = useRouter();
  const { jobId, jobName } = useLocalSearchParams<{ jobId: string, jobName: string }>();
  const { user } = useAuthStore();

  const [cvFile, setCvFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [location, setLocation] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [isAgreed, setIsAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        if (file.size && file.size > 5 * 1024 * 1024) {
          Alert.alert('Lỗi', 'File không được vượt quá 5MB');
          return;
        }
        setCvFile(file);
      }
    } catch (error) {
      console.error('Error picking document:', error);
    }
  };

  const handleSubmit = async () => {
    if (!cvFile) {
      Alert.alert('Thông báo', 'Vui lòng tải CV lên');
      return;
    }
    if (!location.trim()) {
      Alert.alert('Thông báo', 'Vui lòng chọn địa điểm làm việc mong muốn');
      return;
    }
    if (!isAgreed) {
      Alert.alert('Thông báo', 'Bạn cần đồng ý với Thoả thuận sử dụng dữ liệu');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Upload CV
      const fileToUpload = {
        uri: cvFile.uri,
        name: cvFile.name,
        type: cvFile.mimeType || 'application/pdf',
      };
      const fileNameOnServer = await cvService.uploadCV(fileToUpload);

      // 2. Submit Application
      // Note: We can expand the API to accept location and cover letter if backend supports it.
      // For now, we'll follow the existing applyJob signature and maybe add metadata if needed.
      await jobService.applyJob({
        jobId: parseInt(jobId as string, 10),
        email: user?.email || '',
        url: fileNameOnServer,
        userId: user?.id,
        location: location,
        coverLetter: coverLetter,
      });

      Alert.alert('Thành công', 'Hồ sơ của bạn đã được gửi đi thành công!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      console.error('Submit application error:', error);
      Alert.alert('Lỗi', error?.message || 'Không thể gửi hồ sơ lúc này. Vui lòng thử lại sau.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitting) return <LoadingSpinner fullScreen message="Đang gửi hồ sơ..." />;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ứng tuyển</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <Text style={styles.sectionTitle}>CV ứng tuyển</Text>
          
          <TouchableOpacity 
            style={[styles.uploadContainer, cvFile && styles.uploadContainerActive]} 
            onPress={handlePickDocument}
          >
            <View style={styles.radioRow}>
              <View style={[styles.radio, { borderColor: COLORS.primary }]}>
                <View style={[styles.radioInner, { backgroundColor: COLORS.primary }]} />
              </View>
              <Text style={styles.radioText}>Tải CV lên từ điện thoại</Text>
            </View>

            <View style={styles.dropZone}>
              <View style={styles.uploadIconCircle}>
                <Feather name="upload-cloud" size={32} color={COLORS.primary} />
              </View>
              <Text style={styles.uploadText}>
                {cvFile ? cvFile.name : 'Nhấn để tải lên'}
              </Text>
              <Text style={styles.uploadSubtext}>
                Hỗ trợ định dạng .doc, .docx, pdf có kích thước dưới <Text style={{fontWeight: '700'}}>5MB</Text>
              </Text>
            </View>
          </TouchableOpacity>

          <View style={styles.inputSection}>
            <Text style={styles.label}>Địa điểm làm việc mong muốn <Text style={{color: COLORS.error}}>*</Text></Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Chọn địa điểm làm việc"
                placeholderTextColor={COLORS.text.tertiary}
                value={location}
                onChangeText={setLocation}
              />
            </View>
          </View>

          <View style={styles.inputSection}>
            <Text style={styles.label}>Thư giới thiệu</Text>
            <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Viết giới thiệu ngắn gọn về bản thân (điểm mạnh, điểm yếu) và nêu rõ mong muốn, lý do làm việc tại công ty này"
                placeholderTextColor={COLORS.text.tertiary}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                value={coverLetter}
                onChangeText={setCoverLetter}
              />
            </View>
          </View>

          <View style={styles.noteSection}>
            <Text style={styles.noteTitle}>Lưu ý</Text>
            <Text style={styles.noteItem}>
              1. TopCV khuyên tất cả các bạn hãy luôn cẩn trọng trong quá trình tìm việc và chủ động nghiên cứu về thông tin công ty, vị trí việc làm trước khi ứng tuyển.Ứng viên cần có trách nhiệm với hành vi ứng tuyển của mình. Nếu bạn gặp phải tin tuyển dụng hoặc nhận được liên lạc đáng ngờ của nhà tuyển dụng, hãy báo cáo ngay cho TopCV qua email <Text style={styles.linkText}>hotro@topcv.vn</Text> để được hỗ trợ kịp thời.
            </Text>
            <Text style={styles.noteItem}>
              2. Tìm hiểu thêm kinh nghiệm phòng tránh lừa đảo <Text style={styles.linkText}>tại đây</Text>.
            </Text>
          </View>

          <TouchableOpacity 
            style={styles.agreementRow} 
            onPress={() => setIsAgreed(!isAgreed)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, isAgreed && styles.checkboxActive]}>
              {isAgreed && <Ionicons name="checkmark" size={14} color={COLORS.white} />}
            </View>
            <Text style={styles.agreementText}>
              Tôi đã đọc và đồng ý với <Text style={styles.linkText}>Thoả thuận sử dụng dữ liệu cá nhân</Text> giữa tôi và Nhà tuyển dụng.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.submitBtn, !isAgreed && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={!isAgreed || isSubmitting}
          >
            <Text style={styles.submitBtnText}>Ứng tuyển</Text>
          </TouchableOpacity>
          
          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  scrollContent: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 20,
  },
  uploadContainer: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  uploadContainerActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#F0FDF4',
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  radioText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  dropZone: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.primary,
    borderRadius: 8,
    padding: 24,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 177, 79, 0.02)',
  },
  uploadIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E6F7ED',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  uploadText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  uploadSubtext: {
    fontSize: 13,
    color: COLORS.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  inputSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 10,
  },
  inputWrapper: {
    borderWidth: 1,
    borderColor: '#EEEEEE',
    borderRadius: 8,
    backgroundColor: '#FAFAFA',
  },
  input: {
    paddingHorizontal: 16,
    height: 52,
    fontSize: 15,
    color: COLORS.text.primary,
  },
  textAreaWrapper: {
    minHeight: 120,
  },
  textArea: {
    height: 'auto',
    paddingTop: 12,
    paddingBottom: 12,
  },
  noteSection: {
    marginBottom: 24,
  },
  noteTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 12,
  },
  noteItem: {
    fontSize: 13,
    color: COLORS.text.secondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  linkText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  agreementRow: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#CCCCCC',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkboxActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  agreementText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.text.secondary,
    lineHeight: 18,
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    height: 52,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOW.sm,
  },
  submitBtnDisabled: {
    backgroundColor: '#CCCCCC',
  },
  submitBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
});

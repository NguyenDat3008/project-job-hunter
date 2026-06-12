import React, { useState, useEffect } from 'react';
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
  ActivityIndicator,
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
import { generalStorage } from '@/utils/storage';
import dayjs from 'dayjs';

export default function ApplyScreen() {
  const router = useRouter();
  const { jobId, jobName } = useLocalSearchParams<{ jobId: string, jobName: string }>();
  const { user } = useAuthStore();

  const [cvFile, setCvFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [location, setLocation] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [isAgreed, setIsAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // States for choosing existing CV
  const [uploadType, setUploadType] = useState<'picker' | 'existing'>('picker');
  const [existingCvs, setExistingCvs] = useState<any[]>([]);
  const [selectedExistingCv, setSelectedExistingCv] = useState<any | null>(null);
  const [loadingCvs, setLoadingCvs] = useState(false);

  // User-specific storage key
  const storageKey = user?.email ? `uploaded_cvs_${user.email}` : 'uploaded_cvs_guest';

  useEffect(() => {
    const loadCvs = async () => {
      try {
        setLoadingCvs(true);
        // 1. Fetch server resumes (CVs used to apply)
        const data = await cvService.getCVs();
        const serverList = data?.result || [];

        // 2. Fetch local storage CVs (directly uploaded)
        const localCvs = await generalStorage.get<any[]>(storageKey) || [];

        // Combine and deduplicate by URL
        const combined = [...localCvs, ...serverList];
        const uniqueCvs = combined.filter((v: any, i: any, a: any) => a.findIndex((t: any) => t.url === v.url) === i);

        // Sort by date descending
        uniqueCvs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        setExistingCvs(uniqueCvs);
      } catch (error) {
        console.error('Error loading existing CVs:', error);
      } finally {
        setLoadingCvs(false);
      }
    };
    loadCvs();
  }, [user?.email]);

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
        
        // Check file extension strictly
        const name = file.name || '';
        const allowedExtensions = ['pdf', 'doc', 'docx'];
        const fileExtension = name.split('.').pop()?.toLowerCase();
        if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
          Alert.alert('Lỗi', 'Chỉ chấp nhận file CV ở định dạng: .pdf, .doc, .docx');
          return;
        }

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
    if (uploadType === 'picker' && !cvFile) {
      Alert.alert('Thông báo', 'Vui lòng tải CV lên');
      return;
    }
    if (uploadType === 'existing' && !selectedExistingCv) {
      Alert.alert('Thông báo', 'Vui lòng chọn CV đã tải lên');
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
      let fileNameOnServer = '';

      if (uploadType === 'picker' && cvFile) {
        // 1. Upload CV
        const fileToUpload = {
          uri: cvFile.uri,
          name: cvFile.name,
          type: cvFile.mimeType || 'application/pdf',
        };
        fileNameOnServer = await cvService.uploadCV(fileToUpload);
      } else if (uploadType === 'existing' && selectedExistingCv) {
        fileNameOnServer = selectedExistingCv.url;
      }

      // 2. Submit Application
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
          
          {/* Option 1: Tải CV mới */}
          <TouchableOpacity 
            style={[
              styles.optionCard, 
              uploadType === 'picker' && styles.optionCardActive
            ]}
            onPress={() => setUploadType('picker')}
            activeOpacity={0.8}
          >
            <View style={styles.radioRow}>
              <View style={[styles.radio, { borderColor: uploadType === 'picker' ? COLORS.primary : COLORS.gray[300] }]}>
                {uploadType === 'picker' && <View style={[styles.radioInner, { backgroundColor: COLORS.primary }]} />}
              </View>
              <Text style={styles.radioText}>Tải CV mới từ điện thoại</Text>
            </View>

            {uploadType === 'picker' && (
              <TouchableOpacity 
                style={[styles.dropZone, cvFile && styles.dropZoneActive]} 
                onPress={handlePickDocument}
                activeOpacity={0.7}
              >
                <View style={styles.uploadIconCircle}>
                  <Feather name="upload-cloud" size={24} color={COLORS.primary} />
                </View>
                <Text style={styles.uploadText}>
                  {cvFile ? cvFile.name : 'Chọn file từ thiết bị'}
                </Text>
                <Text style={styles.uploadSubtext}>
                  Định dạng .doc, .docx, .pdf dưới 5MB
                </Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>

          {/* Option 2: Chọn CV sẵn có */}
          <TouchableOpacity 
            style={[
              styles.optionCard, 
              uploadType === 'existing' && styles.optionCardActive
            ]}
            onPress={() => setUploadType('existing')}
            activeOpacity={0.8}
          >
            <View style={styles.radioRow}>
              <View style={[styles.radio, { borderColor: uploadType === 'existing' ? COLORS.primary : COLORS.gray[300] }]}>
                {uploadType === 'existing' && <View style={[styles.radioInner, { backgroundColor: COLORS.primary }]} />}
              </View>
              <Text style={styles.radioText}>Chọn từ CV đã tải lên ({existingCvs.length})</Text>
            </View>

            {uploadType === 'existing' && (
              <View style={styles.existingContainer}>
                {loadingCvs ? (
                  <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: 12 }} />
                ) : existingCvs.length === 0 ? (
                  <Text style={styles.noExistingText}>Bạn chưa tải lên CV nào trước đây.</Text>
                ) : (
                  existingCvs.map((cv) => {
                    const isSelected = selectedExistingCv?.id === cv.id;
                    const cleanName = cv.url.replace(/^\d+-/, '');
                    return (
                      <TouchableOpacity
                        key={cv.id}
                        style={[
                          styles.cvItemCard,
                          isSelected && styles.cvItemCardActive
                        ]}
                        onPress={() => setSelectedExistingCv(cv)}
                        activeOpacity={0.7}
                      >
                        <Ionicons 
                          name="document-text" 
                          size={22} 
                          color={isSelected ? COLORS.primary : COLORS.gray[400]} 
                        />
                        <View style={{ flex: 1, marginLeft: 8 }}>
                          <Text style={styles.cvItemName} numberOfLines={1}>{cleanName}</Text>
                          <Text style={styles.cvItemDate}>
                            Ngày: {dayjs(cv.createdAt).format('DD/MM/YYYY')}
                          </Text>
                        </View>
                        {isSelected && (
                          <Ionicons name="checkmark-circle" size={18} color={COLORS.primary} />
                        )}
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>
            )}
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
  optionCard: {
    borderWidth: 1,
    borderColor: '#EEEEEE',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    backgroundColor: '#FAFAFA',
  },
  optionCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#FFFFFF',
  },
  dropZoneActive: {
    backgroundColor: '#F0FDF4',
    borderColor: COLORS.primary,
  },
  existingContainer: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    paddingTop: 12,
  },
  noExistingText: {
    fontSize: 13,
    color: COLORS.text.secondary,
    textAlign: 'center',
    paddingVertical: 10,
  },
  cvItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 8,
    backgroundColor: '#F9FAFB',
  },
  cvItemCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#F0FDF4',
  },
  cvItemName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  cvItemDate: {
    fontSize: 11,
    color: COLORS.text.secondary,
    marginTop: 2,
  },
});

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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { COLORS, SHADOW, SPACING, TYPOGRAPHY } from '@constants/theme';
import { Button, LoadingSpinner } from '@components/index';
import { jobService } from '@services/jobService';
import { useAuthStore } from '@store/authStore';

type ReasonType = 'FRAUD' | 'INCORRECT' | 'OTHER';

export default function ReportScreen() {
  const router = useRouter();
  const { jobId, jobName: paramJobName } = useLocalSearchParams<{ jobId: string; jobName: string }>();
  const { user } = useAuthStore();

  const [jobName, setJobName] = useState(paramJobName || 'Đang tải...');
  const [selectedReason, setSelectedReason] = useState<ReasonType>('FRAUD');
  const [otherDetail, setOtherDetail] = useState('');
  
  // User info fields
  const [fullName, setFullName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Nếu chưa có tên công việc, tải bổ sung từ server
    if (!paramJobName && jobId) {
      jobService.getJobById(parseInt(jobId, 10))
        .then(job => setJobName(job.name))
        .catch(() => setJobName('Tin tuyển dụng'));
    }
  }, [jobId, paramJobName]);

  const handleSubmit = async () => {
    // Kiểm tra hợp lệ các trường bắt buộc
    if (!fullName.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập Họ và tên');
      return;
    }
    if (!email.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập Email');
      return;
    }
    if (!phoneNumber.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập Số điện thoại');
      return;
    }
    if (!address.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập Địa chỉ');
      return;
    }

    // Xử lý lý do báo cáo
    let reasonText = '';
    if (selectedReason === 'FRAUD') {
      reasonText = 'Tin đăng có dấu hiệu lừa đảo';
    } else if (selectedReason === 'INCORRECT') {
      reasonText = 'Thông tin đăng không chính xác';
    } else {
      if (!otherDetail.trim()) {
        Alert.alert('Thông báo', 'Vui lòng nhập chi tiết lý do khác');
        return;
      }
      reasonText = `Lý do khác: ${otherDetail.trim()}`;
    }

    // Ghép thông tin người báo cáo vào nội dung gửi lên
    const combinedReason = `${reasonText} | Người báo cáo: ${fullName} (SĐT: ${phoneNumber}, Địa chỉ: ${address}, Email: ${email})`;

    setIsSubmitting(true);
    try {
      await jobService.reportJob(parseInt(jobId as string, 10), combinedReason);
      
      Alert.alert(
        'Báo cáo thành công',
        'Cảm ơn bạn đã phản ánh thông tin. Chúng tôi sẽ tiến hành kiểm duyệt lại tin tuyển dụng này trong thời gian sớm nhất!',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error: any) {
      console.error('Report job error:', error);
      Alert.alert('Lỗi', error?.message || 'Không thể gửi báo cáo vào lúc này. Vui lòng thử lại sau.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitting) return <LoadingSpinner fullScreen message="Đang gửi báo cáo của bạn..." />;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" />

      {/* Header giống mockup */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Báo cáo tin tuyển dụng</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          {/* Hộp cảnh báo màu xám nhạt giống mockup */}
          <View style={styles.warningBox}>
            <Text style={styles.warningTitle}>Báo cáo tin tuyển dụng không chính xác</Text>
            <Text style={styles.warningText}>
              Hãy tìm hiểu kỹ về nhà tuyển dụng và công việc bạn ứng tuyển. Bạn nên cẩn trọng với những công việc yêu cầu nộp phí, hoặc những hợp đồng mập mờ, không rõ ràng. Nếu bạn thấy rằng tin tuyển dụng này không đúng, hãy phản ánh với chúng tôi.
            </Text>
          </View>

          {/* Tin tuyển dụng */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tin tuyển dụng</Text>
            <Text style={styles.jobNameText}>{jobName}</Text>
            <View style={styles.separator} />
          </View>

          {/* Lý do báo cáo */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Lý do báo cáo <Text style={{ color: COLORS.error }}>*</Text>
            </Text>

            {/* Radio Button 1 */}
            <TouchableOpacity
              style={styles.radioOption}
              onPress={() => setSelectedReason('FRAUD')}
              activeOpacity={0.7}
            >
              <View style={[styles.radioCircle, selectedReason === 'FRAUD' && styles.radioCircleActive]}>
                {selectedReason === 'FRAUD' && <View style={styles.radioDot} />}
              </View>
              <Text style={styles.radioLabel}>Tin đăng có dấu hiệu lừa đảo</Text>
            </TouchableOpacity>

            {/* Radio Button 2 */}
            <TouchableOpacity
              style={styles.radioOption}
              onPress={() => setSelectedReason('INCORRECT')}
              activeOpacity={0.7}
            >
              <View style={[styles.radioCircle, selectedReason === 'INCORRECT' && styles.radioCircleActive]}>
                {selectedReason === 'INCORRECT' && <View style={styles.radioDot} />}
              </View>
              <Text style={styles.radioLabel}>Thông tin đăng không chính xác</Text>
            </TouchableOpacity>

            {/* Radio Button 3 */}
            <TouchableOpacity
              style={styles.radioOption}
              onPress={() => setSelectedReason('OTHER')}
              activeOpacity={0.7}
            >
              <View style={[styles.radioCircle, selectedReason === 'OTHER' && styles.radioCircleActive]}>
                {selectedReason === 'OTHER' && <View style={styles.radioDot} />}
              </View>
              <Text style={styles.radioLabel}>Lý do khác</Text>
            </TouchableOpacity>

            {/* Ô nhập chi tiết lý do nếu chọn lý do khác */}
            {selectedReason === 'OTHER' && (
              <View style={styles.otherInputContainer}>
                <TextInput
                  style={styles.otherTextInput}
                  placeholder="Vui lòng mô tả chi tiết lý do báo cáo khác..."
                  placeholderTextColor={COLORS.text.tertiary}
                  multiline
                  numberOfLines={4}
                  value={otherDetail}
                  onChangeText={setOtherDetail}
                  textAlignVertical="top"
                />
              </View>
            )}

            <View style={styles.separator} />
          </View>

          {/* Thông tin của bạn */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thông tin của bạn</Text>

            {/* Họ và tên */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="Họ và tên *"
                placeholderTextColor={COLORS.text.tertiary}
                value={fullName}
                onChangeText={setFullName}
              />
            </View>

            {/* Email */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="Email *"
                placeholderTextColor={COLORS.text.tertiary}
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
              />
            </View>

            {/* Số điện thoại */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="Số điện thoại *"
                placeholderTextColor={COLORS.text.tertiary}
                keyboardType="phone-pad"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
              />
            </View>

            {/* Địa chỉ */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="Địa chỉ *"
                placeholderTextColor={COLORS.text.tertiary}
                value={address}
                onChangeText={setAddress}
              />
            </View>
          </View>

          {/* Nút báo cáo màu đỏ giống mockup */}
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleSubmit}
            activeOpacity={0.8}
          >
            <Text style={styles.submitBtnText}>Báo cáo</Text>
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
    borderBottomColor: '#F3F4F6',
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
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  warningBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  warningTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 20,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
  },
  jobNameText: {
    fontSize: 15,
    color: '#334155',
    fontWeight: '600',
    marginBottom: 16,
  },
  separator: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginTop: 16,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 4,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  radioCircleActive: {
    borderColor: '#00B14F', // Tông xanh lá thương hiệu TopCV/COLORS.primary
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#00B14F',
  },
  radioLabel: {
    fontSize: 15,
    color: '#334155',
    fontWeight: '500',
  },
  otherInputContainer: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    padding: 12,
    marginTop: 4,
    marginBottom: 8,
  },
  otherTextInput: {
    fontSize: 14,
    color: '#1E293B',
    minHeight: 80,
  },
  inputContainer: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  textInput: {
    paddingHorizontal: 16,
    height: 48,
    fontSize: 15,
    color: '#1E293B',
  },
  submitBtn: {
    backgroundColor: '#DC2626', // Màu đỏ giống mockup của người dùng
    height: 52,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    ...SHADOW.sm,
  },
  submitBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
});

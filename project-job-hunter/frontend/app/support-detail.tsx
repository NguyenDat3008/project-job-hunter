import React from 'react';
import { ScrollView, StyleSheet, Text, View, TouchableOpacity, StatusBar } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, SHADOW } from '@constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SupportDetailScreen() {
  const router = useRouter();
  const { title } = useLocalSearchParams<{ title: string }>();

  // Mock content based on title
  const getContent = () => {
    switch (title) {
      case 'Về TopCV':
        return 'TopCV là hệ sinh thái công nghệ nhân sự hàng đầu Việt Nam. Chúng tôi kết nối hàng triệu ứng viên với những cơ hội việc làm hấp dẫn từ các doanh nghiệp uy tín.\n\nVới công nghệ AI tiên tiến, TopCV giúp bạn tối ưu hóa CV và tìm kiếm công việc phù hợp nhất với năng lực của mình.';
      case 'Điều khoản dịch vụ':
        return '1. Chấp nhận điều khoản: Bằng việc sử dụng ứng dụng, bạn đồng ý với các điều khoản này.\n\n2. Quyền sở hữu: Toàn bộ nội dung trên ứng dụng thuộc sở hữu của TopCV.\n\n3. Trách nhiệm người dùng: Bạn chịu trách nhiệm về tính chính xác của thông tin hồ sơ đã cung cấp.\n\n4. Thay đổi điều khoản: Chúng tôi có quyền cập nhật điều khoản này bất cứ lúc nào.';
      case 'Chính sách bảo mật':
        return 'Chúng tôi cam kết bảo vệ thông tin cá nhân của bạn.\n\n• Thu thập dữ liệu: Chúng tôi thu thập thông tin bạn cung cấp (tên, email, số điện thoại, CV).\n\n• Sử dụng dữ liệu: Dữ liệu được dùng để kết nối bạn với nhà tuyển dụng phù hợp.\n\n• Chia sẻ dữ liệu: Chúng tôi chỉ chia sẻ thông tin khi bạn cho phép hoặc theo yêu cầu pháp luật.';
      case 'Trợ giúp và liên hệ':
        return 'Bạn cần hỗ trợ? Liên hệ với chúng tôi qua các kênh sau:\n\n• Hotline: 1900 123 456\n• Email: hotro@topcv.vn\n• Địa chỉ: Tòa nhà TopCV, Số 1 Đại Cồ Việt, Hà Nội.\n\nThời gian làm việc: 8:00 - 18:00 (Thứ 2 - Thứ 6).';
      default:
        return 'Nội dung chi tiết đang được cập nhật. Vui lòng quay lại sau.';
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView edges={['top']} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title || 'Chi tiết'}</Text>
        <View style={styles.placeholder} />
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.contentText}>{getContent()}</Text>
        </View>
        
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={20} color={COLORS.primary} />
          <Text style={styles.infoText}>Nếu bạn có thắc mắc khác, vui lòng gửi phản hồi cho chúng tôi.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: COLORS.white,
    ...SHADOW.sm,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  placeholder: {
    width: 32,
  },
  content: {
    padding: 16,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 20,
    ...SHADOW.sm,
    borderWidth: 0.5,
    borderColor: '#EEEEEE',
  },
  contentText: {
    fontSize: 14,
    lineHeight: 22,
    color: COLORS.text.secondary,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
    gap: 10,
  },
  infoText: {
    fontSize: 12,
    color: COLORS.primary,
    flex: 1,
    lineHeight: 18,
  },
});

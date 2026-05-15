import { Button, Header } from '@/components';
import { COLORS, SHADOW } from '@/constants/theme';
import { cvService } from '@/services/cvService';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function UploadCVScreen() {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<any>(null);

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });

      if (result.canceled === false && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        // Check size (< 5MB)
        if (file.size && file.size > 5 * 1024 * 1024) {
          Alert.alert('Lỗi', 'File không được vượt quá 5MB');
          return;
        }

        setSelectedFile({
          uri: file.uri,
          name: file.name,
          mimeType: file.mimeType || 'application/pdf',
          size: file.size ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : 'Unknown',
        });
      }
    } catch (err) {
      console.warn('Error picking document', err);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    try {
      // Format file for FormData
      const fileToUpload = {
        uri: selectedFile.uri,
        name: selectedFile.name,
        type: selectedFile.mimeType,
      };

      await cvService.uploadCV(fileToUpload);
      
      Alert.alert('Thành công', 'CV của bạn đã được tải lên hệ thống', [
        { text: 'Xong', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Upload CV Error:', error);
      Alert.alert('Lỗi', 'Không thể tải CV lên lúc này. Vui lòng kiểm tra kết nối.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Tải CV lên" onBack={() => router.back()} />
      
      <View style={styles.content}>
        <Text style={styles.title}>Tải CV từ điện thoại</Text>
        <Text style={styles.subtitle}>Hệ thống hỗ trợ định dạng .doc, .docx, .pdf dưới 5MB</Text>

        {!selectedFile ? (
          <TouchableOpacity 
            style={styles.uploadArea} 
            onPress={handlePickDocument}
            activeOpacity={0.6}
          >
            <View style={styles.iconCircle}>
              <Ionicons name="cloud-upload-outline" size={32} color={COLORS.primary} />
            </View>
            <Text style={styles.uploadText}>Chọn file từ thiết bị</Text>
            <Text style={styles.uploadHint}>Bấm vào đây để chọn file</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.fileCard}>
            <Ionicons name="document-text" size={40} color={COLORS.primary} />
            <View style={styles.fileInfo}>
              <Text style={styles.fileName} numberOfLines={1}>{selectedFile.name}</Text>
              <Text style={styles.fileSize}>{selectedFile.size}</Text>
            </View>
            <TouchableOpacity onPress={() => setSelectedFile(null)}>
              <Ionicons name="close-circle" size={24} color={COLORS.error} />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.tips}>
          <Text style={styles.tipsTitle}>💡 Lời khuyên:</Text>
          <Text style={styles.tipItem}>• Nên sử dụng file PDF để giữ nguyên định dạng.</Text>
          <Text style={styles.tipItem}>• Đặt tên file rõ ràng (VD: CV_NguyenVanA_Dev.pdf).</Text>
        </View>

        <View style={styles.footer}>
          <Button 
            title="TẢI LÊN NGAY" 
            onPress={handleUpload} 
            disabled={!selectedFile}
            isLoading={isUploading}
            fullWidth
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  content: { flex: 1, padding: 28 },
  title: { fontSize: 16, fontWeight: '800', color: COLORS.text.primary, marginBottom: 4 },
  subtitle: { fontSize: 12, color: COLORS.text.secondary, marginBottom: 24 },
  uploadArea: {
    height: 180,
    borderWidth: 2,
    borderColor: COLORS.primary + '40',
    borderStyle: 'dashed',
    borderRadius: 14,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    ...SHADOW.sm,
  },
  uploadText: { fontSize: 14, fontWeight: '700', color: COLORS.text.primary, marginBottom: 4 },
  uploadHint: { fontSize: 12, color: COLORS.text.light },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.primary,
    marginBottom: 24,
    ...SHADOW.sm,
  },
  fileInfo: { flex: 1, marginLeft: 12 },
  fileName: { fontSize: 14, fontWeight: '700', color: COLORS.text.primary },
  fileSize: { fontSize: 11, color: COLORS.text.light, marginTop: 2 },
  tips: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: '#F0F0F0',
  },
  tipsTitle: { fontSize: 13, fontWeight: '700', color: COLORS.text.primary, marginBottom: 8 },
  tipItem: { fontSize: 12, color: COLORS.text.secondary, marginBottom: 4, lineHeight: 18 },
  footer: { marginTop: 'auto', paddingBottom: 20 },
});

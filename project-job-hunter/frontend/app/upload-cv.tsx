import { Button, Header } from '@/components';
import { COLORS, SHADOW } from '@/constants/theme';
import { cvService } from '@/services/cvService';
import { API_CONFIG } from '@/constants/endpoints';
import { generalStorage } from '@/utils/storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import { Alert, StyleSheet, Text, TouchableOpacity, View, ScrollView, ActivityIndicator, Linking } from 'react-native';
import dayjs from 'dayjs';

export default function UploadCVScreen() {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [existingCvs, setExistingCvs] = useState<any[]>([]);
  const [isLoadingCvs, setIsLoadingCvs] = useState(true);

  const fetchExistingCvs = async () => {
    try {
      // 1. Fetch server resumes (CVs used to apply)
      const data = await cvService.getCVs();
      const serverList = data?.result || [];

      // 2. Fetch local storage CVs (directly uploaded from this device)
      const localCvs = await generalStorage.get<any[]>('uploaded_cvs') || [];

      // Combine and deduplicate by URL
      const combined = [...localCvs, ...serverList];
      const uniqueCvs = combined.filter((v: any, i: any, a: any) => a.findIndex((t: any) => t.url === v.url) === i);

      // Sort by date descending
      uniqueCvs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setExistingCvs(uniqueCvs);
    } catch (error) {
      console.error('Error fetching CVs:', error);
    } finally {
      setIsLoadingCvs(false);
    }
  };

  useEffect(() => {
    fetchExistingCvs();
  }, []);

  const handleOpenCV = (url: string) => {
    if (!url) return;
    let fullUrl = url;
    if (!url.startsWith('http')) {
      fullUrl = `${API_CONFIG.BASE_URL}/${API_CONFIG.VERSION}/files/download?fileName=${url}`;
    }
    Linking.openURL(fullUrl).catch(() => Alert.alert('Lỗi', 'Không thể mở CV.'));
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });

      if (result.canceled === false && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        
        // Check file extension strictly
        const name = file.name || '';
        const allowedExtensions = ['pdf', 'doc', 'docx'];
        const fileExtension = name.split('.').pop()?.toLowerCase();
        if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
          Alert.alert('Lỗi', 'Chỉ chấp nhận file CV ở định dạng: .pdf, .doc, .docx');
          return;
        }

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

      const fileNameOnServer = await cvService.uploadCV(fileToUpload);
      
      // Save to local storage list
      const newCvItem = {
        id: 'local-' + Date.now(),
        url: fileNameOnServer,
        createdAt: new Date().toISOString(),
      };
      const localCvs = await generalStorage.get<any[]>('uploaded_cvs') || [];
      localCvs.unshift(newCvItem);
      await generalStorage.set('uploaded_cvs', localCvs);
      
      Alert.alert('Thành công', 'CV của bạn đã được tải lên hệ thống');
      setSelectedFile(null);
      fetchExistingCvs(); // Refresh the list of CVs
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
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
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

          <View style={styles.buttonWrapper}>
            <Button 
              title="TẢI LÊN NGAY" 
              onPress={handleUpload} 
              disabled={!selectedFile}
              isLoading={isUploading}
              fullWidth
            />
          </View>

          {/* Existing CVs List */}
          <View style={styles.listSection}>
            <Text style={styles.listTitle}>Danh sách CV đã tải lên ({existingCvs.length})</Text>
            
            {isLoadingCvs ? (
              <ActivityIndicator size="small" color={COLORS.primary} style={{ marginTop: 20 }} />
            ) : existingCvs.length === 0 ? (
              <Text style={styles.emptyText}>Bạn chưa có CV nào tải lên hệ thống.</Text>
            ) : (
              existingCvs.map((cv) => {
                const cleanName = cv.url.replace(/^\d+-/, '');
                return (
                  <View key={cv.id} style={styles.cvItem}>
                    <Ionicons name="document-text-outline" size={28} color={COLORS.primary} />
                    <View style={styles.cvDetails}>
                      <Text style={styles.cvName} numberOfLines={1}>{cleanName}</Text>
                      <Text style={styles.cvDate}>
                        Tải lên ngày: {dayjs(cv.createdAt).format('DD/MM/YYYY')}
                      </Text>
                    </View>
                    <TouchableOpacity 
                      style={styles.viewBtn} 
                      onPress={() => handleOpenCV(cv.url)}
                    >
                      <Ionicons name="eye-outline" size={20} color={COLORS.primary} />
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  scrollContent: { paddingBottom: 40 },
  content: { padding: 24 },
  title: { fontSize: 16, fontWeight: '800', color: COLORS.text.primary, marginBottom: 4 },
  subtitle: { fontSize: 12, color: COLORS.text.secondary, marginBottom: 20 },
  uploadArea: {
    height: 160,
    borderWidth: 2,
    borderColor: COLORS.primary + '40',
    borderStyle: 'dashed',
    borderRadius: 14,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
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
    marginBottom: 20,
    ...SHADOW.sm,
  },
  fileInfo: { flex: 1, marginLeft: 12 },
  fileName: { fontSize: 14, fontWeight: '700', color: COLORS.text.primary },
  fileSize: { fontSize: 11, color: COLORS.text.light, marginTop: 2 },
  tips: {
    backgroundColor: '#F9FAFB',
    padding: 14,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: '#F0F0F0',
    marginBottom: 20,
  },
  tipsTitle: { fontSize: 13, fontWeight: '700', color: COLORS.text.primary, marginBottom: 6 },
  tipItem: { fontSize: 12, color: COLORS.text.secondary, marginBottom: 4, lineHeight: 18 },
  buttonWrapper: { marginBottom: 30 },
  listSection: {
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    paddingTop: 24,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text.primary,
    marginBottom: 16,
  },
  emptyText: {
    color: COLORS.text.secondary,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 10,
  },
  cvItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 0.5,
    borderColor: '#E5E7EB',
  },
  cvDetails: {
    flex: 1,
    marginLeft: 12,
  },
  cvName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginBottom: 2,
  },
  cvDate: {
    fontSize: 11,
    color: COLORS.text.secondary,
  },
  viewBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#ECFDF5',
  },
});

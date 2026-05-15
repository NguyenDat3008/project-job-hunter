// Job Detail Screen — Refined aesthetic
import { Button, LoadingSpinner, MatchScore, PremiumBadge } from '@components/index';
import { BORDER_RADIUS, COLORS, SHADOW, SPACING, TYPOGRAPHY } from '@constants/theme';
import { useAuthStore } from '@store/authStore';
import { jobService } from '@services/jobService';
import { recommendationService } from '@services/recommendationService';
import { Job } from '@/types/job.types';
import * as DocumentPicker from 'expo-document-picker';
import { cvService } from '@services/cvService';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const formatSalary = (salary: number): string => {
  if (salary === 0) return 'Thoả thuận';
  if (salary >= 1000000) return (salary / 1000000).toFixed(0) + ' triệu';
  return new Intl.NumberFormat('vi-VN').format(salary);
};

export default function JobDetailScreen() {
  const router = useRouter();
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const { user, isAuthenticated } = useAuthStore();
  
  const [job, setJob] = useState<Job | null>(null);
  const [matchInfo, setMatchInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    if (jobId) loadData();
  }, [jobId]);

  const loadData = async () => {
    try {
      const id = parseInt(jobId as string, 10);
      const [jobData, matchData] = await Promise.all([
        jobService.getJobDetail(id),
        recommendationService.getMatchScore(id).catch(() => null),
      ]);
      setJob(jobData);
      setMatchInfo(matchData);
    } catch (error) {
      console.error('Error loading job detail:', error);
      Alert.alert('Lỗi', 'Không thể tải chi tiết công việc');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = async () => {
    if (!job) return;
    if (!isAuthenticated) {
      Alert.alert('Yêu cầu đăng nhập', 'Bạn cần đăng nhập để ứng tuyển công việc này.', [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Đăng nhập', onPress: () => router.push('/login') }
      ]);
      return;
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return; // User canceled picking
      }

      const file = result.assets[0];
      if (file.size && file.size > 5 * 1024 * 1024) {
        Alert.alert('Lỗi', 'File không được vượt quá 5MB');
        return;
      }

      setIsApplying(true);

      // 1. Upload CV to MinIO
      const fileToUpload = {
        uri: file.uri,
        name: file.name,
        type: file.mimeType || 'application/pdf',
      };
      const fileNameOnServer = await cvService.uploadCV(fileToUpload);

      // 2. Submit application with the returned URL
      await jobService.applyJob({
        jobId: job.id,
        email: user?.email || 'user@example.com',
        url: fileNameOnServer,
        userId: user?.id,
      });

      Alert.alert('Thành công', 'Đã nộp đơn ứng tuyển thành công!');
      loadData();
    } catch (error: any) {
      console.error('Apply Job Error:', error);
      Alert.alert('Lỗi', error?.message || 'Không thể ứng tuyển lúc này. Vui lòng thử lại sau.');
    } finally {
      setIsApplying(false);
    }
  };

  const handleSaveJob = async () => {
    if (!job) return;
    try {
      if (job.isSaved) {
        await jobService.unsaveJob(job.id);
      } else {
        await jobService.saveJob(job.id);
      }
      setJob(prev => prev ? { ...prev, isSaved: !prev.isSaved } : null);
    } catch (error) {
      console.error('Error saving job:', error);
    }
  };

  if (isLoading || !job) return <LoadingSpinner fullScreen message="Đang tải chi tiết..." />;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <SafeAreaView edges={['top']} style={styles.navHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.navBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={styles.navTitle} numberOfLines={1}>Chi tiết công việc</Text>
        <TouchableOpacity style={styles.navBtn}>
          <Ionicons name="share-social-outline" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerCard}>
          <Text style={styles.jobTitle}>{job.name}</Text>
          <View style={styles.salaryRow}>
            <Text style={styles.salary}>{formatSalary(job.salary)} VND</Text>
            <View style={styles.tag}>
              <Text style={styles.tagText}>{job.level}</Text>
            </View>
          </View>
          
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={16} color={COLORS.text.secondary} />
            <Text style={styles.locationText}>{job.location}</Text>
          </View>
        </View>

        {matchInfo && (
          <View style={styles.aiCard}>
            <View style={styles.aiHeader}>
              <View>
                <Text style={styles.aiTitle}>Phân tích mức độ phù hợp</Text>
                <Text style={styles.aiSubtitle}>Dựa trên hồ sơ của bạn</Text>
              </View>
              <MatchScore score={matchInfo.matchScore} size={48} />
            </View>
            <View style={styles.aiStats}>
              <View style={styles.aiStatItem}>
                <Text style={styles.aiStatValue}>{matchInfo.matchedSkills.length}</Text>
                <Text style={styles.aiStatLabel}>Kỹ năng khớp</Text>
              </View>
              <View style={styles.aiStatDivider} />
              <View style={styles.aiStatItem}>
                <Text style={styles.aiStatValue}>{matchInfo.missingSkills.length}</Text>
                <Text style={styles.aiStatLabel}>Kỹ năng thiếu</Text>
              </View>
            </View>
          </View>
        )}

        <TouchableOpacity 
          style={styles.companyCard}
          onPress={() => job.company && router.push(`/company-detail?companyId=${job.company.id}`)}
        >
          <View style={styles.logoContainer}>
            {job.company?.logo ? (
              <Image source={{ uri: job.company.logo }} style={styles.logo} />
            ) : (
              <View style={styles.logoPlaceholder}>
                <Text style={styles.logoLetter}>{job.company?.name?.charAt(0) || 'C'}</Text>
              </View>
            )}
          </View>
          <View style={styles.companyInfo}>
            <View style={styles.companyHeader}>
              <Text style={styles.companyName} numberOfLines={1}>{job.company?.name || 'Công ty'}</Text>
              {job.company?.isPremium && <PremiumBadge tier={job.company.premiumTier as any} size="small" />}
            </View>
            <Text style={styles.viewCompany}>Xem trang công ty ›</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mô tả công việc</Text>
          <Text style={styles.sectionContent}>{job.description}</Text>
        </View>

        {job.requirements && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Yêu cầu công việc</Text>
            <Text style={styles.sectionContent}>{job.requirements}</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Yêu cầu kỹ năng</Text>
          <View style={styles.skillsRow}>
            {(job.skills || []).map((skill, idx) => (
              <View key={skill.id || idx} style={styles.skillTag}>
                <Text style={styles.skillText}>{skill.name}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.saveBtn, job.isSaved && styles.saveBtnActive]} 
          onPress={handleSaveJob}
        >
          <Ionicons 
            name={job.isSaved ? "heart" : "heart-outline"} 
            size={28} 
            color={job.isSaved ? COLORS.primary : COLORS.text.secondary} 
          />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.applyBtn, job.isApplied && styles.appliedBtn]} 
          onPress={handleApply}
          disabled={job.isApplied || isApplying}
        >
          <Text style={styles.applyBtnText}>
            {job.isApplied ? 'ĐÃ ỨNG TUYỂN' : 'ỨNG TUYỂN NGAY'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 10,
    backgroundColor: COLORS.white,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F0F0F0',
    zIndex: 10,
  },
  navBtn: { 
    width: 32, 
    height: 32, 
    borderRadius: 16, 
    backgroundColor: '#F9FAFB', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  navTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text.primary, flex: 1, textAlign: 'center' },
  scrollContent: { paddingBottom: 40 },
  headerCard: { backgroundColor: COLORS.white, padding: 24, paddingHorizontal: 28, marginBottom: 8 },
  jobTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text.primary, marginBottom: 10, lineHeight: 24 },
  salaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  salary: { fontSize: 16, color: COLORS.primary, fontWeight: '800' },
  tag: { backgroundColor: '#F0FDF4', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  tagText: { color: COLORS.primary, fontSize: 10, fontWeight: '700' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  locationText: { fontSize: 12, color: COLORS.text.secondary, fontWeight: '500' },
  
  aiCard: { backgroundColor: '#F0FDF4', marginHorizontal: 28, borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#DCFCE7' },
  aiHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  aiTitle: { fontSize: 13, fontWeight: '800', color: '#166534' },
  aiSubtitle: { fontSize: 10, color: '#166534', opacity: 0.8 },
  aiStats: { flexDirection: 'row', alignItems: 'center' },
  aiStatItem: { flex: 1, alignItems: 'center' },
  aiStatValue: { fontSize: 16, fontWeight: '800', color: '#166534' },
  aiStatLabel: { fontSize: 10, color: '#166534' },
  aiStatDivider: { width: 1, height: 20, backgroundColor: '#DCFCE7' },
  
  companyCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, padding: 16, marginHorizontal: 28, borderRadius: 14, marginBottom: 12, ...SHADOW.sm, borderWidth: 0.5, borderColor: '#F5F5F5' },
  logoContainer: { marginRight: 12 },
  logo: { width: 44, height: 44, borderRadius: 8 },
  logoPlaceholder: { width: 44, height: 44, borderRadius: 8, backgroundColor: COLORS.gray[50], justifyContent: 'center', alignItems: 'center' },
  logoLetter: { fontSize: 18, fontWeight: '800', color: COLORS.primary },
  companyInfo: { flex: 1 },
  companyHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  companyName: { fontSize: 13, fontWeight: '700', color: COLORS.text.primary, flexShrink: 1 },
  viewCompany: { fontSize: 11, color: COLORS.primary, fontWeight: '600' },
  
  section: { backgroundColor: COLORS.white, padding: 20, paddingHorizontal: 28, marginBottom: 8 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: COLORS.text.primary, marginBottom: 12, borderLeftWidth: 3, borderLeftColor: COLORS.primary, paddingLeft: 10 },
  sectionContent: { fontSize: 13, color: COLORS.text.secondary, lineHeight: 20, fontWeight: '400' },
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  skillTag: { backgroundColor: '#F3F4F6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  skillText: { fontSize: 10, color: COLORS.text.secondary, fontWeight: '600' },
  
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', backgroundColor: COLORS.white, paddingHorizontal: 28, paddingTop: 10, paddingBottom: Platform.OS === 'ios' ? 30 : 16, gap: 12, borderTopWidth: 0.5, borderTopColor: '#F0F0F0' },
  saveBtn: { width: 48, height: 48, borderRadius: 12, borderWidth: 1, borderColor: '#F0F0F0', justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' },
  saveBtnActive: { borderColor: COLORS.primary, backgroundColor: '#F0FDF4' },
  applyBtn: { flex: 1, height: 48, backgroundColor: COLORS.primary, borderRadius: 24, justifyContent: 'center', alignItems: 'center', ...SHADOW.sm },
  appliedBtn: { backgroundColor: COLORS.text.light },
  applyBtnText: { color: COLORS.white, fontSize: 14, fontWeight: '800' },
});

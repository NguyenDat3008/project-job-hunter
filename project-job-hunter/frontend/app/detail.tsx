// Job Detail Screen — Refined aesthetic + Report Fraud Feature
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
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
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

  const handleApply = () => {
    if (!job) return;
    if (!isAuthenticated) {
      Alert.alert('Yêu cầu đăng nhập', 'Bạn cần đăng nhập để ứng tuyển công việc này.', [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Đăng nhập', onPress: () => router.push('/login') }
      ]);
      return;
    }

    // Redirect to the new application interface
    router.push({
      pathname: '/apply',
      params: { jobId: job.id.toString(), jobName: job.name }
    });
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

  const handleOpenReport = () => {
    if (!job) return;
    if (!isAuthenticated) {
      Alert.alert('Yêu cầu đăng nhập', 'Bạn cần đăng nhập để báo cáo tin tuyển dụng.', [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Đăng nhập', onPress: () => router.push('/login') }
      ]);
      return;
    }
    router.push({
      pathname: '/report',
      params: { jobId: job.id.toString(), jobName: job.name }
    });
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
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity style={styles.navBtn} onPress={handleOpenReport}>
            <Ionicons name="warning-outline" size={22} color="#EA580C" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.navBtn}>
            <Ionicons name="share-social-outline" size={24} color={COLORS.text.primary} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerCard}>
          <View style={styles.headerTop}>
            <View style={styles.headerLogoContainer}>
              {job.company?.logo ? (
                <Image source={{ uri: job.company.logo }} style={styles.headerLogo} />
              ) : (
                <View style={styles.headerLogoPlaceholder}>
                  <Text style={styles.headerLogoLetter}>{job.company?.name?.charAt(0) || 'C'}</Text>
                </View>
              )}
            </View>
            <View style={styles.headerMainInfo}>
              <Text style={styles.jobTitle}>{job.name}</Text>
              <TouchableOpacity 
                onPress={() => job.company && router.push(`/company-detail?companyId=${job.company.id}`)}
              >
                <Text style={styles.companyLink}>{job.company?.name} ›</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.salaryHighlight}>
            <Ionicons name="cash-outline" size={20} color={COLORS.primary} />
            <Text style={styles.salaryText}>{formatSalary(job.salary)} VND</Text>
            <View style={styles.urgentBadge}>
              <Text style={styles.urgentText}>HOT</Text>
            </View>
          </View>
        </View>

        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <View style={styles.infoIconBox}>
              <Ionicons name="people-outline" size={18} color={COLORS.primary} />
            </View>
            <View>
              <Text style={styles.infoLabel}>Số lượng</Text>
              <Text style={styles.infoValue}>{job.quantity} người</Text>
            </View>
          </View>
          <View style={styles.infoItem}>
            <View style={styles.infoIconBox}>
              <Ionicons name="briefcase-outline" size={18} color={COLORS.primary} />
            </View>
            <View>
              <Text style={styles.infoLabel}>Cấp bậc</Text>
              <Text style={styles.infoValue}>{job.level}</Text>
            </View>
          </View>
          <View style={styles.infoItem}>
            <View style={styles.infoIconBox}>
              <Ionicons name="time-outline" size={18} color={COLORS.primary} />
            </View>
            <View>
              <Text style={styles.infoLabel}>Giờ làm việc</Text>
              <Text style={styles.infoValue}>{job.workingTime || 'Thoả thuận'}</Text>
            </View>
          </View>
          <View style={styles.infoItem}>
            <View style={styles.infoIconBox}>
              <Ionicons name="location-outline" size={18} color={COLORS.primary} />
            </View>
            <View>
              <Text style={styles.infoLabel}>Khu vực</Text>
              <Text style={styles.infoValue}>{job.location}</Text>
            </View>
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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mô tả công việc</Text>
          <Text style={styles.sectionContent}>{job.description}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Yêu cầu công việc</Text>
          <Text style={styles.sectionContent}>{job.requirements}</Text>
          
          {job.requiredSkills && job.requiredSkills.length > 0 && (
            <View style={styles.skillsSubsection}>
              <Text style={styles.subsectionTitle}>Kỹ năng bắt buộc:</Text>
              <View style={styles.skillsRow}>
                {job.requiredSkills.map((skill, idx) => (
                  <View key={`req-${skill.id || idx}`} style={styles.skillTag}>
                    <Text style={styles.skillText}>{skill.name}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {job.preferredSkills && job.preferredSkills.length > 0 && (
            <View style={styles.skillsSubsection}>
              <Text style={styles.subsectionTitle}>Kỹ năng ưu tiên:</Text>
              <View style={styles.skillsRow}>
                {job.preferredSkills.map((skill, idx) => (
                  <View key={`pref-${skill.id || idx}`} style={[styles.skillTag, { backgroundColor: '#EFF6FF' }]}>
                    <Text style={[styles.skillText, { color: '#1D4ED8' }]}>{skill.name}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {job.benefits && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quyền lợi</Text>
            <Text style={styles.sectionContent}>{job.benefits}</Text>
          </View>
        )}

        {/* Report CTA Banner */}
        <TouchableOpacity style={styles.reportBanner} onPress={handleOpenReport}>
          <View style={styles.reportBannerIcon}>
            <Ionicons name="shield-checkmark-outline" size={24} color="#EA580C" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.reportBannerTitle}>Tin tuyển dụng này có vấn đề?</Text>
            <Text style={styles.reportBannerDesc}>Báo cáo để bảo vệ cộng đồng người tìm việc</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#EA580C" />
        </TouchableOpacity>

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
  headerTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  headerLogoContainer: { marginRight: 16, ...SHADOW.sm },
  headerLogo: { width: 64, height: 64, borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: '#F0F0F0' },
  headerLogoPlaceholder: { width: 64, height: 64, borderRadius: BORDER_RADIUS.md, backgroundColor: COLORS.gray[50], justifyContent: 'center', alignItems: 'center' },
  headerLogoLetter: { fontSize: 28, fontWeight: '800', color: COLORS.primary },
  headerMainInfo: { flex: 1 },
  jobTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text.primary, marginBottom: 4, lineHeight: 28 },
  companyLink: { fontSize: 14, color: COLORS.text.secondary, fontWeight: '600' },
  
  salaryHighlight: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F0FDF4', padding: 12, borderRadius: 12 },
  salaryText: { fontSize: 18, color: COLORS.primary, fontWeight: '800' },
  urgentBadge: { backgroundColor: COLORS.error, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginLeft: 'auto' },
  urgentText: { color: COLORS.white, fontSize: 10, fontWeight: '800' },

  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', backgroundColor: COLORS.white, paddingHorizontal: 28, paddingVertical: 16, marginBottom: 8, gap: 16 },
  infoItem: { width: '46%', flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoIconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center' },
  infoLabel: { fontSize: 10, color: COLORS.text.secondary, marginBottom: 2 },
  infoValue: { fontSize: 13, fontWeight: '700', color: COLORS.text.primary },

  aiCard: { backgroundColor: '#F0FDF4', marginHorizontal: 28, borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#DCFCE7' },
  aiHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  aiTitle: { fontSize: 13, fontWeight: '800', color: '#166534' },
  aiSubtitle: { fontSize: 10, color: '#166534', opacity: 0.8 },
  aiStats: { flexDirection: 'row', alignItems: 'center' },
  aiStatItem: { flex: 1, alignItems: 'center' },
  aiStatValue: { fontSize: 16, fontWeight: '800', color: '#166534' },
  aiStatLabel: { fontSize: 10, color: '#166534' },
  aiStatDivider: { width: 1, height: 20, backgroundColor: '#DCFCE7' },
  
  section: { backgroundColor: COLORS.white, padding: 20, paddingHorizontal: 28, marginBottom: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text.primary, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: COLORS.primary, paddingLeft: 12 },
  sectionContent: { fontSize: 14, color: COLORS.text.secondary, lineHeight: 22, fontWeight: '400' },
  
  skillsSubsection: { marginTop: 16 },
  subsectionTitle: { fontSize: 13, fontWeight: '700', color: COLORS.text.primary, marginBottom: 8 },
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  skillTag: { backgroundColor: '#F0FDF4', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  skillText: { fontSize: 11, color: COLORS.primary, fontWeight: '600' },

  // Report CTA Banner
  reportBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 28,
    marginTop: 8,
    padding: 16,
    backgroundColor: '#FFF7ED',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FED7AA',
    gap: 12,
  },
  reportBannerIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFEDD5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reportBannerTitle: { fontSize: 14, fontWeight: '700', color: '#9A3412', marginBottom: 2 },
  reportBannerDesc: { fontSize: 11, color: '#C2410C' },
  
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', backgroundColor: COLORS.white, paddingHorizontal: 28, paddingTop: 10, paddingBottom: Platform.OS === 'ios' ? 30 : 16, gap: 12, borderTopWidth: 0.5, borderTopColor: '#F0F0F0' },
  saveBtn: { width: 48, height: 48, borderRadius: 12, borderWidth: 1, borderColor: '#F0F0F0', justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' },
  saveBtnActive: { borderColor: COLORS.primary, backgroundColor: '#F0FDF4' },
  applyBtn: { flex: 1, height: 48, backgroundColor: COLORS.primary, borderRadius: 24, justifyContent: 'center', alignItems: 'center', ...SHADOW.sm },
  appliedBtn: { backgroundColor: COLORS.text.light },
  applyBtnText: { color: COLORS.white, fontSize: 14, fontWeight: '800' },

  // Report Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EA580C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#1E293B' },
  reportJobInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  reportJobName: { fontSize: 13, color: '#334155', fontWeight: '600', flex: 1 },
  reasonLabel: { fontSize: 14, fontWeight: '700', color: '#1E293B', marginBottom: 10 },
  reasonList: { maxHeight: 240, marginBottom: 12 },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 6,
    backgroundColor: '#F8FAFC',
  },
  reasonItemSelected: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FDBA74',
  },
  reasonText: { fontSize: 13, color: '#475569', flex: 1, lineHeight: 19 },
  reasonTextSelected: { color: '#9A3412', fontWeight: '600' },
  reportInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    height: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    fontSize: 14,
    color: '#1E293B',
  },
  reportSubmitBtn: {
    flexDirection: 'row',
    backgroundColor: '#EA580C',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  reportSubmitBtnDisabled: { opacity: 0.5 },
  reportSubmitText: { color: '#FFFFFF', fontWeight: '800', fontSize: 16 },
});

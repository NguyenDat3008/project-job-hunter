import { JobCard, LoadingSpinner, LoginRequired } from '@components/index';
import { COLORS } from '@constants/theme';
import { jobService } from '@services/jobService';
import { Job } from '@/types/job.types';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import useAuthStore from '@store/authStore';

export default function SavedJobsScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(isAuthenticated);

  const loadData = async () => {
    try {
      const savedJobs = await jobService.getSavedJobs();
      setJobs(savedJobs);
    } catch (error) {
      console.error('Error fetching saved jobs', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    if (isAuthenticated) loadData(); 
  }, [isAuthenticated]);

  const handleSaveJob = async (job: Job) => {
    try {
      await jobService.unsaveJob(job.id);
      loadData();
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  if (!isAuthenticated) return <LoginRequired message="Bạn cần đăng nhập để xem danh sách việc làm đã lưu" />;
  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Việc làm đã lưu</Text>
          <Text style={styles.headerSubtitle}>Bạn đã lưu {jobs.length} việc làm</Text>
        </View>
        <View style={styles.rightPlaceholder} />
      </View>

      {jobs.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyCenterContent}>
            <View style={styles.emptyIconWrap}>
              <Text style={styles.emptyIconText}>0</Text>
            </View>
            <Text style={styles.emptyText}>Bạn chưa lưu việc làm nào</Text>

            <TouchableOpacity style={styles.ctaButton} onPress={() => router.push('/(tabs)')}>
              <Text style={styles.ctaButtonText}>Tìm việc làm ngay</Text>
            </TouchableOpacity>

            <View style={styles.hintBlock}>
              <Ionicons name="book-outline" size={18} color="#6B7280" />
              <Text style={styles.hintText}>Tại sao tôi nên lưu việc làm?</Text>
            </View>
          </View>
          
          <Text style={styles.watermark}>TopCV</Text>
        </View>
      ) : (
        <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
          {jobs.map(job => (
            <JobCard
              key={job.id}
              job={job}
              onPress={() => router.push(`/detail?jobId=${job.id}`)}
              onSavePress={() => handleSaveJob(job)}
            />
          ))}
          {/* Bottom spacing for list */}
          <View style={{ height: 80 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#4B5563',
  },
  rightPlaceholder: {
    width: 40,
  },
  emptyContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#FFFFFF',
  },
  emptyCenterContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIconWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyIconText: {
    fontSize: 56,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 40,
    textAlign: 'center',
  },
  ctaButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  hintBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hintText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  watermark: {
    position: 'absolute',
    bottom: 48,
    right: 24,
    fontSize: 16,
    color: '#E5E7EB',
    fontWeight: '900',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  listContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: COLORS.background.secondary || '#F9FAFB',
  },
});

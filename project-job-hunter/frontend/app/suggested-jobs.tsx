import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, FlatList, StatusBar, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { JobCard, LoadingSpinner } from '@components/index';
import { jobService } from '@services/jobService';
import { Job } from '@/types/job.types';
import { COLORS } from '@constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@store/authStore';

export default function SuggestedJobsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuthStore();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const data = await jobService.getLatestJobs(15);
        setJobs(data || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  const handleToggleSave = async (job: Job) => {
    if (!isAuthenticated) {
      Alert.alert('Yêu cầu đăng nhập', 'Bạn cần đăng nhập để lưu công việc này.', [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Đăng nhập', onPress: () => router.push('/login') }
      ]);
      return;
    }
    try {
      await jobService.saveJob(job.id);
      setJobs(prev => prev.map(j => 
        j.id === job.id ? { ...j, isSaved: !j.isSaved } : j
      ));
    } catch (error: any) {
      console.error('Error toggling save:', error);
      Alert.alert('Lỗi', error.message || 'Không thể lưu công việc lúc này.');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <View style={[styles.bannerContainer, { paddingTop: insets.top }]}>
        <Image 
          source={require('../assets/images/banner_job.jpg')} 
          style={styles.bannerImage}
          resizeMode="cover"
        />
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Gợi ý việc làm</Text>
          <View style={{ width: 40 }} />
        </View>
      </View>

      {loading ? (
        <LoadingSpinner message="Đang tìm việc làm phù hợp với bạn..." />
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <JobCard 
              job={item} 
              onPress={() => router.push(`/detail?jobId=${item.id}`)}
              onSavePress={() => handleToggleSave(item)} 
            />
          )}
          ListHeaderComponent={() => (
             <View style={styles.sectionHeader}>
               <Text style={styles.sectionTitle}>Công việc phù hợp với bạn</Text>
               <Text style={styles.sectionSubtitle}>Dựa trên kỹ năng và hồ sơ của bạn</Text>
             </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  bannerContainer: {
    width: '100%',
    height: 220,
    position: 'relative',
  },
  bannerImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10
  },
  listContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  }
});

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, FlatList, StatusBar, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { JobCard } from '@components/index';
import { jobService } from '@services/jobService';
import { Job } from '@/types/job.types';
import { COLORS } from '@constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@store/authStore';

export default function TopCVProJobsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuthStore();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const handleSearch = async (query: string = searchQuery) => {
    setLoading(true);
    try {
      const response = await jobService.basicSearch({
          query: query,
      });
      // Lọc các job thuộc đối tác Pro (isPremium)
      // Do BE có thể chưa có API riêng, ta tạm thời filter kết quả trả về
      const proJobs = (response?.result || []).filter(j => 
         j.isPremium || j.company?.isPremium || j.company?.premiumTier === 'PRO' || j.company?.premiumTier === 'ENTERPRISE'
      );
      setJobs(proJobs);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleSearch();
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
          source={require('../assets/images/prenium.jpg')} 
          style={styles.bannerImage}
          resizeMode="cover"
        />
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Việc làm TopCV Pro</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm kiếm việc làm từ đối tác Pro..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={() => handleSearch()}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => { setSearchQuery(''); handleSearch(''); }}>
                <Ionicons name="close-circle" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Đang tìm việc làm Pro...</Text>
        </View>
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
          ListEmptyComponent={() => (
             <View style={styles.emptyContainer}>
               <Text style={styles.emptyText}>Chưa có công việc nào từ đối tác Pro phù hợp với từ khóa tìm kiếm.</Text>
             </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  bannerContainer: { width: '100%', height: 230, position: 'relative' },
  bannerImage: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, marginTop: 10 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.white, textShadowColor: 'rgba(0, 0, 0, 0.75)', textShadowOffset: { width: -1, height: 1 }, textShadowRadius: 10 },
  searchContainer: { paddingHorizontal: 16, marginTop: 20 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 12, paddingHorizontal: 12, height: 48, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: '#111827' },
  listContainer: { padding: 16, paddingBottom: 40 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 100 },
  loadingText: { marginTop: 16, fontSize: 14, color: COLORS.primary, fontWeight: '500' },
  emptyContainer: { padding: 40, alignItems: 'center' },
  emptyText: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 22 }
});

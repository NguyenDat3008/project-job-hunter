import { Job } from '@/types/job.types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { jobService } from '@services/jobService';
import { LoadingSpinner, Banner, JobCard } from '@components/index';
import { COLORS, SHADOW } from '@constants/theme';

export default function HomeTab() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [latestJobs, setLatestJobs] = useState<Job[]>([]);

  const loadData = useCallback(async () => {
    try {
      const jobs = await jobService.getLatestJobs(10);
      if (jobs && jobs.length > 0) {
        setLatestJobs(jobs);
      }
    } catch (e) {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  if (loading) return <LoadingSpinner fullScreen message="Đang tải..." />;

  const categories = [
    { title: 'Việc làm', img: require('../../assets/images/ViecLam.jpg'), route: '/(tabs)' },
    { title: 'TopCV Pro', img: require('../../assets/images/TopCVpro.jpg'), route: '/premium' },
    { title: 'Tạo CV', img: require('../../assets/images/Tạo CV.jpg'), route: '/cv-builder' },
    { title: 'Công cụ', img: require('../../assets/images/Công cụ.jpg'), route: '/account-settings' },
    { title: 'Blog', img: require('../../assets/images/Blog.jpg'), route: null },
  ];

  const bannerImage = require('../../assets/images/Banner trên cùng mới.jpg');

  const handleToggleSave = async (job: Job) => {
    try {
      await jobService.saveJob(job.id);
      // Update local state for immediate feedback
      setLatestJobs(prev => prev.map(j => 
        j.id === job.id ? { ...j, isSaved: !j.isSaved } : j
      ));
    } catch (error) {
      console.error('Error toggling save:', error);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Edge-to-Edge Top Header matching iPhone safe area */}
      <View style={[styles.topHeaderWrapper, { paddingTop: insets.top }]}>
        <Image 
          source={bannerImage}
          style={styles.topHeaderBg}
          resizeMode="cover"
        />
        <View style={styles.topHeaderContent}>
          <View style={styles.headerTop}>
            <View style={styles.headerLeftContainer}>
              {/* Optional: Mascot or Greeting */}
            </View>
            <View style={styles.headerRightContainer}>
              <TouchableOpacity style={styles.avatar}>
                <Text style={styles.avatarText}>TJ</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.notificationBtn} onPress={() => router.push('/(tabs)/notifications')}>
                <Ionicons name="notifications-outline" size={18} color={COLORS.white} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={16} color={COLORS.text.light} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInputField}
              placeholder="Tìm kiếm việc làm, công ty..."
              placeholderTextColor={COLORS.text.light}
              defaultValue="thực tập sinh"
            />
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[COLORS.primary]} />}
      >
        {/* Quick Category Navigation */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.navIconsRow}
        >
          {categories.map((cat, idx) => (
            <TouchableOpacity key={idx} style={styles.navItem} activeOpacity={0.7} onPress={() => cat.route && router.push(cat.route as any)}>
              <View style={styles.navIconBox}>
                <Image source={cat.img} style={styles.navImage} resizeMode="cover" />
              </View>
              <Text style={styles.navText}>{cat.title}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Khám phá việc làm CTA */}
        <TouchableOpacity 
          style={styles.exploreBtn} 
          activeOpacity={0.8}
          onPress={() => router.push('/nearby-jobs' as any)}
        >
          <Ionicons name="sparkles" size={16} color={COLORS.primary} style={styles.exploreIcon} />
          <Text style={styles.exploreText}>Khám phá việc làm gần bạn</Text>
        </TouchableOpacity>

        {/* Suitable Jobs Section */}
        <View style={styles.sectionWrap}>
          {/* Profile based title */}
          <View style={styles.suggestionHeader}>
            <Text style={styles.suggestionTitle}>Dựa trên hồ sơ và mong muốn của bạn</Text>
          </View>
          
          {/* Blue Info Bar */}
          <View style={styles.swipeInfoBar}>
            <Text style={styles.swipeInfoText}>Vuốt trái để bỏ việc làm không phù hợp</Text>
            <TouchableOpacity>
              <Ionicons name="close" size={16} color="#4A90E2" />
            </TouchableOpacity>
          </View>

          {latestJobs.length > 0 ? (
            latestJobs.slice(0, 5).map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onPress={() => router.push(`/detail?jobId=${job.id}`)}
                onSavePress={() => handleToggleSave(job)}
              />
            ))
          ) : (
            <>
              {/* Card 1 Fallback */}
              <TouchableOpacity style={styles.cardContainer} activeOpacity={0.7} onPress={() => router.push('/detail?jobId=1')}>
                <View style={styles.cardTopRow}>
                  <View style={[styles.logoWrap, styles.logoPlaceholderRed]}>
                    <Ionicons name="person" size={24} color="#EF4444" />
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.jobTitle} numberOfLines={1}>Thực Tập Sinh IT (Java/Nodejs)</Text>
                    <Text style={styles.companyName} numberOfLines={1}>CÔNG TY TNHH STARACK SG</Text>
                  </View>
                  <TouchableOpacity style={styles.heartBtn}>
                    <Ionicons name="heart-outline" size={20} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>
                <View style={styles.cardTagsRow}>
                  <View style={[styles.tag, styles.tagGreenBg]}>
                    <Text style={styles.tagGreenText}>1 - 3 triệu</Text>
                  </View>
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>Hồ Chí Minh (mới) & Hà Nội</Text>
                  </View>
                </View>
              </TouchableOpacity>

              {/* Card 2 Fallback */}
              <TouchableOpacity style={styles.cardContainer} activeOpacity={0.7} onPress={() => router.push('/detail?jobId=2')}>
                <View style={styles.cardTopRow}>
                  <View style={[styles.logoWrap, styles.logoPlaceholderGrey]}>
                    <Ionicons name="business" size={24} color="#9CA3AF" />
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.jobTitle} numberOfLines={1}>Thực Tập Sinh Nhân Sự</Text>
                    <Text style={styles.companyName} numberOfLines={1}>CÔNG TY TNHH ĐẦU TƯ PHÁT TRIỂN S...</Text>
                  </View>
                  <TouchableOpacity style={styles.heartBtn}>
                    <Ionicons name="heart-outline" size={20} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>
                <View style={styles.cardTagsRow}>
                  <View style={[styles.tag, styles.tagGreenBg]}>
                    <Text style={styles.tagGreenText}>₫ Thoả thuận</Text>
                  </View>
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>Hà Nội</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </>
          )}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F9FAFB' 
  },
  topHeaderWrapper: {
    width: '100%',
    backgroundColor: '#3EE88D', // Lighter green for better blending
    position: 'relative',
    overflow: 'hidden',
    // Optional: add slight bottom radius if desired, but edge-to-edge usually is flat
  },
  topHeaderBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  topHeaderContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeftContainer: {
    flex: 1,
  },
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.white,
  },
  avatarText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
  notificationBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    height: 44,
    borderRadius: 22,
    paddingHorizontal: 16,
    ...SHADOW.sm,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInputField: { 
    flex: 1, 
    fontSize: 14,
    color: COLORS.text.primary,
  },
  navIconsRow: { 
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 16,
  },
  navItem: { 
    alignItems: 'center', 
    width: 65,
  },
  navIconBox: { 
    width: 48, 
    height: 48, 
    borderRadius: 12, 
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    overflow: 'hidden',
    ...SHADOW.sm,
  },
  navImage: { 
    width: '100%', 
    height: '100%' 
  },
  navText: { 
    fontSize: 12,
    color: '#4B5563', 
    textAlign: 'center',
    fontWeight: '500',
  },
  exploreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    marginHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 24,
  },
  exploreIcon: {
    marginRight: 8,
  },
  exploreText: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: '700',
  },
  sectionWrap: { 
    paddingHorizontal: 16,
    marginBottom: 16 
  },
  suggestionHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  suggestionTitle: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '700',
  },
  swipeInfoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  swipeInfoText: {
    color: '#2563EB',
    fontSize: 13,
    fontWeight: '500',
  },
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  logoWrap: {
    width: 48,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logoPlaceholderRed: {
    backgroundColor: '#FEE2E2',
  },
  logoPlaceholderGrey: {
    backgroundColor: '#F3F4F6',
  },
  cardInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  jobTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  companyName: {
    fontSize: 12,
    color: '#6B7280',
  },
  heartBtn: {
    paddingLeft: 8,
  },
  cardTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 11,
    color: '#4B5563',
    fontWeight: '500',
  },
  tagGreenBg: {
    backgroundColor: COLORS.primary,
  },
  tagGreenText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 40,
  },
});

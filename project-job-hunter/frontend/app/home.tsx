// Home Screen — Matching design in example1.png
import { Job, PaginationResponse } from '@/types/index';
import { JobCard, LoadingSpinner } from '@components/index';
import { BORDER_RADIUS, COLORS, SHADOW, SPACING, TYPOGRAPHY } from '@constants/theme';
import { useFetch } from '@hooks/index';
import { jobService } from '@services/jobService';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const CATEGORIES = [
  { id: '1', title: 'Việc làm', icon: require('../assets/images/ViecLam.jpg') },
  { id: '2', title: 'TopCV Pro', icon: require('../assets/images/TopCVpro.jpg') },
  { id: '3', title: 'Tạo CV', icon: require('../assets/images/Tạo CV.jpg') },
  { id: '4', title: 'Công cụ', icon: require('../assets/images/Công cụ.jpg') },
  { id: '5', title: 'Blog', icon: require('../assets/images/Blog.jpg') },
];

const HomeScreen: React.FC = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchJobs = useCallback(() =>
    jobService.getJobs({
      page: 1,
      limit: 20,
      search: searchQuery, // Gửi từ khóa tìm kiếm lên Server
    }),
    [searchQuery]
  );

  const { isLoading, refetch } = useFetch(
    fetchJobs,
    {
      skip: false,
      onSuccess: (data: any) => {
        setJobs(data?.result || []);
      },
    }
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const handleJobPress = (job: Job) => {
    router.push(`/detail?jobId=${job.id}`);
  };

  const handleSaveJob = async (jobId: number) => {
    try {
      const job = jobs.find(j => j.id === jobId);
      if (job) {
        if (job.isSaved) {
          await jobService.unsaveJob(jobId);
        } else {
          await jobService.saveJob(jobId);
        }
        setJobs(jobs.map(j =>
          j.id === jobId ? { ...j, isSaved: !j.isSaved } : j
        ));
      }
    } catch (error) {
      console.error('Error saving job:', error);
    }
  };

  const renderHeader = () => (
    <View style={styles.headerContent}>
      {/* Search and Categories Grid */}
      <View style={styles.categoriesContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity key={cat.id} style={styles.categoryItem}>
              <View style={styles.categoryIconContainer}>
                <Image source={cat.icon} style={styles.categoryIcon} />
              </View>
              <Text style={styles.categoryTitle}>{cat.title}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Explore Near You Button */}
      <TouchableOpacity style={styles.exploreButton}>
        <Text style={styles.exploreIcon}>📍</Text>
        <Text style={styles.exploreText}>Khám phá việc làm gần bạn</Text>
      </TouchableOpacity>

      {/* Recommendations Header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Gợi ý việc làm phù hợp</Text>
        <TouchableOpacity>
          <Text style={styles.seeAllText}>Xem tất cả</Text>
        </TouchableOpacity>
      </View>

      {/* Swipe Hint Banner */}
      <View style={styles.hintBanner}>
        <View style={styles.hintContent}>
          <Text style={styles.hintIcon}>ℹ️</Text>
          <Text style={styles.hintText}>Vuốt trái để bỏ việc làm không phù hợp</Text>
        </View>
        <TouchableOpacity>
          <Text style={styles.closeIcon}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={{ fontSize: 48 }}>🔍</Text>
      <Text style={styles.emptyText}>Không tìm thấy việc làm nào</Text>
    </View>
  );

  if (isLoading && jobs.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <LoadingSpinner fullScreen message="Đang tải việc làm..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Green Header Area */}
      <View style={styles.topBar}>
        <View style={styles.topBarContent}>
          <Image source={require('../assets/images/icon.png')} style={styles.robotLogo} />
          <View style={styles.searchBar}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="thực tập sinh"
              placeholderTextColor={COLORS.text.light}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>
      </View>

      <FlatList
        data={jobs}
        renderItem={({ item }) => (
          <JobCard
            job={item}
            onPress={() => handleJobPress(item)}
            onSavePress={() => handleSaveJob(item.id)}
            style={styles.jobCard}
          />
        )}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={!isLoading ? renderEmpty : null}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Floating/Bottom Promo Banner */}
      <View style={styles.promoBanner}>
        <Text style={styles.promoText}>
          Hơn <Text style={styles.promoHighlight}>20.000 NTD</Text> đang tìm kiếm ứng viên.{'\n'}
          <Text style={styles.promoBold}>Tạo CV ngay</Text> để NTD tìm thấy bạn!
        </Text>
        <TouchableOpacity style={styles.closePromo}>
          <Text style={styles.closePromoText}>✕</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7F6', // Subtle gray background like screenshot
  },
  topBar: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  topBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  robotLogo: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 10,
    paddingHorizontal: SPACING.md,
    height: 40,
  },
  searchIcon: {
    marginRight: SPACING.sm,
    fontSize: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.text.primary,
  },
  headerContent: {
    paddingVertical: SPACING.md,
  },
  categoriesContainer: {
    marginBottom: SPACING.md,
  },
  categoriesScroll: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.md,
  },
  categoryItem: {
    alignItems: 'center',
    width: 64,
  },
  categoryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOW.sm,
    marginBottom: SPACING.xs,
    overflow: 'hidden',
  },
  categoryIcon: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  categoryTitle: {
    fontSize: 11,
    color: COLORS.text.primary,
    textAlign: 'center',
    fontWeight: '500',
  },
  exploreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.primary,
    marginBottom: SPACING.lg,
    gap: SPACING.xs,
  },
  exploreIcon: {
    fontSize: 16,
  },
  exploreText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  seeAllText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 13,
  },
  hintBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    marginHorizontal: SPACING.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
    marginBottom: SPACING.md,
  },
  hintContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  hintIcon: {
    fontSize: 14,
  },
  hintText: {
    fontSize: 11,
    color: '#2E7D32',
    fontWeight: '500',
  },
  closeIcon: {
    color: COLORS.text.secondary,
    fontSize: 12,
  },
  listContent: {
    paddingBottom: 100, // Space for promo banner
  },
  jobCard: {
    marginHorizontal: SPACING.md,
  },
  emptyContainer: {
    padding: 50,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 10,
    color: COLORS.text.secondary,
  },
  promoBanner: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#1E293B', // Dark blue like screenshot
    borderRadius: 8,
    padding: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...SHADOW.md,
  },
  promoText: {
    color: COLORS.white,
    fontSize: 13,
    lineHeight: 18,
  },
  promoHighlight: {
    color: '#fbbf24',
    fontWeight: '700',
  },
  promoBold: {
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  closePromo: {
    padding: 4,
  },
  closePromoText: {
    color: COLORS.white,
    fontSize: 16,
  },
});

export default HomeScreen;

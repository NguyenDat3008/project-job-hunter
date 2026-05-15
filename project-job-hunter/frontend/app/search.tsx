import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image,
  StatusBar,
  ScrollView,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { jobService } from '@services/jobService';
import { Job } from '@/types/job.types';
import { JobCard } from '@components/index';
import { COLORS, SHADOW } from '@constants/theme';

const FILTER_OPTIONS = {
  experience: ['Tất cả kinh nghiệm', 'Chưa có kinh nghiệm', 'Dưới 1 năm', '1 năm', '2 năm', '3 năm', '4 năm', '5 năm', 'Trên 5 năm'],
  salary: ['Tất cả mức lương', 'Dưới 10 triệu', '10 - 15 triệu', '15 - 20 triệu', '20 - 30 triệu', '30 - 50 triệu', 'Trên 50 triệu', 'Thỏa thuận'],
  location: ['Toàn quốc', 'Hà Nội', 'Hồ Chí Minh', 'Đà Nẵng', 'Bình Dương', 'Khác'],
  level: ['Tất cả cấp bậc', 'INTERN', 'FRESHER', 'JUNIOR', 'MIDDLE', 'SENIOR', 'LEAD', 'MANAGER'],
};

export default function SearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Job[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  
  // Filter States
  const [filters, setFilters] = useState({
    experience: 'Tất cả kinh nghiệm',
    salary: 'Tất cả mức lương',
    location: 'Toàn quốc',
    level: 'Tất cả cấp bậc',
  });

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [activeFilterType, setActiveFilterType] = useState<keyof typeof FILTER_OPTIONS | null>(null);

  const handleSearch = async (query: string = searchQuery, currentFilters = filters) => {
    // Luôn cho phép search nếu có query hoặc có filter khác mặc định
    if (!query.trim() && currentFilters.location === 'Toàn quốc' && currentFilters.level === 'Tất cả cấp bậc') {
        return;
    }
    
    setLoading(true);
    setHasSearched(true);
    try {
      const response = await jobService.basicSearch({
          query: query,
          location: currentFilters.location,
          level: currentFilters.level
      });
      setResults(response?.result || []);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const openFilter = (type: keyof typeof FILTER_OPTIONS) => {
    setActiveFilterType(type);
    setModalVisible(true);
  };

  const selectOption = (option: string) => {
    if (activeFilterType) {
      const newFilters = { ...filters, [activeFilterType]: option };
      setFilters(newFilters);
      setModalVisible(false);
      // Tự động search lại khi đổi filter
      handleSearch(searchQuery, newFilters);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setResults([]);
    setHasSearched(false);
    setFilters({
      experience: 'Tất cả kinh nghiệm',
      salary: 'Tất cả mức lương',
      location: 'Toàn quốc',
      level: 'Tất cả cấp bậc',
    });
  };

  const renderFilterModal = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => setModalVisible(false)}
    >
      <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {activeFilterType === 'experience' ? 'Kinh nghiệm' : 
               activeFilterType === 'salary' ? 'Mức lương' :
               activeFilterType === 'location' ? 'Địa điểm' : 'Cấp bậc'}
            </Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.optionsList}>
            {activeFilterType && FILTER_OPTIONS[activeFilterType].map((option) => (
              <TouchableOpacity 
                key={option} 
                style={[
                    styles.optionItem,
                    filters[activeFilterType] === option && styles.activeOptionItem
                ]} 
                onPress={() => selectOption(option)}
              >
                <Text style={[
                    styles.optionText,
                    filters[activeFilterType] === option && styles.activeOptionText
                ]}>{option}</Text>
                {filters[activeFilterType] === option && (
                    <Ionicons name="checkmark" size={20} color={COLORS.primary} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Pressable>
    </Modal>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Image 
        source={require('../assets/images/logo_search.jpg')}
        style={styles.emptyIllustration}
        resizeMode="contain"
      />
      <Text style={styles.emptyText}>
        {hasSearched 
          ? "Không tìm thấy công việc nào khớp với từ khóa của bạn. Hãy thử từ khóa khác hoặc xóa bộ lọc nhé." 
          : "Nhập từ khóa để tìm kiếm công việc (Ví dụ: Java, Tâm lý...)"}
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      {renderFilterModal()}
      
      {/* Header Area */}
      <View style={styles.header}>
        <View style={styles.topRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.locationSelector}
            onPress={() => openFilter('location')}
          >
            <Ionicons name="location" size={16} color={COLORS.primary} />
            <Text style={styles.locationText}>{filters.location}</Text>
            <Ionicons name="chevron-down" size={14} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Search Bar Row */}
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="thực tập sinh java, devops..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={() => handleSearch()}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={clearSearch}>
                <Ionicons name="close-circle" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity style={styles.filterBtn} onPress={() => openFilter('level')}>
            <Ionicons name="options-outline" size={20} color="#374151" />
          </TouchableOpacity>
        </View>

        {/* Filter Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          <TouchableOpacity 
            style={[styles.filterChip, filters.experience !== 'Tất cả kinh nghiệm' && styles.activeFilterChip]} 
            onPress={() => openFilter('experience')}
          >
            <Text style={[styles.filterChipText, filters.experience !== 'Tất cả kinh nghiệm' && styles.activeFilterChipText]}>
                {filters.experience === 'Tất cả kinh nghiệm' ? 'Kinh nghiệm' : filters.experience}
            </Text>
            <Ionicons name="chevron-down" size={12} color={filters.experience !== 'Tất cả kinh nghiệm' ? COLORS.primary : "#6B7280"} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.filterChip, filters.salary !== 'Tất cả mức lương' && styles.activeFilterChip]} 
            onPress={() => openFilter('salary')}
          >
            <Text style={[styles.filterChipText, filters.salary !== 'Tất cả mức lương' && styles.activeFilterChipText]}>
                {filters.salary === 'Tất cả mức lương' ? 'Mức lương' : filters.salary}
            </Text>
            <Ionicons name="chevron-down" size={12} color={filters.salary !== 'Tất cả mức lương' ? COLORS.primary : "#6B7280"} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.filterChip, filters.level !== 'Tất cả cấp bậc' && styles.activeFilterChip]} 
            onPress={() => openFilter('level')}
          >
            <Text style={[styles.filterChipText, filters.level !== 'Tất cả cấp bậc' && styles.activeFilterChipText]}>
                {filters.level === 'Tất cả cấp bậc' ? 'Cấp bậc' : filters.level}
            </Text>
            <Ionicons name="chevron-down" size={12} color={filters.level !== 'Tất cả cấp bậc' ? COLORS.primary : "#6B7280"} />
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Results Header */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>
          <Text style={{ color: COLORS.primary, fontWeight: '700' }}>{results.length}</Text> kết quả
        </Text>
        <TouchableOpacity style={styles.alertBtn}>
          <Ionicons name="notifications-outline" size={18} color="#374151" />
          <Text style={styles.alertBtnText}>Tạo thông báo</Text>
        </TouchableOpacity>
      </View>

      {/* Main List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Đang tìm kiếm công việc...</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <JobCard 
              job={item} 
              onPress={() => router.push(`/detail?jobId=${item.id}`)}
            />
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyState}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  backBtn: {
    padding: 4,
  },
  locationSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  locationText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
  },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterScroll: {
    flexDirection: 'row',
    paddingVertical: 4,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 8,
    gap: 4,
  },
  filterChipText: {
    fontSize: 13,
    color: '#4B5563',
  },
  activeFilterChip: {
    borderColor: COLORS.primary,
    backgroundColor: '#ECFDF5',
  },
  activeFilterChipText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  optionsList: {
    padding: 8,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  activeOptionItem: {
    backgroundColor: '#F0FDF4',
  },
  optionText: {
    fontSize: 15,
    color: '#374151',
  },
  activeOptionText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  resultsCount: {
    fontSize: 14,
    color: '#6B7280',
  },
  alertBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    ...SHADOW.sm,
  },
  alertBtnText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyIllustration: {
    width: 250,
    height: 250,
    marginBottom: 24,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 22,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },
});

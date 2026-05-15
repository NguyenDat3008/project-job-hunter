import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const TOPCV_GREEN = '#00B14F';

const MOCK_CV_TEMPLATES = [
  { id: '1', name: 'Ấn tượng 6', type: 'Chuyên nghiệp', color: '#4B5563' },
  { id: '2', name: 'Hiện đại 6', type: 'Hiện đại', color: '#FCE7F3' },
  { id: '3', name: 'Thanh lịch 2', type: 'Đơn giản', color: '#E0F2FE' },
  { id: '4', name: 'Sáng tạo 5', type: 'Hiện đại', color: '#FFEDD5' },
];

export default function CVTab() {
  const router = useRouter();
  const [showBanner, setShowBanner] = useState(true);
  
  return (
    <View style={styles.container}>
      {/* Header Search */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color={TOPCV_GREEN} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="thực tập sinh"
            placeholderTextColor="#9CA3AF"
          />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Pro Banner */}
        <View style={styles.proBannerWrapper}>
          <TouchableOpacity style={styles.proBanner}>
            <Text style={styles.proBannerText}>Truy cập TopCV</Text>
            <View style={styles.proBadge}>
              <Text style={styles.proBadgeText}>Pro</Text>
            </View>
            <Ionicons name="arrow-forward" size={18} color="#111827" />
          </TouchableOpacity>
        </View>

        {/* Hero Banner */}
        <View style={styles.heroBanner}>
          <Text style={styles.heroText}>100+ Mẫu CV chuyên nghiệp</Text>
          {/* Decorative CVs vector placeholder */}
          <View style={styles.heroDecoWrap}>
            <View style={[styles.heroDecoItem, { right: 40, transform: [{ rotate: '-10deg' }] }]} />
            <View style={[styles.heroDecoItem, { right: 8, transform: [{ rotate: '5deg' }] }]} />
          </View>
        </View>

        {/* Filter Section */}
        <View style={styles.filterSection}>
          <View style={styles.filterHeader}>
            <Text style={styles.filterTitle}>Mẫu CV theo style</Text>
            <Text style={styles.seeAll}>Xem tất cả</Text>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagsScroll}>
            <TouchableOpacity style={[styles.tag, styles.tagActive]}>
              <Text style={styles.tagTextActive}>Tất cả</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.tag}>
              <Text style={styles.tagText}>Đơn giản</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.tag}>
              <Text style={styles.tagText}>Chuyên nghiệp</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.tag}>
              <Text style={styles.tagText}>Hiện đại</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Templates Grid */}
        <View style={styles.templatesGrid}>
          {MOCK_CV_TEMPLATES.map((tpl) => (
            <TouchableOpacity 
              key={tpl.id} 
              style={styles.templateCard}
              onPress={() => router.push('/cv-builder')}
              activeOpacity={0.8}
            >
              <View style={[styles.cvPreviewBox, { backgroundColor: tpl.color }]}>
                {/* Giả lập tài liệu CV trực quan */}
                <View style={styles.mockHeader}>
                  <View style={styles.mockAvatar} />
                  <View style={{ flex: 1 }}>
                    <View style={styles.mockLine} />
                    <View style={[styles.mockLine, { width: '60%' }]} />
                  </View>
                </View>
                <View style={styles.mockBody}>
                  <View style={styles.mockLine} />
                  <View style={styles.mockLine} />
                  <View style={[styles.mockLine, { width: '80%' }]} />
                  <View style={{ height: 10 }} />
                  <View style={[styles.mockLine, { width: '40%' }]} />
                  <View style={styles.mockLine} />
                  <View style={[styles.mockLine, { width: '70%' }]} />
                </View>
              </View>
              <View style={styles.templateInfo}>
                <Text style={styles.templateName}>{tpl.name}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
      
      {/* Floating Bottom Banner */}
      {showBanner && (
        <View style={styles.bottomBannerAd}>
          <View style={{ flex: 1 }}>
            <Text style={styles.bottomBannerText}>
              <Text style={{ fontWeight: 'bold' }}>Hơn 20.000 NTD</Text> đang tìm kiếm ứng viên.
            </Text>
            <Text style={styles.bottomBannerTextHighlight}>
              <Text style={{ fontWeight: 'bold' }}>Tạo CV ngay</Text> để NTD tìm thấy bạn!
            </Text>
          </View>
          <TouchableOpacity onPress={() => setShowBanner(false)}>
            <Ionicons name="close" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  searchWrapper: { paddingHorizontal: 16, paddingTop: 50, paddingBottom: 16, backgroundColor: '#fff' },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6',
    height: 44, borderRadius: 8, paddingHorizontal: 16,
  },
  searchInput: { flex: 1, fontSize: 15, color: '#1F2937' },
  proBannerWrapper: { backgroundColor: '#F9FAFB', paddingVertical: 12, alignItems: 'center' },
  proBanner: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF3C7',
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, gap: 6,
  },
  proBannerText: { fontSize: 14, fontWeight: '600', color: '#111827' },
  proBadge: { backgroundColor: '#F59E0B', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  proBadgeText: { fontSize: 12, fontWeight: '800', color: '#111827' },
  heroBanner: {
    backgroundColor: '#103F32', height: 80, paddingHorizontal: 16,
    flexDirection: 'row', alignItems: 'center', position: 'relative', overflow: 'hidden'
  },
  heroText: { color: '#fff', fontSize: 16, fontWeight: '700', zIndex: 1 },
  heroDecoWrap: { position: 'absolute', right: 0, top: 10, bottom: -10, width: 100 },
  heroDecoItem: {
    position: 'absolute', width: 44, height: 60, backgroundColor: '#fff',
    borderRadius: 4, borderWidth: 1, borderColor: '#E5E7EB',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4
  },
  filterSection: { paddingTop: 20 },
  filterHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12 },
  filterTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  seeAll: { fontSize: 14, color: TOPCV_GREEN, fontWeight: '600' },
  tagsScroll: { paddingHorizontal: 16, paddingBottom: 8 },
  tag: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: '#E5E7EB', marginRight: 8, backgroundColor: '#fff'
  },
  tagActive: { borderColor: TOPCV_GREEN, backgroundColor: '#F0FDF4' },
  tagText: { fontSize: 13, color: '#4B5563', fontWeight: '500' },
  tagTextActive: { fontSize: 13, color: TOPCV_GREEN, fontWeight: '600' },
  templatesGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, justifyContent: 'space-between' },
  templateCard: {
    width: '48%', backgroundColor: '#fff', borderRadius: 8,
    marginBottom: 16, borderWidth: 1, borderColor: '#F3F4F6',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1
  },
  cvPreviewBox: { height: 220, borderTopLeftRadius: 8, borderTopRightRadius: 8, padding: 12 },
  mockHeader: { flexDirection: 'row', marginBottom: 12, alignItems: 'center' },
  mockAvatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(0,0,0,0.1)', marginRight: 8 },
  mockBody: {},
  mockLine: { height: 4, backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: 2, marginBottom: 6 },
  templateInfo: { padding: 12, alignItems: 'center' },
  templateName: { fontSize: 14, fontWeight: '700', color: '#111827' },
  bottomBannerAd: {
    position: 'absolute', bottom: 16, left: 16, right: 16,
    backgroundColor: '#1E293B', borderRadius: 8, padding: 16,
    flexDirection: 'row', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 6
  },
  bottomBannerText: { color: '#E2E8F0', fontSize: 13, marginBottom: 2 },
  bottomBannerTextHighlight: { color: '#fff', fontSize: 13 },
});

import { JobCard, LoadingSpinner, SkillTag } from '@components/index';
import { COLORS, SPACING, TYPOGRAPHY, SHADOW } from '@constants/theme';
import { recommendationService } from '@services/recommendationService';
import { jobService } from '@services/jobService';
import { Job } from '@/types/job.types';
import { useAuthStore } from '@store/authStore';
import { useRouter } from 'expo-router';
import React, { useEffect, useState, useRef } from 'react';
import { 
  ScrollView, 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  Animated, 
  Easing,
  Dimensions,
  Modal,
  Alert,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import api from '@services/api';

const { width } = Dimensions.get('window');

const PRESET_SKILLS = [
  'Java', 'Spring Boot', 'React Native', 'React', 'Node.js', 
  'Python', 'AWS', 'Docker', 'SQL', 'NoSQL', 'TypeScript', 
  'UI/UX', 'Project Management', 'Agile', 'English', 'Flutter',
  'PHP', 'C#', 'DevOps', 'Data Science'
];

interface MatchResult {
  job: Job;
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  reasons: string[];
}

export default function AIMatchTab() {
  const router = useRouter();
  const { user, isAuthenticated, refreshUserFromServer } = useAuthStore();
  const [results, setResults] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [showSurvey, setShowSurvey] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  
  // Animation refs
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isAuthenticated) {
      if (!user?.skills || user.skills.length === 0) {
        setShowSurvey(true);
        setLoading(false);
      } else {
        loadRecommendations();
      }
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, user?.skills?.length]);

  const startAnimations = () => {
    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1500,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
          easing: Easing.in(Easing.ease),
        })
      ])
    ).start();

    // Scan line animation
    Animated.loop(
      Animated.timing(scanLineAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
        easing: Easing.linear,
      })
    ).start();
  };

  const loadRecommendations = async () => {
    try {
      setScanning(true);
      startAnimations();
      
      // Simulate scanning for visual effect
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      const data = await recommendationService.getRecommendedJobs();
      setResults(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setScanning(false);
      setLoading(false);
    }
  };

  const handleSaveSkills = async () => {
    if (selectedSkills.length === 0) {
      Alert.alert('Thông báo', 'Vui lòng chọn ít nhất 1 kỹ năng để AI có thể hoạt động.');
      return;
    }

    try {
      setLoading(true);
      // Backend expects Subscriber object with skills
      // We need the subscriber id, but let's assume we can update by email
      // Actually, PUT /subscribers requires ID. Let's find subscriber first.
      const subResponse = await api.post<any>('/subscribers/skills');
      
      const updatedSub = {
        id: subResponse.id,
        email: user?.email,
        name: user?.name,
        skills: selectedSkills.map(s => ({ name: s }))
      };

      await api.put('/subscribers', updatedSub);
      await refreshUserFromServer();
      setShowSurvey(false);
      loadRecommendations();
    } catch (error) {
      console.error('Update skills error:', error);
      Alert.alert('Lỗi', 'Không thể cập nhật kỹ năng. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const toggleSkill = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(prev => prev.filter(s => s !== skill));
    } else {
      setSelectedSkills(prev => [...prev, skill]);
    }
  };

  const handleToggleSave = async (job: Job) => {
    try {
      await jobService.saveJob(job.id);
      setResults(prev => prev.map(r => 
        r.job.id === job.id ? { ...r, job: { ...r.job, isSaved: !r.job.isSaved } } : r
      ));
    } catch (error) {
      console.error('Error toggling save:', error);
    }
  };

  const handleScanCV = async () => {
    try {
      const DocumentPicker = require('expo-document-picker');
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      });

      if (!result.canceled) {
        setLoading(true);
        const file = result.assets[0];
        
        const formData = new FormData();
        formData.append('file', {
          uri: file.uri,
          name: file.name,
          type: file.mimeType || 'application/pdf',
        } as any);

        const scanResult = await api.upload<any>('/subscribers/scan-cv', formData);
        
        if (scanResult && scanResult.extracted_skills) {
          const newSkills = [...new Set([...selectedSkills, ...scanResult.extracted_skills])];
          setSelectedSkills(newSkills);
          Alert.alert('Thành công', `AI đã tìm thấy ${scanResult.extracted_skills.length} kỹ năng từ CV của bạn!`);
        }
      }
    } catch (error) {
      console.error('Scan CV error:', error);
      Alert.alert('Lỗi', 'Không thể quét CV. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !scanning) {
    return <LoadingSpinner fullScreen message="AI đang khởi động..." />;
  }

  if (!isAuthenticated) {
    return (
      <LinearGradient colors={['#1E1B4B', '#312E81']} style={styles.emptyContainer}>
        <View style={styles.aiCircle}>
          <Ionicons name="sparkles" size={60} color="#818CF8" />
        </View>
        <Text style={styles.emptyTitle}>AI Matching</Text>
        <Text style={styles.emptySubtitle}>
          Đăng nhập để AI phân tích hàng ngàn việc làm và tìm ra cơ hội phù hợp nhất với bạn.
        </Text>
        <TouchableOpacity 
          style={styles.loginBtn}
          onPress={() => router.push('/login')}
        >
          <Text style={styles.loginBtnText}>Đăng nhập ngay</Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  if (showSurvey) {
    return (
      <View style={styles.surveyContainer}>
        <LinearGradient colors={['#7C3AED', '#4C1D95']} style={styles.surveyHeader}>
          <Text style={styles.surveyTitle}>Khảo sát Kỹ năng</Text>
          <Text style={styles.surveySubtitle}>
            Hãy chọn các kỹ năng bạn có để AI tìm kiếm việc làm chính xác nhất.
          </Text>
          
          <TouchableOpacity style={styles.scanCvBtn} onPress={handleScanCV}>
            <Ionicons name="document-text" size={20} color="white" />
            <Text style={styles.scanCvBtnText}>Tải CV để AI quét kỹ năng</Text>
          </TouchableOpacity>
        </LinearGradient>
        
        <ScrollView style={styles.surveyScroll} contentContainerStyle={styles.surveyContent}>
          <Text style={styles.skillLabel}>Kỹ năng phổ biến</Text>
          <View style={styles.skillGrid}>
            {PRESET_SKILLS.map(skill => (
              <TouchableOpacity
                key={skill}
                style={[
                  styles.skillBtn,
                  selectedSkills.includes(skill) && styles.skillBtnActive
                ]}
                onPress={() => toggleSkill(skill)}
              >
                <Text style={[
                  styles.skillBtnText,
                  selectedSkills.includes(skill) && styles.skillBtnTextActive
                ]}>
                  {skill}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <View style={styles.surveyFooter}>
          <TouchableOpacity 
            style={[styles.matchNowBtn, selectedSkills.length === 0 && styles.disabledBtn]}
            onPress={handleSaveSkills}
            disabled={selectedSkills.length === 0}
          >
            <Text style={styles.matchNowBtnText}>Bắt đầu Kết nối</Text>
            <Ionicons name="arrow-forward" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1E1B4B', '#312E81']} style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.aiBadge}>
            <Ionicons name="hardware-chip-outline" size={16} color="white" />
            <Text style={styles.aiBadgeText}>AI SCANNING</Text>
          </View>
          <TouchableOpacity onPress={() => setShowSurvey(true)}>
            <Ionicons name="options-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.scannerWrapper}>
          {scanning ? (
            <View style={styles.scanningBox}>
              <Animated.View style={[styles.pulseCircle, { transform: [{ scale: pulseAnim }] }]} />
              <Animated.View style={[styles.pulseCircle2, { transform: [{ scale: pulseAnim }] }]} />
              <View style={styles.aiIconBox}>
                <Ionicons name="scan" size={50} color="#818CF8" />
              </View>
              <Animated.View 
                style={[
                  styles.scanLine, 
                  { 
                    transform: [{ 
                      translateY: scanLineAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 140]
                      }) 
                    }] 
                  }
                ]} 
              />
            </View>
          ) : (
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{results.length}</Text>
                <Text style={styles.statDesc}>Phù hợp</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {Math.round(results.reduce((sum, r) => sum + r.matchScore, 0) / Math.max(results.length, 1))}%
                </Text>
                <Text style={styles.statDesc}>Match TB</Text>
              </View>
            </View>
          )}
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.resultsScroll} 
        contentContainerStyle={styles.resultsContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>Kết quả phân tích</Text>
          {!scanning && (
            <TouchableOpacity onPress={loadRecommendations} style={styles.refreshBtn}>
              <Ionicons name="refresh" size={16} color={COLORS.primary} />
              <Text style={styles.refreshText}>Quét lại</Text>
            </TouchableOpacity>
          )}
        </View>

        {scanning ? (
          <View style={styles.scanningPlaceholder}>
            <Text style={styles.scanningText}>Hệ thống AI đang phân tích hồ sơ và thị trường...</Text>
          </View>
        ) : (
          results.map((result, idx) => (
            <View key={result.job.id} style={styles.matchCard}>
              <View style={styles.scoreBadge}>
                <Text style={styles.scoreText}>{result.matchScore}% Match</Text>
              </View>
              
              <JobCard
                job={result.job}
                onPress={() => router.push(`/detail?jobId=${result.job.id}`)}
                onSavePress={() => handleToggleSave(result.job)}
              />

              <View style={styles.matchAnalysis}>
                <View style={styles.analysisRow}>
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  <Text style={styles.analysisText}>
                    Phù hợp {result.matchedSkills.length} kỹ năng then chốt
                  </Text>
                </View>
                <View style={styles.skillsChips}>
                  {result.matchedSkills.slice(0, 4).map((s, i) => (
                    <View key={i} style={styles.chipMatched}>
                      <Text style={styles.chipText}>{s}</Text>
                    </View>
                  ))}
                  {result.matchedSkills.length > 4 && (
                    <Text style={styles.moreText}>+{result.matchedSkills.length - 4} nữa</Text>
                  )}
                </View>
              </View>
            </View>
          ))
        )}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    alignItems: 'center',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(129, 140, 248, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  aiBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  scannerWrapper: {
    height: 160,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanningBox: {
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  pulseCircle: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1,
    borderColor: 'rgba(129, 140, 248, 0.4)',
    backgroundColor: 'rgba(129, 140, 248, 0.1)',
  },
  pulseCircle2: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 1,
    borderColor: 'rgba(129, 140, 248, 0.6)',
  },
  aiIconBox: {
    zIndex: 2,
  },
  scanLine: {
    position: 'absolute',
    top: 0,
    width: '100%',
    height: 2,
    backgroundColor: '#818CF8',
    zIndex: 3,
    shadowColor: '#818CF8',
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: 'white',
  },
  statDesc: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  resultsScroll: {
    flex: 1,
    marginTop: -20,
  },
  resultsContent: {
    paddingHorizontal: 20,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1F2937',
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  refreshText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
  matchCard: {
    marginBottom: 20,
    position: 'relative',
  },
  scoreBadge: {
    position: 'absolute',
    top: -10,
    right: 10,
    backgroundColor: '#10B981',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 10,
    ...SHADOW.sm,
  },
  scoreText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '800',
  },
  matchAnalysis: {
    backgroundColor: 'white',
    marginTop: -10,
    padding: 12,
    paddingTop: 18,
    borderRadius: 12,
    zIndex: -1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  analysisRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  analysisText: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '500',
  },
  skillsChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
  },
  chipMatched: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: '#10B981',
  },
  chipText: {
    fontSize: 11,
    color: '#065F46',
    fontWeight: '600',
  },
  moreText: {
    fontSize: 11,
    color: '#6B7280',
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  aiCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(129, 140, 248, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(129, 140, 248, 0.4)',
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: 'white',
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 40,
  },
  loginBtn: {
    backgroundColor: '#818CF8',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 30,
    ...SHADOW.md,
  },
  loginBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '800',
  },
  surveyContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  surveyHeader: {
    padding: 30,
    paddingTop: 60,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  surveyTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: 'white',
    marginBottom: 8,
  },
  surveySubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
    marginBottom: 20,
  },
  scanCvBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    gap: 10,
    alignSelf: 'flex-start',
  },
  scanCvBtnText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
  },
  surveyScroll: {
    flex: 1,
  },
  surveyContent: {
    padding: 20,
  },
  skillLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 20,
  },
  skillGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  skillBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  skillBtnActive: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  skillBtnText: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '600',
  },
  skillBtnTextActive: {
    color: 'white',
  },
  surveyFooter: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 60 : 40, // Đẩy lên cao hơn để tránh bị tab bar che
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  matchNowBtn: {
    backgroundColor: '#7C3AED',
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    ...SHADOW.md,
  },
  matchNowBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '800',
  },
  disabledBtn: {
    backgroundColor: '#D1D5DB',
  },
  scanningPlaceholder: {
    padding: 40,
    alignItems: 'center',
  },
  scanningText: {
    textAlign: 'center',
    color: '#6B7280',
    lineHeight: 20,
    fontSize: 14,
  },
});

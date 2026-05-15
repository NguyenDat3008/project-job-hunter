import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState, useCallback } from 'react';
import {
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
  Image,
  RefreshControl,
  Alert,
} from 'react-native';
import { BORDER_RADIUS, COLORS, SHADOW, SPACING, TYPOGRAPHY } from '@constants/theme';
import { useAuthStore } from '@store/authStore';
import api from '@services/api';
import { ENDPOINTS } from '@constants/endpoints';

export default function ProfileTab() {
  const router = useRouter();
  const { user, isAuthenticated, logout, updateUser, refreshUserFromServer } = useAuthStore();

  const [refreshing, setRefreshing] = useState(false);
  const [isLookingForJob, setIsLookingForJob] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);

  // Hàm làm mới thông tin User từ server
  const fetchLatestUserData = useCallback(async () => {
    try {
      await refreshUserFromServer();
    } catch (error) {
      console.error('Failed to sync user data:', error);
    } finally {
      setRefreshing(false);
      setCheckingStatus(false);
    }
  }, [refreshUserFromServer]);

  // Kiểm tra trạng thái công ty nếu là candidate
  const checkCompanyStatus = async () => {
    try {
      setCheckingStatus(true);
      const res = await api.get('/companies') as any;
      const allCompanies = Array.isArray(res) ? res : (res?.result || []);
      const myCompany = allCompanies.find((c: any) => c.createdBy === user?.email);
      if (myCompany && !myCompany.active) {
        return 'PENDING';
      }
    } catch (e) {
      console.log('No pending company found');
    } finally {
      setCheckingStatus(false);
    }
    return null;
  };

  const [companyStatus, setCompanyStatus] = useState<string | null>(null);

  useEffect(() => {
    fetchLatestUserData();
    checkCompanyStatus().then(setCompanyStatus);
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLatestUserData();
    checkCompanyStatus().then(setCompanyStatus);
  };

  const handleLogout = () => {
    Alert.alert(
      'Xác nhận đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất không?',
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Đăng xuất',
          onPress: async () => {
            await logout();
            router.replace('/');
          },
          style: 'destructive',
        },
      ],
      { cancelable: true }
    );
  };

  const isAdmin = user?.role?.name === 'SUPER_ADMIN';
  const isHR = user?.role?.name === 'HR';
  const isCompanyRep = user?.role?.name === 'COMPANY_REPRESENTATIVE';
  const isCandidate = !isAdmin && !isHR && !isCompanyRep;

  const bannerImage = require('../../assets/images/Banner trên cùng mục cá nhân.jpg');

  const MenuItem = ({ icon, label, onPress, rightElement, description, iconColor = COLORS.primary, bgColor = '#F0FDF4' }: any) => (
    <TouchableOpacity 
      style={styles.menuItem} 
      onPress={onPress} 
      activeOpacity={0.7}
      disabled={!onPress}
    >
      <View style={styles.menuItemTop}>
        <View style={[styles.menuIconWrap, { backgroundColor: bgColor }]}>
          <Ionicons name={icon} size={20} color={iconColor} />
        </View>
        <View style={styles.menuTextContent}>
          <Text style={styles.menuLabel}>{label}</Text>
        </View>
        {rightElement ? rightElement : (
          <Ionicons name="chevron-forward" size={18} color={COLORS.gray[400]} />
        )}
      </View>
      {description && (
        <Text style={styles.menuDescription}>{description}</Text>
      )}
    </TouchableOpacity>
  );

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
        <Ionicons name="person-circle-outline" size={80} color={COLORS.gray[300]} />
        <Text style={{ fontSize: 18, fontWeight: '700', marginTop: 16, color: COLORS.text.primary }}>Chưa đăng nhập</Text>
        <Text style={{ fontSize: 13, color: COLORS.text.secondary, textAlign: 'center', marginTop: 8, marginBottom: 24 }}>
          Bạn cần đăng nhập để xem thông tin cá nhân và quản lý hồ sơ.
        </Text>
        <TouchableOpacity 
          style={{ backgroundColor: COLORS.primary, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 24 }}
          onPress={() => router.push('/login')}
        >
          <Text style={{ color: COLORS.white, fontWeight: '700' }}>Đăng nhập ngay</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />
      
      <View style={styles.headerContainer}>
        <View style={styles.topBannerBg}>
          <Image source={bannerImage} style={styles.bannerImg} resizeMode="cover" />
          <View style={styles.headerTopIcons}>
            <TouchableOpacity 
              style={styles.headerIconButton}
              onPress={() => router.push('/account-settings')}
            >
              <Ionicons name="settings-outline" size={24} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.profileCard}>
          <View style={styles.profileInfoRow}>
            <View style={styles.avatarWrap}>
              <View style={styles.avatarCircle}>
                <Ionicons name="person" size={40} color={COLORS.gray[300]} />
              </View>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user?.name || 'Người dùng'}</Text>
              <Text style={styles.userId}>{user?.email}</Text>
              <View style={styles.roleTag}>
                <Text style={styles.roleTagText}>
                   {isAdmin ? 'Quản trị viên' : isCompanyRep ? 'Đại diện công ty' : isHR ? 'Nhà tuyển dụng' : 'Ứng viên'}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      >
        {/* Pending Approval Banner */}
        {companyStatus === 'PENDING' && (
          <View style={[styles.section, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', padding: 10 }}>
              <Ionicons name="time-outline" size={20} color="#B45309" />
              <View style={{ marginLeft: 10, flex: 1 }}>
                <Text style={{ fontWeight: '700', color: '#92400E', fontSize: 13 }}>Đang chờ phê duyệt</Text>
                <Text style={{ fontSize: 11, color: '#B45309' }}>Hệ thống đang xem xét yêu cầu đăng ký doanh nghiệp của bạn.</Text>
              </View>
            </View>
          </View>
        )}

        {/* Admin Section */}
        {isAdmin && (
          <>
            <View style={styles.sectionTitleWrap}>
              <Text style={styles.sectionTitle}>Quản trị hệ thống</Text>
            </View>
            <View style={styles.sectionGroup}>
              <MenuItem 
                icon="shield-checkmark" 
                label="Duyệt Doanh nghiệp" 
                onPress={() => router.push('/admin/dashboard')}
                iconColor={COLORS.primary}
                bgColor="#F0FDF4"
              />
              <View style={styles.divider} />
              <MenuItem 
                icon="people" 
                label="Quản lý Người dùng" 
                onPress={() => router.push('/admin/users')}
                iconColor={COLORS.primary}
                bgColor="#F0FDF4"
              />
              <View style={styles.divider} />
              <MenuItem 
                icon="business" 
                label="Quản lý Công ty" 
                onPress={() => router.push('/admin/companies')}
                iconColor={COLORS.primary}
                bgColor="#F0FDF4"
              />
              <View style={styles.divider} />
              <MenuItem 
                icon="document-text" 
                label="Quản lý Ứng tuyển (HR)" 
                onPress={() => router.push('/admin/resumes')}
                iconColor={COLORS.primary}
                bgColor="#F0FDF4"
              />
            </View>
          </>
        )}

        {/* Company Representative Section */}
        {isCompanyRep && (
          <>
            <View style={styles.sectionTitleWrap}>
              <Text style={styles.sectionTitle}>Quản lý công ty</Text>
            </View>
            <View style={styles.sectionGroup}>
              <MenuItem 
                icon="people" 
                label="Quản lý nhân viên HR" 
                description="Thêm/xóa HR trong công ty của bạn"
                onPress={() => router.push('/company-rep/hr-management')}
                iconColor={COLORS.primary}
                bgColor="#F0FDF4"
              />
              <View style={styles.divider} />
              <MenuItem 
                icon="business" 
                label="Thông tin công ty" 
                description="Chỉnh sửa thông tin và logo doanh nghiệp"
                onPress={() => router.push('/company-rep/company-profile')}
                iconColor={COLORS.primary}
                bgColor="#F0FDF4"
              />
              <View style={styles.divider} />
              <MenuItem 
                icon="add-circle" 
                label="Đăng tin tuyển dụng" 
                onPress={() => router.push('/hr/job-form')}
                iconColor={COLORS.primary}
                bgColor="#F0FDF4"
              />
              <View style={styles.divider} />
              <MenuItem 
                icon="list" 
                label="Việc làm đã đăng" 
                onPress={() => router.push('/hr/my-jobs')}
                iconColor={COLORS.primary}
                bgColor="#F0FDF4"
              />
            </View>
          </>
        )}

        {/* HR Section */}
        {isHR && (
          <>
            <View style={styles.sectionTitleWrap}>
              <Text style={styles.sectionTitle}>Quản lý tuyển dụng</Text>
            </View>
            <View style={styles.sectionGroup}>
              <MenuItem 
                icon="add-circle" 
                label="Đăng tin tuyển dụng mới" 
                iconColor={COLORS.primary}
                bgColor="#F0FDF4"
                onPress={() => router.push('/hr/job-form')}
              />
              <View style={styles.divider} />
              <MenuItem 
                icon="list" 
                label="Việc làm đã đăng" 
                iconColor={COLORS.primary}
                bgColor="#F0FDF4"
                onPress={() => router.push('/hr/my-jobs')}
              />
              <View style={styles.divider} />
              <MenuItem 
                icon="documents" 
                label="Hồ sơ ứng tuyển" 
                iconColor={COLORS.primary}
                bgColor="#F0FDF4"
                onPress={() => router.push('/admin/resumes')}
              />
            </View>
          </>
        )}

        {/* Candidate / Partner Section */}
        {isCandidate && !companyStatus && (
          <>
            <View style={styles.sectionTitleWrap}>
              <Text style={styles.sectionTitle}>Dành cho đối tác</Text>
            </View>
            <View style={styles.sectionGroup}>
              <MenuItem 
                icon="business" 
                label="Đăng ký doanh nghiệp" 
                description="Trở thành đối tác tuyển dụng của Job Hunter"
                onPress={() => router.push('/register-company')}
                iconColor={COLORS.primary}
                bgColor="#F0FDF4"
              />
            </View>
          </>
        )}

        <View style={styles.sectionTitleWrap}>
          <Text style={styles.sectionTitle}>Hồ sơ cá nhân</Text>
        </View>
        <View style={styles.sectionGroup}>
          <MenuItem 
            icon="heart" 
            label="Việc làm đã lưu" 
            onPress={() => router.push('/saved-jobs')}
            iconColor={COLORS.primary}
            bgColor="#F0FDF4"
          />
          <View style={styles.divider} />
          <MenuItem 
            icon="briefcase" 
            label="Đơn ứng tuyển của tôi" 
            onPress={() => router.push('/(tabs)/applications')}
            iconColor={COLORS.primary}
            bgColor="#F0FDF4"
          />
        </View>

        <View style={styles.sectionTitleWrap}>
          <Text style={styles.sectionTitle}>Trạng thái tìm việc</Text>
        </View>
        <View style={styles.section}>
          <MenuItem 
            icon="stats-chart" 
            label="Trạng thái tìm việc" 
            description="Bật tìm việc ngay để làm nổi bật hồ sơ."
            iconColor={COLORS.primary}
            bgColor="#F0FDF4"
            rightElement={
              <Switch
                value={isLookingForJob}
                onValueChange={setIsLookingForJob}
                trackColor={{ false: COLORS.gray[200], true: COLORS.success }}
                thumbColor={Platform.OS === 'ios' ? undefined : COLORS.white}
              />
            }
          />
        </View>

        <View style={styles.sectionTitleWrap}>
          <Text style={styles.sectionTitle}>CV của tôi</Text>
        </View>
        <View style={styles.sectionGroup}>
          <MenuItem 
            icon="document-text" 
            label="CV đã tạo trên hệ thống" 
            onPress={() => router.push('/cv-builder')}
            iconColor={COLORS.primary}
            bgColor="#F0FDF4"
          />
          <View style={styles.divider} />
          <MenuItem 
            icon="cloud-upload" 
            label="CV đã tải lên" 
            onPress={() => router.push('/upload-cv')}
            iconColor={COLORS.primary}
            bgColor="#F0FDF4"
          />
        </View>

        <View style={styles.sectionTitleWrap}>
          <Text style={styles.sectionTitle}>Cài đặt</Text>
        </View>
        <View style={styles.sectionGroup}>
          <MenuItem 
            icon="key" 
            label="Đổi mật khẩu" 
            onPress={() => router.push('/account-settings')}
            iconColor={COLORS.primary}
            bgColor="#F0FDF4"
          />
        </View>

        <View style={styles.sectionTitleWrap}>
          <Text style={styles.sectionTitle}>Thông tin & Chính sách</Text>
        </View>
        <View style={styles.sectionGroup}>
          <MenuItem 
            icon="information-circle" 
            label="Giới thiệu về TopCV" 
            onPress={() => router.push('/about')}
            iconColor={COLORS.primary}
            bgColor="#F0FDF4"
          />
          <View style={styles.divider} />
          <MenuItem 
            icon="shield-checkmark" 
            label="Chính sách bảo mật" 
            onPress={() => router.push('/privacy')}
            iconColor={COLORS.primary}
            bgColor="#F0FDF4"
          />
          <View style={styles.divider} />
          <MenuItem 
            icon="document-text" 
            label="Điều khoản sử dụng" 
            onPress={() => router.push('/terms')}
            iconColor={COLORS.primary}
            bgColor="#F0FDF4"
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.versionText}>Phiên bản: 1.0.0</Text>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutText}>Đăng xuất</Text>
            <Ionicons name="log-out-outline" size={20} color={COLORS.error || '#F44336'} />
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.secondary,
  },
  headerContainer: {
    height: 130,
    position: 'relative',
  },
  topBannerBg: {
    backgroundColor: COLORS.primaryDark,
    height: 80,
    overflow: 'hidden',
  },
  bannerImg: {
    width: '100%',
    height: '100%',
    opacity: 0.9,
  },
  headerTopIcons: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 10 : 6,
    right: 16,
    flexDirection: 'row',
  },
  headerIconButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileCard: {
    position: 'absolute',
    bottom: 0,
    left: 28,
    right: 28,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    ...SHADOW.md,
    borderWidth: 0.5,
    borderColor: '#F5F5F5',
  },
  profileInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrap: {
    marginRight: 12,
  },
  avatarCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: '#E5E7EB',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text.primary,
  },
  userId: {
    fontSize: 11,
    color: COLORS.text.secondary,
    marginBottom: 4,
  },
  roleTag: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  roleTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.primary,
  },
  scrollContent: {
    paddingTop: 10,
    paddingHorizontal: 28,
  },
  section: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginBottom: 14,
    paddingHorizontal: 10,
    ...SHADOW.sm,
    borderWidth: 0.5,
    borderColor: '#F9FAFB',
  },
  sectionGroup: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginBottom: 14,
    paddingHorizontal: 10,
    ...SHADOW.sm,
    borderWidth: 0.5,
    borderColor: '#F9FAFB',
  },
  sectionTitleWrap: {
    marginBottom: 4,
    paddingLeft: 4,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.text.primary,
  },
  menuItem: {
    paddingVertical: 10,
  },
  menuItemTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  menuTextContent: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  menuDescription: {
    fontSize: 10,
    color: COLORS.text.secondary,
    marginTop: 3,
    lineHeight: 14,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 10,
  },
  footer: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  versionText: {
    fontSize: 11,
    color: COLORS.text.light,
    marginBottom: 10,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
    ...SHADOW.sm,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  logoutText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.error || '#F44336',
  },
  bottomSpacer: {
    height: 40,
  },
});

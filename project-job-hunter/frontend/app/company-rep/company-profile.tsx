import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import api from '@services/api';
import useAuthStore from '@store/authStore';
import { API_CONFIG } from '@constants/endpoints';
import MapView, { Marker, UrlTile } from 'react-native-maps';

const COLORS = {
  primary: '#00B14F',
  secondary: '#212f3f',
  white: '#FFFFFF',
  gray: '#F4F4F4',
  textGray: '#666666',
  error: '#FF4D4D',
  warning: '#F59E0B',
};

export default function CompanyProfileScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [company, setCompany] = useState<any>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [website, setWebsite] = useState('');
  const [industry, setIndustry] = useState('');
  const [size, setSize] = useState('');
  const [logo, setLogo] = useState('');
  const [updateReason, setUpdateReason] = useState('');
  
  // Map states
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [geocoding, setGeocoding] = useState(false);
  const [mapRegion, setMapRegion] = useState<any>(null);

  useEffect(() => {
    fetchCompanyInfo();
  }, []);

  const fetchCompanyInfo = async () => {
    if (!user?.company?.id) {
      Alert.alert('Lỗi', 'Bạn không thuộc công ty nào.');
      router.back();
      return;
    }

    try {
      setLoading(true);
      const response = await api.get(`/companies/${user.company.id}`) as any;
      if (response) {
        setCompany(response);
        setName(response.name || '');
        setDescription(response.description || '');
        setAddress(response.address || '');
        setWebsite(response.website || '');
        setIndustry(response.industry || '');
        setSize(response.size || '');
        setLogo(response.logo || '');
        
        if (response.latitude && response.longitude) {
          setLatitude(response.latitude);
          setLongitude(response.longitude);
          setMapRegion({
            latitude: response.latitude,
            longitude: response.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          });
        }
      }
    } catch (error) {
      console.error('Fetch company error:', error);
      Alert.alert('Lỗi', 'Không thể tải thông tin công ty.');
    } finally {
      setLoading(false);
    }
  };

  const handleGeocodeAddress = async () => {
    if (!address.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập địa chỉ trước khi xác định tọa độ.');
      return;
    }

    try {
      setGeocoding(true);
      // Sử dụng Nominatim API (OSM) - Miễn phí
      const query = encodeURIComponent(address);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`,
        {
          headers: {
            'User-Agent': 'JobHunterApp/1.0',
          },
        }
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        setLatitude(lat);
        setLongitude(lon);
        setMapRegion({
          latitude: lat,
          longitude: lon,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        });
        Alert.alert('Thành công', 'Đã tìm thấy vị trí trên bản đồ. Bạn có thể kiểm tra lại ghim bên dưới.');
      } else {
        Alert.alert('Lỗi', 'Không tìm thấy tọa độ cho địa chỉ này. Vui lòng nhập chi tiết hơn (Số nhà, Tên đường, Quận/Huyện, Tỉnh/Thành phố).');
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      Alert.alert('Lỗi', 'Có lỗi khi kết nối với máy chủ bản đồ.');
    } finally {
      setGeocoding(false);
    }
  };

  const handlePickLogo = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'image/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        uploadLogo(asset);
      }
    } catch (error) {
      console.error('Pick logo error:', error);
    }
  };

  const uploadLogo = async (asset: any) => {
    try {
      setUploadingLogo(true);
      const formData = new FormData();
      formData.append('file', {
        uri: asset.uri,
        name: asset.name || 'logo.jpg',
        type: asset.mimeType || 'image/jpeg',
      } as any);

      const response = await api.post('/companies/logo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }) as any;

      if (typeof response === 'string') {
        setLogo(response);
        Alert.alert('Thành công', 'Logo đã được tải lên và tối ưu hóa. Lưu ý: Thay đổi Logo cần Admin phê duyệt.');
      }
    } catch (error) {
      console.error('Upload logo error:', error);
      Alert.alert('Lỗi', 'Không thể tải logo lên.');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập tên công ty.');
      return;
    }

    // Nếu đổi tên hoặc logo, yêu cầu lý do
    const isMajorChange = name !== company.name || logo !== company.logo;
    if (isMajorChange && !updateReason.trim()) {
      Alert.alert('Thông báo', 'Thay đổi Tên hoặc Logo cần nhập lý do để Admin phê duyệt.');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        id: company.id,
        name,
        description,
        address,
        website,
        industry,
        size,
        logo,
        latitude,
        longitude,
        updateReason: isMajorChange ? updateReason : '',
      };

      await api.put('/companies', payload);
      
      Alert.alert(
        'Thành công',
        isMajorChange 
          ? 'Thông tin đã được cập nhật. Các thay đổi quan trọng (Tên/Logo) đang chờ Admin phê duyệt.'
          : 'Thông tin công ty đã được cập nhật thành công.'
      );
      
      setUpdateReason('');
      fetchCompanyInfo();
    } catch (error: any) {
      console.error('Update company error:', error);
      Alert.alert('Lỗi', error.response?.data?.message || 'Không thể cập nhật thông tin.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const isPending = company?.pendingName || company?.pendingLogo;

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.logoContainer} onPress={handlePickLogo} disabled={uploadingLogo}>
            {logo ? (
              <Image source={{ uri: API_CONFIG.BASE_URL.replace('/api', '') + '/storage/' + logo }} style={styles.logo} />
            ) : (
              <View style={styles.logoPlaceholder}>
                <Ionicons name="business" size={40} color={COLORS.textGray} />
                <Text style={styles.addLogoText}>Thêm Logo</Text>
              </View>
            )}
            {uploadingLogo && (
              <View style={styles.logoOverlay}>
                <ActivityIndicator color={COLORS.white} />
              </View>
            )}
            <View style={styles.editIconBadge}>
              <Ionicons name="camera" size={16} color={COLORS.white} />
            </View>
          </TouchableOpacity>
          <Text style={styles.companyTitle}>{company?.name}</Text>
          <Text style={styles.statusText}>ID: {company?.id}</Text>
        </View>

        {isPending && (
          <View style={styles.pendingBanner}>
            <Ionicons name="time-outline" size={20} color={COLORS.warning} />
            <Text style={styles.pendingText}>
              Bạn có thay đổi (Tên/Logo) đang chờ Admin phê duyệt.
            </Text>
          </View>
        )}

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tên công ty (Cần duyệt nếu đổi)</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Nhập tên công ty"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Ngành nghề</Text>
            <TextInput
              style={styles.input}
              value={industry}
              onChangeText={setIndustry}
              placeholder="VD: Công nghệ thông tin"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Quy mô nhân sự</Text>
            <TextInput
              style={styles.input}
              value={size}
              onChangeText={setSize}
              placeholder="VD: 100-200 nhân viên"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Website</Text>
            <TextInput
              style={styles.input}
              value={website}
              onChangeText={setWebsite}
              placeholder="https://..."
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Địa chỉ trụ sở</Text>
            <View style={styles.addressRow}>
              <TextInput
                style={[styles.input, styles.textArea, { flex: 1, marginBottom: 0 }]}
                value={address}
                onChangeText={setAddress}
                placeholder="Nhập địa chỉ"
                multiline
              />
              <TouchableOpacity 
                style={[styles.geocodeButton, geocoding && styles.disabledButton]} 
                onPress={handleGeocodeAddress}
                disabled={geocoding}
              >
                {geocoding ? (
                  <ActivityIndicator size="small" color={COLORS.primary} />
                ) : (
                  <Ionicons name="location" size={24} color={COLORS.primary} />
                )}
                <Text style={styles.geocodeText}>Xác vị trí</Text>
              </TouchableOpacity>
            </View>
          </View>

          {latitude && longitude && (
            <View style={styles.mapContainer}>
              <MapView
                style={styles.map}
                region={mapRegion}
                onRegionChangeComplete={setMapRegion}
              >
                <UrlTile
                  urlTemplate="https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  maximumZ={19}
                />
                <Marker
                  coordinate={{ latitude, longitude }}
                  title={name}
                  description={address}
                />
              </MapView>
              <View style={styles.coordInfo}>
                <Text style={styles.coordText}>Tọa độ: {latitude.toFixed(6)}, {longitude.toFixed(6)}</Text>
              </View>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mô tả công ty</Text>
            <TextInput
              style={[styles.input, styles.textArea, { height: 120 }]}
              value={description}
              onChangeText={setDescription}
              placeholder="Giới thiệu về công ty..."
              multiline
              textAlignVertical="top"
            />
          </View>

          {(name !== company?.name || logo !== company?.logo) && (
            <View style={[styles.inputGroup, styles.reasonBox]}>
              <Text style={[styles.label, { color: COLORS.primary }]}>Lý do thay đổi Tên/Logo</Text>
              <TextInput
                style={[styles.input, { borderColor: COLORS.primary }]}
                value={updateReason}
                onChangeText={setUpdateReason}
                placeholder="Nhập lý do để admin nhanh chóng phê duyệt..."
              />
            </View>
          )}

          <TouchableOpacity 
            style={[styles.saveButton, saving && styles.disabledButton]} 
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Ionicons name="save-outline" size={20} color={COLORS.white} />
                <Text style={styles.saveButtonText}>Lưu thay đổi</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.gray,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    overflow: 'hidden',
    position: 'relative',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  logoPlaceholder: {
    alignItems: 'center',
  },
  addLogoText: {
    fontSize: 10,
    color: COLORS.textGray,
    marginTop: 5,
  },
  logoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editIconBadge: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  companyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.secondary,
  },
  statusText: {
    fontSize: 12,
    color: COLORS.textGray,
    marginTop: 4,
  },
  pendingBanner: {
    flexDirection: 'row',
    backgroundColor: '#FFFBEB',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  pendingText: {
    marginLeft: 10,
    fontSize: 13,
    color: '#92400E',
    flex: 1,
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.secondary,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    backgroundColor: '#FAFAFA',
  },
  addressRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  geocodeButton: {
    width: 80,
    height: 80,
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  geocodeText: {
    fontSize: 10,
    color: COLORS.primary,
    fontWeight: 'bold',
    marginTop: 4,
  },
  mapContainer: {
    height: 200,
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  coordInfo: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(255,255,255,0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  coordText: {
    fontSize: 10,
    color: COLORS.textGray,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  reasonBox: {
    backgroundColor: '#F0FDF4',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    height: 52,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    gap: 10,
  },
  disabledButton: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

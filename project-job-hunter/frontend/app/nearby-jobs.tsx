import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Dimensions,
  TextInput,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import MapView, { Marker, UrlTile } from '@components/MapViewWrapper';
import * as Location from 'expo-location';
import api from '@services/api';
import { COLORS, SHADOW } from '@constants/theme';
import { Job } from '@/types/job.types';
import { JobCard } from '@components/index';
import { jobService } from '@services/jobService';
import {
  getClusters,
  getRegionForCluster,
  MapRegion,
  MapMarker,
  ClusterMarker,
} from '@utils/clustering';

const { height } = Dimensions.get('window');

export default function NearbyJobsScreen() {
  const router = useRouter();
  const mapRef = useRef<any>(null);

  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [searching, setSearching] = useState(false);
  const [radius, setRadius] = useState(10);
  const [keyword, setKeyword] = useState('');

  // ── State: theo dõi vùng hiển thị hiện tại của bản đồ ──────────────────────
  const [region, setRegion] = useState<MapRegion>({
    latitude: 21.0285,
    longitude: 105.8542,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  // ── Gom cụm: tính toán lại mỗi khi jobs hoặc region thay đổi ───────────────
  const clusteredMarkers: MapMarker[] = getClusters(jobs, region);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Quyền truy cập vị trí bị từ chối');
        setLoading(false);
        return;
      }

      try {
        let currentLocation = await Location.getCurrentPositionAsync({});
        setLocation(currentLocation);

        // Cập nhật region ban đầu theo vị trí thật
        const initialRegion: MapRegion = {
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        };
        setRegion(initialRegion);

        fetchNearbyJobs(
          currentLocation.coords.latitude,
          currentLocation.coords.longitude,
          keyword
        );
      } catch (error) {
        console.error('Get location error:', error);
        setErrorMsg('Không thể lấy vị trí hiện tại');
        setLoading(false);
      }
    })();
  }, []);

  const fetchNearbyJobs = async (lat: number, lng: number, name?: string) => {
    try {
      setSearching(true);
      const url = `/jobs/nearby?lat=${lat}&lng=${lng}&radius=${radius}${
        name ? `&name=${encodeURIComponent(name)}` : ''
      }`;
      const data = await api.get<Job[]>(url);
      setJobs(data || []);
    } catch (error) {
      console.error('Fetch nearby jobs error:', error);
    } finally {
      setSearching(false);
      setLoading(false);
    }
  };

  const handleToggleSave = async (job: Job) => {
    try {
      await jobService.saveJob(job.id);
      setJobs((prev) =>
        prev.map((j) => (j.id === job.id ? { ...j, isSaved: !j.isSaved } : j))
      );
    } catch (error) {
      console.error('Error toggling save:', error);
    }
  };

  const handleSearch = () => {
    if (location) {
      fetchNearbyJobs(
        location.coords.latitude,
        location.coords.longitude,
        keyword
      );
    }
  };

  // ── Cập nhật region khi người dùng kéo/zoom bản đồ ─────────────────────────
  const handleRegionChangeComplete = useCallback((newRegion: MapRegion) => {
    setRegion(newRegion);
  }, []);

  // ── Xử lý nhấn vào cụm → zoom bản đồ đến khu vực chứa các job đó ──────────
  const handleClusterPress = useCallback((cluster: ClusterMarker) => {
    const newRegion = getRegionForCluster(cluster);
    setRegion(newRegion);
    if (mapRef.current) {
      mapRef.current.animateToRegion(newRegion, 400);
    }
  }, []);

  const renderJobItem = ({ item }: { item: Job }) => (
    <JobCard
      job={item}
      onPress={() => router.push(`/detail?jobId=${item.id}`)}
      onSavePress={() => handleToggleSave(item)}
      style={{ marginBottom: 12 }}
    />
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Đang xác định vị trí của bạn...</Text>
      </View>
    );
  }

  if (errorMsg) {
    return (
      <View style={styles.center}>
        <Ionicons name="location" size={64} color={COLORS.gray[300]} />
        <Text style={styles.errorText}>{errorMsg}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => router.back()}>
          <Text style={styles.retryText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Việc làm quanh đây', headerShadowVisible: false }} />

      <View style={styles.mapWrapper}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={region}
          showsUserLocation={true}
          onRegionChangeComplete={handleRegionChangeComplete}
        >
          {/* Tile bản đồ OpenStreetMap miễn phí */}
          <UrlTile
            urlTemplate="https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maximumZ={19}
            flipY={false}
          />

          {/* ── Render các marker đã gom cụm ────────────────────────────────── */}
          {clusteredMarkers.map((marker) => {
            if (marker.type === 'single') {
              // Marker đơn lẻ: hiển thị icon chiếc vali
              return (
                <Marker
                  key={`single_${marker.job.id}`}
                  coordinate={{
                    latitude: marker.latitude,
                    longitude: marker.longitude,
                  }}
                  title={marker.job.name}
                  description={marker.job.company?.name}
                  onCalloutPress={() =>
                    router.push(`/detail?jobId=${marker.job.id}`)
                  }
                >
                  <View style={styles.singleMarker}>
                    <Ionicons name="briefcase" size={18} color={COLORS.white} />
                  </View>
                </Marker>
              );
            } else {
              // Marker cụm: hiển thị vòng tròn với số lượng
              const countLabel =
                marker.count > 99 ? '99+' : String(marker.count);
              const size =
                marker.count >= 50 ? 54 : marker.count >= 10 ? 46 : 38;

              return (
                <Marker
                  key={marker.id}
                  coordinate={{
                    latitude: marker.latitude,
                    longitude: marker.longitude,
                  }}
                  onPress={() => handleClusterPress(marker)}
                  tracksViewChanges={false}
                >
                  <View
                    style={[
                      styles.clusterMarker,
                      { width: size, height: size, borderRadius: size / 2 },
                    ]}
                  >
                    <View
                      style={[
                        styles.clusterInner,
                        {
                          width: size - 10,
                          height: size - 10,
                          borderRadius: (size - 10) / 2,
                        },
                      ]}
                    >
                      <Text style={styles.clusterCount}>{countLabel}</Text>
                    </View>
                  </View>
                </Marker>
              );
            }
          })}
        </MapView>

        {searching && (
          <View style={styles.searchingOverlay}>
            <ActivityIndicator color={COLORS.primary} />
            <Text style={styles.searchingText}>Đang tìm việc làm...</Text>
          </View>
        )}

        {/* Floating Search Bar */}
        <View style={styles.searchBarContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color={COLORS.gray[400]} />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm theo kỹ năng, vị trí..."
              value={keyword}
              onChangeText={setKeyword}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            {keyword.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setKeyword('');
                  handleSearch();
                }}
              >
                <Ionicons name="close-circle" size={18} color={COLORS.gray[400]} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      <View style={styles.listWrapper}>
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>
            Tìm thấy {jobs.length} việc làm trong bán kính {radius}km
          </Text>
        </View>
        <FlatList
          data={jobs}
          renderItem={renderJobItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="search" size={48} color="#CCC" />
              <Text style={styles.emptyText}>
                Không tìm thấy việc làm nào quanh đây
              </Text>
            </View>
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: COLORS.gray[500],
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: COLORS.gray[500],
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  retryText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  mapWrapper: {
    height: height * 0.45,
    width: '100%',
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },

  // ── Marker đơn lẻ ──────────────────────────────────────────────────────────
  singleMarker: {
    backgroundColor: COLORS.primary,
    padding: 6,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: COLORS.white,
    ...SHADOW.sm,
  },

  // ── Cluster marker ─────────────────────────────────────────────────────────
  clusterMarker: {
    backgroundColor: 'rgba(0, 102, 255, 0.25)', // vòng ngoài mờ
    justifyContent: 'center',
    alignItems: 'center',
  },
  clusterInner: {
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
    ...SHADOW.md,
  },
  clusterCount: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 12,
  },

  searchingOverlay: {
    position: 'absolute',
    top: 20,
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    ...SHADOW.md,
  },
  searchingText: {
    marginLeft: 8,
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
  listWrapper: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20,
    ...SHADOW.md,
  },
  listHeader: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  listTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.black,
  },
  listContent: {
    padding: 15,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 40,
  },
  emptyText: {
    marginTop: 10,
    color: '#999',
    fontSize: 14,
  },
  searchBarContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    left: 20,
    right: 20,
    zIndex: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 50,
    ...SHADOW.md,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: COLORS.black,
  },
});

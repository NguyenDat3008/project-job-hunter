import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import MapView, { Marker, UrlTile } from 'react-native-maps';
import * as Location from 'expo-location';
import api from '@services/api';
import { COLORS, SHADOW } from '@constants/theme';
import { Job } from '@/types/job.types';
import { JobCard } from '@components/index';
import { jobService } from '@services/jobService';

const { width, height } = Dimensions.get('window');

export default function NearbyJobsScreen() {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [searching, setSearching] = useState(false);
  const [radius, setRadius] = useState(10); // 10km radius default

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
        fetchNearbyJobs(currentLocation.coords.latitude, currentLocation.coords.longitude);
      } catch (error) {
        console.error('Get location error:', error);
        setErrorMsg('Không thể lấy vị trí hiện tại');
        setLoading(false);
      }
    })();
  }, []);

  const fetchNearbyJobs = async (lat: number, lng: number) => {
    try {
      setSearching(true);
      const data = await api.get<Job[]>(`/jobs/nearby?lat=${lat}&lng=${lng}&radius=${radius}`);
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
      setJobs(prev => prev.map(j => 
        j.id === job.id ? { ...j, isSaved: !j.isSaved } : j
      ));
    } catch (error) {
      console.error('Error toggling save:', error);
    }
  };

  const handleRegionChange = (region: any) => {
    // Optional: Auto re-fetch when map moves significantly
  };

  const handleSearchThisArea = () => {
    if (mapRef.current) {
      // Get current map center and search
      // Note: react-native-maps doesn't easily expose current center without state
    }
  };

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

  const initialRegion = {
    latitude: location?.coords.latitude || 21.0285,
    longitude: location?.coords.longitude || 105.8542,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Việc làm quanh đây', headerShadowVisible: false }} />
      
      <View style={styles.mapWrapper}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={initialRegion}
          showsUserLocation={true}
        >
          <UrlTile
            urlTemplate="https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maximumZ={19}
            flipY={false}
          />
          {jobs.map((job) => (
            job.company?.latitude && job.company?.longitude ? (
              <Marker
                key={job.id}
                coordinate={{
                  latitude: job.company.latitude,
                  longitude: job.company.longitude,
                }}
                title={job.name}
                description={job.company.name}
                onCalloutPress={() => router.push(`/detail?jobId=${job.id}`)}
              >
                <View style={styles.customMarker}>
                  <Ionicons name="briefcase" size={20} color={COLORS.white} />
                </View>
              </Marker>
            ) : null
          ))}
        </MapView>
        
        {searching && (
          <View style={styles.searchingOverlay}>
            <ActivityIndicator color={COLORS.primary} />
            <Text style={styles.searchingText}>Đang tìm việc làm...</Text>
          </View>
        )}
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
              <Text style={styles.emptyText}>Không tìm thấy việc làm nào quanh đây</Text>
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
  customMarker: {
    backgroundColor: COLORS.primary,
    padding: 5,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: COLORS.white,
    ...SHADOW.sm,
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
  jobCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  jobInfo: {
    flex: 1,
  },
  jobName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: 2,
  },
  companyName: {
    fontSize: 12,
    color: COLORS.gray[500],
    marginBottom: 5,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  salaryText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '700',
  },
  locationText: {
    fontSize: 12,
    color: COLORS.gray[500],
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
});

import { Job } from '@/types/job.types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface ClusterMarker {
  type: 'cluster';
  id: string;
  latitude: number;
  longitude: number;
  count: number;
  jobs: Job[];
}

export interface SingleMarker {
  type: 'single';
  job: Job;
  latitude: number;
  longitude: number;
}

export type MapMarker = ClusterMarker | SingleMarker;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Tính kích thước của một ô lưới vô hình trên bản đồ dựa trên mức độ thu phóng.
 * latitudeDelta càng nhỏ, zoom càng gần → ô lưới cũng nhỏ theo, các marker
 * khó bị gom cụm hơn.
 */
function getGridSize(latitudeDelta: number): number {
  // Tỉ lệ: delta 0.05 (zoom gần) → grid 0.005; delta 5 (zoom xa) → grid 0.5
  return latitudeDelta * 0.1;
}

/**
 * Tính tọa độ trung tâm (centroid) của một nhóm công việc.
 */
function getCentroid(jobs: Job[]): { latitude: number; longitude: number } {
  const jobsWithCoords = jobs.filter(
    (j) => j.company?.latitude != null && j.company?.longitude != null
  );
  if (jobsWithCoords.length === 0) return { latitude: 0, longitude: 0 };

  const totalLat = jobsWithCoords.reduce(
    (sum, j) => sum + (j.company!.latitude as number),
    0
  );
  const totalLng = jobsWithCoords.reduce(
    (sum, j) => sum + (j.company!.longitude as number),
    0
  );

  return {
    latitude: totalLat / jobsWithCoords.length,
    longitude: totalLng / jobsWithCoords.length,
  };
}

// ─── Main Clustering Function ─────────────────────────────────────────────────

/**
 * Nhận vào danh sách công việc và vùng bản đồ hiện tại,
 * trả về danh sách các marker đã gom cụm (Cluster) hoặc marker đơn lẻ (Single).
 *
 * Thuật toán: Chia bản đồ thành lưới ô vuông vô hình, mỗi công việc
 * được xếp vào ô tương ứng dựa trên tọa độ. Các công việc cùng ô
 * được gom thành một Cluster.
 */
export function getClusters(jobs: Job[], region: MapRegion): MapMarker[] {
  const gridSize = getGridSize(region.latitudeDelta);
  const grid = new Map<string, Job[]>();

  for (const job of jobs) {
    const lat = job.company?.latitude;
    const lng = job.company?.longitude;

    // Bỏ qua công việc không có tọa độ
    if (lat == null || lng == null) continue;

    // Tính khóa ô lưới: làm tròn xuống tọa độ theo grid size
    const cellKey = `${Math.floor(lat / gridSize)}_${Math.floor(lng / gridSize)}`;

    if (!grid.has(cellKey)) {
      grid.set(cellKey, []);
    }
    grid.get(cellKey)!.push(job);
  }

  const markers: MapMarker[] = [];

  for (const [, groupedJobs] of grid) {
    if (groupedJobs.length === 1) {
      // Chỉ 1 công việc trong ô → Marker đơn lẻ
      const job = groupedJobs[0];
      markers.push({
        type: 'single',
        job,
        latitude: job.company!.latitude as number,
        longitude: job.company!.longitude as number,
      });
    } else {
      // Nhiều hơn 1 công việc → Gom thành Cluster
      const centroid = getCentroid(groupedJobs);
      markers.push({
        type: 'cluster',
        id: `cluster_${centroid.latitude}_${centroid.longitude}`,
        latitude: centroid.latitude,
        longitude: centroid.longitude,
        count: groupedJobs.length,
        jobs: groupedJobs,
      });
    }
  }

  return markers;
}

/**
 * Tính vùng bản đồ mới để zoom vào một cụm.
 * Bao gồm tất cả tọa độ của các công việc trong cụm và thêm viền đệm (padding).
 */
export function getRegionForCluster(cluster: ClusterMarker): MapRegion {
  const lats = cluster.jobs
    .map((j) => j.company?.latitude)
    .filter((v): v is number => v != null);
  const lngs = cluster.jobs
    .map((j) => j.company?.longitude)
    .filter((v): v is number => v != null);

  if (lats.length === 0) {
    return {
      latitude: cluster.latitude,
      longitude: cluster.longitude,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    };
  }

  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  const latDelta = (maxLat - minLat) * 1.6 + 0.01; // thêm 60% viền đệm
  const lngDelta = (maxLng - minLng) * 1.6 + 0.01;

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: latDelta,
    longitudeDelta: lngDelta,
  };
}

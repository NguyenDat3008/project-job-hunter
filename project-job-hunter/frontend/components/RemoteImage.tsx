// components/RemoteImage.tsx
// Hiển thị ảnh từ MinIO với cache support
// Dùng expo-image nếu có, fallback sang Image thông thường

import React, { useEffect, useState } from 'react';
import { Image, ActivityIndicator, ImageStyle, StyleProp, View } from 'react-native';
import apiClient from '@/lib/axiosInstance';

interface Props {
  fileName: string;
  style?: StyleProp<ImageStyle>;
  placeholder?: React.ReactNode;
}

export const RemoteImage = ({ fileName, style, placeholder }: Props) => {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!fileName) return;

    // Nếu fileName đã là URL đầy đủ, dùng trực tiếp
    if (fileName.startsWith('http://') || fileName.startsWith('https://')) {
      setUrl(fileName);
      return;
    }

    const fetchUrl = async () => {
      try {
        const response = await apiClient.get('/files', {
          params: { fileName },
        });
        const data = response.data?.data ?? response.data;
        if (typeof data === 'string') {
          setUrl(data);
        }
      } catch (err) {
        console.error('[RemoteImage] Error fetching file URL:', err);
        setError(true);
      }
    };
    fetchUrl();
  }, [fileName]);

  if (error) {
    return placeholder ? <>{placeholder}</> : null;
  }

  if (!url) {
    return (
      <View style={[{ justifyContent: 'center', alignItems: 'center' }, style as any]}>
        <ActivityIndicator size="small" />
      </View>
    );
  }

  return (
    <Image
      source={{ uri: url, cache: 'force-cache' }}
      style={style}
      resizeMode="cover"
      onError={() => setError(true)}
    />
  );
};

export default RemoteImage;

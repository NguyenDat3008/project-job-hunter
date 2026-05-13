// File Service for MinIO Uploads
import api from './api';
import { ENDPOINTS } from '@constants/endpoints';

class FileService {
  /**
   * Upload file to MinIO
   * @param file The file object (from ImagePicker or DocumentPicker)
   * @param folder Target folder (e.g., 'avatars', 'resumes', 'logos')
   */
  async uploadFile(file: any, folder: string = 'others'): Promise<string> {
    const formData = new FormData();
    
    // In React Native, the file object usually has { uri, name, type }
    formData.append('file', {
      uri: file.uri,
      name: file.name || 'upload_file',
      type: file.type || 'application/octet-stream',
    } as any);
    
    formData.append('folder', folder);

    const response = await api.post(ENDPOINTS.FILES.UPLOAD, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    // Backend returns the stored filename
    return response.data.data.fileName;
  }

  /**
   * Get direct URL for a file from MinIO
   */
  async getFileUrl(fileName: string): Promise<string> {
    const response = await api.get(ENDPOINTS.FILES.UPLOAD, {
      params: { fileName }
    });
    return response.data;
  }
}

export const fileService = new FileService();
export default fileService;

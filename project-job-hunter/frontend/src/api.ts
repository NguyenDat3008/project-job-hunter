import axios from 'axios';
import { Platform } from 'react-native';

const BASE_URL = Platform.OS === 'android' 
  ? 'http://10.0.2.2:8080/api/v1' 
  : 'http://localhost:8080/api/v1';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;

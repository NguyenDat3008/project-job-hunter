// services/premiumService.ts
// Kết nối với Spring Boot PremiumController
// Dùng api wrapper (axios-based, auto-attach token)

import api from './api';
import { PremiumPackage, Subscription } from '@/types/premium.types';

class PremiumService {
  async getPackages(): Promise<PremiumPackage[]> {
    try {
      const data = await api.get<PremiumPackage[]>('/premium/packages');
      if (Array.isArray(data)) return data;
      return [];
    } catch {
      // Fallback mock data nếu endpoint chưa tồn tại
      return [
        { id: 'pkg-basic', name: 'Gói Cơ Bản', tier: 'BASIC', price: 500000, features: [
          { name: 'Đăng 5 tin/tháng', included: true }, { name: 'Quản lý ứng viên cơ bản', included: true },
          { name: 'AI Matching (giới hạn)', included: true }, { name: 'Hỗ trợ 24/7', included: false },
          { name: 'Phân tích chuyên sâu', included: false }] },
        { id: 'pkg-pro', name: 'Gói Chuyên Nghiệp', tier: 'PRO', price: 2000000, isPopular: true, features: [
          { name: 'Đăng tin không giới hạn', included: true }, { name: 'Quản lý ứng viên nâng cao', included: true },
          { name: 'AI Matching không giới hạn', included: true }, { name: 'Hỗ trợ ưu tiên 24/7', included: true },
          { name: 'Phân tích chuyên sâu', included: false }] },
        { id: 'pkg-enterprise', name: 'Gói Doanh Nghiệp', tier: 'ENTERPRISE', price: 10000000, features: [
          { name: 'Tất cả tính năng Pro', included: true }, { name: 'Tư vấn tuyển dụng', included: true },
          { name: 'Tích hợp API', included: true }, { name: 'Nhiều tài khoản con', included: true },
          { name: 'Phân tích chuyên sâu', included: true }] },
      ];
    }
  }

  async subscribe(packageId: string): Promise<Subscription> {
    const tierMap: Record<string, string> = { 'pkg-basic': 'BASIC', 'pkg-pro': 'PRO', 'pkg-enterprise': 'ENTERPRISE' };
    const tier = tierMap[packageId] || packageId;
    return api.post<Subscription>(`/premium/subscribe/${tier}`);
  }
}

export const premiumService = new PremiumService();

export type Tier = 'BASIC' | 'PRO' | 'ENTERPRISE';

export interface PremiumFeature {
  name: string;
  included: boolean;
}

export interface PremiumPackage {
  id: string;
  name: string;
  tier: Tier;
  price: number;
  features: PremiumFeature[];
  isPopular?: boolean;
  description?: string;
}

export interface Subscription {
  id: string;
  userId: number;
  packageId: string;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  startDate: string;
  endDate: string;
}

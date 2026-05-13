// Premium package types

export type PremiumTier = 'BASIC' | 'PRO' | 'ENTERPRISE';

export interface PremiumPackage {
  id: string;
  name: string;
  tier: PremiumTier;
  price: number;
  currency: string;
  duration: number; // months
  features: PremiumFeature[];
  isPopular?: boolean;
  color: string;
  icon: string;
}

export interface PremiumFeature {
  name: string;
  included: boolean;
  description?: string;
}

export interface PremiumSubscription {
  id: string;
  companyId: number;
  packageId: string;
  tier: PremiumTier;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  startDate: string;
  endDate: string;
  autoRenew: boolean;
}

export interface PremiumBenefits {
  boostedJobs: number; // số lượng job được đẩy lên top
  highlightBadge: boolean;
  prioritySearch: boolean;
  aiMatching: boolean;
  unlimitedJobs: boolean;
  analyticsAccess: boolean;
  dedicatedSupport: boolean;
}

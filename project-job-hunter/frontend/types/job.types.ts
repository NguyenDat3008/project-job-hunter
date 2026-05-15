import { Role } from './index';

// ─── Job (matches backend Job entity) ────────────────────────────────────────

export type LevelEnum = 'INTERN' | 'FRESHER' | 'JUNIOR' | 'MIDDLE' | 'SENIOR' | 'LEAD' | 'MANAGER';

export interface Job {
  id: number;
  name: string;
  location: string;
  salary: number;
  quantity: number;
  level: LevelEnum;
  description: string;
  active: boolean;
  startDate?: string;
  endDate?: string;
  skills?: Skill[];
  company?: Company;
  isSaved?: boolean;
  isApplied?: boolean;
  matchScore?: number;
  latitude?: number;
  longitude?: number;
  createdAt?: string;
  updatedAt?: string;
}

// ─── Company (matches backend Company entity) ─────────────────────────────────

export interface Company {
  id: number;
  name: string;
  description?: string;
  address?: string;
  logo?: string;
  website?: string;
  industry?: string;
  size?: string;
  active: boolean;
  isPremium?: boolean;
  premiumTier?: string;
  premiumExpiryDate?: string;
  createdAt?: string;
  updatedAt?: string;
  pendingName?: string;
  pendingLogo?: string;
  updateReason?: string;
  latitude?: number;
  longitude?: number;
}

// ─── Skill ────────────────────────────────────────────────────────────────────

export interface Skill {
  id: number;
  name: string;
}

// ─── Resume / Application (matches backend Resume entity) ─────────────────────

export enum ResumeStatus {
  PENDING = 'PENDING',
  REVIEWING = 'REVIEWING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export interface Resume {
  id: number;
  email: string;
  url?: string;
  status: ResumeStatus;
  createdAt?: string;
  updatedAt?: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
  job?: {
    id: number;
    name: string;
    company?: {
      id: number;
      name: string;
    };
  };
  companyName?: string;
}

export interface ResumeState {
  resumes: Resume[];
  isLoading: boolean;
  error: string | null;
}

// Job types — mapped to Spring Boot entity

export interface Job {
  id: number;
  name: string; // Spring uses "name" not "title"
  description: string;
  location: string;
  salary: number;
  quantity: number;
  level: LevelEnum;
  skills: Skill[];
  company: Company;
  active: boolean;
  startDate: string;
  endDate?: string;
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;

  // Frontend-only enrichments (from mock/recommendation service)
  isPremium?: boolean;
  isUrgent?: boolean;
  isSaved?: boolean;
  isApplied?: boolean;
  matchScore?: number; // AI match percentage 0-100
  viewCount?: number;
  applicantCount?: number;
}

export type LevelEnum = 'INTERN' | 'FRESHER' | 'JUNIOR' | 'MIDDLE' | 'SENIOR';

export interface Skill {
  id: number;
  name: string;
}

export interface Company {
  id: number;
  name: string;
  description?: string;
  address?: string;
  logo?: string;
  website?: string;
  size?: string;
  industry?: string;
  isPremium?: boolean;
  premiumTier?: 'BASIC' | 'PRO' | 'ENTERPRISE';
  jobCount?: number;
  createdAt?: string;
}

export interface JobListRequest {
  page?: number;
  size?: number; // Spring uses "size" not "limit"
  search?: string;
  location?: string;
  level?: LevelEnum;
  salaryMin?: number;
  salaryMax?: number;
  companyId?: number;
  skillIds?: number[];
  sort?: string; // e.g. "salary,desc"
}

// Spring pagination response: ResultPaginationDTO
export interface JobListResponse {
  meta: PaginationMeta;
  result: Job[];
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  pages: number;
  total: number;
}

export interface SaveJobRequest {
  jobId: number;
}

export interface ApplyJobRequest {
  jobId: number;
  email: string;
  url: string; // CV file URL
  coverLetter?: string;
}

export type ResumeStatus = 'PENDING' | 'REVIEWING' | 'APPROVED' | 'REJECTED';

export interface Resume {
  id: number;
  email: string;
  url: string;
  status: ResumeStatus;
  companyName?: string;
  jobName?: string;
  user?: { id: number; name: string };
  job?: { id: number; name: string };
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
}
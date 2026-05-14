// Main index for Types & Interfaces
export * from './auth.types';
export * from './common.types';
export {
    CV,
    CVAnalytics,
    CVTemplate,
    CreateCVRequest,
    ExportCVRequest,
    ShareCVRequest,
    UpdateCVRequest,
    PersonalInfo,
    CVSection,
    SectionItem,
    CVListResponse
} from './cv.types';
export * from './job.types';
export * from './notification.types';
export * from './premium.types';

// Resume Status Enum matching Backend ResumeStateEnum
export enum ResumeState {
  PENDING = 'PENDING',
  REVIEWING = 'REVIEWING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export interface Resume {
  id?: number;
  email: string;
  url: string;
  status: ResumeState;
  user?: {
    id: number;
    email: string;
    name: string;
  };
  job?: {
    id: number;
    name: string;
    company?: {
      id: number;
      name: string;
    }
  };
  createdAt?: string;
  updatedAt?: string;
}

// Add any other shared interfaces here

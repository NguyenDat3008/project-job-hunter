import { Job } from './job.types';
import { User } from './index';

export type ResumeStatus = 'PENDING' | 'REVIEWING' | 'APPROVED' | 'REJECTED';

export interface Resume {
  id: number;
  email: string;
  url: string;
  status: ResumeStatus;
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
  user: {
    id: number;
    name: string;
  };
  job: {
    id: number;
    name: string;
  };
}

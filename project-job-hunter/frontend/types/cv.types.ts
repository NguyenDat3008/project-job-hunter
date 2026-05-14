// CV types
export interface CV {
  id: string;
  userId: string;
  title: string;
  template: string;
  color: string;
  personalInfo: PersonalInfo;
  sections: CVSection[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PersonalInfo {
  fullName: string;
  email: string;
  phone: string;
  address?: string;
  profilePhoto?: string;
  summary?: string;
}

export interface CVSection {
  id: string;
  type: 'EXPERIENCE' | 'EDUCATION' | 'SKILL' | 'CERTIFICATION' | 'PROJECT' | 'LANGUAGE';
  title: string;
  items: SectionItem[];
  order: number;
}

export interface SectionItem {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  company?: string;
  degree?: string;
  school?: string;
  skills?: string[];
  level?: string;
  imageUrl?: string;
  order: number;
}

export interface CVTemplate {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  colors: string[];
}

export interface CreateCVRequest {
  title: string;
  template: string;
  color: string;
  personalInfo: PersonalInfo;
  sections?: CVSection[];
}

export interface UpdateCVRequest {
  title?: string;
  template?: string;
  color?: string;
  personalInfo?: PersonalInfo;
  sections?: CVSection[];
}

export interface CVListResponse {
  data: CV[];
  total: number;
}

export interface ExportCVRequest {
  cvId: string;
  format: 'PDF' | 'DOCX';
}

export interface ShareCVRequest {
  cvId: string;
  email: string[];
}

export interface CVAnalytics {
  cvId: string;
  viewCount: number;
  shareCount: number;
  downloadCount: number;
  ratings: number[];
}
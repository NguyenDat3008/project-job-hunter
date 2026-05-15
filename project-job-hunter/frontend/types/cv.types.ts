export interface SectionItem {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  order: number;
}

export interface CVSection {
  id: string;
  type: 'EXPERIENCE' | 'EDUCATION' | 'SKILL' | 'CERTIFICATION' | 'PROJECT' | 'LANGUAGE';
  title: string;
  items: SectionItem[];
  order: number;
}

export interface CVTemplate {
  id: string;
  name: string;
  description: string;
  previewImage?: string;
  colors: string[];
}

export interface CV {
  id: string;
  userId: number;
  title: string;
  templateId: string;
  color: string;
  fullName: string;
  email: string;
  phone?: string;
  address?: string;
  summary?: string;
  avatar?: string;
  sections: CVSection[];
  createdAt: string;
  updatedAt: string;
}

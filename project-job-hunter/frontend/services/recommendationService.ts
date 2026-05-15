// services/recommendationService.ts
// Kết nối với Spring Boot JobController — AI Job Recommendation
// Endpoint: GET /api/v1/jobs/recommend
// Dùng api wrapper (axios-based, auto-attach token)

import api from './api';
import { ENDPOINTS } from '@constants/endpoints';
import { Job } from '../types/job.types';

export interface MatchResult {
  job: Job;
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  reasons: string[];
}

class RecommendationService {
  /**
   * GET /api/v1/jobs/recommend
   * AI gợi ý job theo skill của user — Cần Token
   * Backend trả về: [{ job, matchScore, matchedSkills, missingSkills, reasons }]
   */
  async getRecommendedJobs(): Promise<MatchResult[]> {
    try {
      const data = await api.get<MatchResult[] | { result: MatchResult[] }>(
        ENDPOINTS.RECOMMENDATIONS.LIST
      );
      // Backend có thể trả array hoặc PaginationResponse
      if (Array.isArray(data)) return data as MatchResult[];
      return (data as any)?.result || [];
    } catch (error) {
      console.error('[RecommendationService] getRecommendedJobs error:', error);
      return [];
    }
  }

  /**
   * GET /api/v1/jobs/recommend (lọc theo jobId cụ thể)
   * Hoặc tính toán match score cho 1 job
   */
  async getMatchScore(jobId: number): Promise<{
    matchScore: number;
    matchedSkills: string[];
    missingSkills: string[];
  } | null> {
    try {
      // Lấy tất cả recommendations rồi filter theo jobId
      const results = await this.getRecommendedJobs();
      const match = results.find((r) => r.job.id === jobId);
      if (match) {
        return {
          matchScore: match.matchScore,
          matchedSkills: match.matchedSkills,
          missingSkills: match.missingSkills,
        };
      }
      return null;
    } catch {
      return null;
    }
  }
}

export const recommendationService = new RecommendationService();

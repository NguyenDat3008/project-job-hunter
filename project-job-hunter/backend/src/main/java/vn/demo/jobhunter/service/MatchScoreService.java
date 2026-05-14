package vn.demo.jobhunter.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import vn.demo.jobhunter.domain.Job;
import vn.demo.jobhunter.domain.Skill;
import vn.demo.jobhunter.domain.Subscriber;
import vn.demo.jobhunter.domain.User;

/**
 * MatchScoreService — AI-powered Job Matching
 * =============================================
 * Gọi Python FastAPI AI service để tính điểm phù hợp giữa ứng viên và job.
 * 
 * AI Service sử dụng Sentence-BERT (paraphrase-multilingual-MiniLM-L12-v2)
 * để tính semantic similarity — bắt được các trường hợp "ReactJS ≈ React",
 * "JS ≈ JavaScript" mà rule-based thông thường không làm được.
 * 
 * Nếu AI service không khả dụng → fallback về thuật toán rule-based cũ
 * để đảm bảo hệ thống không bị gián đoạn.
 */
@Service
public class MatchScoreService {

    private final SubscriberService subscriberService;
    private final RestTemplate restTemplate;
    private final String aiServiceUrl;

    public MatchScoreService(
            SubscriberService subscriberService,
            @Value("${demo.ai-service.url:http://localhost:8000}") String aiServiceUrl,
            @Value("${demo.ai-service.connect-timeout:3000}") int connectTimeout,
            @Value("${demo.ai-service.read-timeout:10000}") int readTimeout) {
        this.subscriberService = subscriberService;
        this.aiServiceUrl = aiServiceUrl;
        // Cấu hình timeout — AI inference có thể chậm hơn API thông thường
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(connectTimeout);
        factory.setReadTimeout(readTimeout);
        this.restTemplate = new RestTemplate(factory);
    }

    /**
     * Tính điểm phù hợp giữa user và job.
     * Ưu tiên AI service. Fallback về rule-based nếu AI service không available.
     *
     * @return Map gồm: job, matchScore, matchedSkills, missingSkills, reasons,
     *         skillScore, semanticScore, locationScore, aiPowered
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> calculateMatchScore(User user, Job job) {
        // Chuẩn bị dữ liệu user skills từ Subscriber
        Subscriber subscriber = user.getEmail() != null
                ? subscriberService.findByEmail(user.getEmail())
                : null;
        List<String> userSkills = (subscriber != null && subscriber.getSkills() != null)
                ? subscriber.getSkills().stream().map(Skill::getName).collect(Collectors.toList())
                : new ArrayList<>();

        List<String> jobSkills = (job.getSkills() != null)
                ? job.getSkills().stream().map(Skill::getName).collect(Collectors.toList())
                : new ArrayList<>();

        try {
            // ── Gọi AI Service ──────────────────────────────────────────────
            Map<String, Object> requestBody = buildAiRequest(user, userSkills, job, jobSkills);
            ResponseEntity<Map<String, Object>> response = restTemplate.postForEntity(
                    aiServiceUrl + "/api/match-score",
                    requestBody,
                    (Class<Map<String, Object>>) (Class<?>) Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return buildResultFromAiResponse(job, response.getBody());
            }

        } catch (ResourceAccessException e) {
            // AI service không khởi động / timeout → fallback
            System.err.println(">>> [AI Service] Not available, falling back to rule-based: " + e.getMessage());
        } catch (Exception e) {
            System.err.println(">>> [AI Service] Error: " + e.getMessage() + " — using fallback");
        }

        // ── Fallback: Rule-based (khi AI service down) ──────────────────────
        return calculateFallbackScore(user, job, userSkills, jobSkills);
    }

    // ─── Private Helpers ────────────────────────────────────────────────────

    /**
     * Build request body để gửi sang Python AI service.
     */
    private Map<String, Object> buildAiRequest(User user, List<String> userSkills,
                                                Job job, List<String> jobSkills) {
        Map<String, Object> body = new HashMap<>();
        body.put("user_skills", userSkills);
        body.put("user_address", user.getAddress() != null ? user.getAddress() : "");

        body.put("job_id", job.getId());
        body.put("job_name", job.getName());
        body.put("job_description", job.getDescription() != null ? job.getDescription() : "");
        body.put("job_skills", jobSkills);
        body.put("job_location", job.getLocation() != null ? job.getLocation() : "");
        body.put("job_level", job.getLevel() != null ? job.getLevel().toString() : "");
        body.put("company_name", (job.getCompany() != null) ? job.getCompany().getName() : "");
        body.put("company_is_premium", Boolean.TRUE.equals(job.getIsPremium()));

        return body;
    }

    /**
     * Map response từ AI service sang format chuẩn trả về cho JobController.
     */
    @SuppressWarnings("unchecked")
    private Map<String, Object> buildResultFromAiResponse(Job job, Map<String, Object> aiResponse) {
        Map<String, Object> result = new HashMap<>();
        result.put("job", job);
        result.put("matchScore", aiResponse.getOrDefault("match_score", 0));
        result.put("skillScore", aiResponse.getOrDefault("skill_score", 0.0));
        result.put("semanticScore", aiResponse.getOrDefault("semantic_score", 0.0));
        result.put("locationScore", aiResponse.getOrDefault("location_score", 0.0));
        result.put("matchedSkills", aiResponse.getOrDefault("matched_skills", new ArrayList<>()));
        result.put("missingSkills", aiResponse.getOrDefault("missing_skills", new ArrayList<>()));
        result.put("reasons", aiResponse.getOrDefault("reasons", new ArrayList<>()));
        result.put("processingTimeMs", aiResponse.getOrDefault("processing_time_ms", 0.0));
        result.put("aiPowered", true); // flag để frontend/báo cáo biết đây là AI result
        return result;
    }

    /**
     * Fallback rule-based khi AI service không available.
     * Giữ nguyên logic cũ để đảm bảo hệ thống không bị gián đoạn.
     */
    private Map<String, Object> calculateFallbackScore(User user, Job job,
                                                        List<String> userSkills,
                                                        List<String> jobSkills) {
        Map<String, Object> result = new HashMap<>();

        List<String> userSkillsLower = userSkills.stream()
                .map(String::toLowerCase).collect(Collectors.toList());
        List<String> jobSkillsLower = jobSkills.stream()
                .map(String::toLowerCase).collect(Collectors.toList());

        List<String> matchedSkills = new ArrayList<>();
        List<String> missingSkills = new ArrayList<>();

        for (int i = 0; i < jobSkillsLower.size(); i++) {
            if (userSkillsLower.contains(jobSkillsLower.get(i))) {
                matchedSkills.add(jobSkills.get(i));
            } else {
                missingSkills.add(jobSkills.get(i));
            }
        }

        int score = 50; // default nếu job không yêu cầu skill cụ thể
        if (!jobSkills.isEmpty()) {
            score = (int) Math.round(((double) matchedSkills.size() / jobSkills.size()) * 100);
        }

        // Bonus location
        if (user.getAddress() != null && job.getLocation() != null) {
            if (user.getAddress().toLowerCase().contains(job.getLocation().toLowerCase())
                    || job.getLocation().toLowerCase().contains(user.getAddress().toLowerCase())) {
                score = Math.min(100, score + 10);
            }
        }

        List<String> reasons = new ArrayList<>();
        if (score >= 80) reasons.add("Kỹ năng rất phù hợp");
        else if (score >= 60) reasons.add("Kỹ năng khá phù hợp");
        if (Boolean.TRUE.equals(job.getIsPremium())) reasons.add("Công ty uy tín");
        reasons.add("⚠️ AI service tạm không khả dụng — kết quả ước tính");

        result.put("job", job);
        result.put("matchScore", score);
        result.put("matchedSkills", matchedSkills);
        result.put("missingSkills", missingSkills);
        result.put("reasons", reasons);
        result.put("aiPowered", false); // fallback mode
        return result;
    }
}

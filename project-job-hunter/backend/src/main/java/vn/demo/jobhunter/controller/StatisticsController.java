package vn.demo.jobhunter.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.demo.jobhunter.repository.CompanyRepository;
import vn.demo.jobhunter.repository.JobRepository;
import vn.demo.jobhunter.repository.ResumeRepository;
import vn.demo.jobhunter.repository.UserRepository;

import java.util.HashMap;
import java.util.Map;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

/**
 * @controller StatisticsController
 * @description API Thống kê hệ thống - Chỉ SUPER_ADMIN
 */
@RestController
@RequestMapping("/api/v1/statistics")
@Tag(name = "Statistics", description = "API Thống kê hệ thống (chỉ SUPER_ADMIN)")
public class StatisticsController {
    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;
    private final JobRepository jobRepository;
    private final ResumeRepository resumeRepository;

    public StatisticsController(UserRepository userRepository, CompanyRepository companyRepository,
            JobRepository jobRepository, ResumeRepository resumeRepository) {
        this.userRepository = userRepository;
        this.companyRepository = companyRepository;
        this.jobRepository = jobRepository;
        this.resumeRepository = resumeRepository;
    }

    @GetMapping("/admin")
    @Operation(summary = "Thống kê tổng quan", description = "Lấy số liệu tổng quan: tổng user, công ty, việc làm, hồ sơ")
    public ResponseEntity<Map<String, Long>> getAdminStats() {
        Map<String, Long> stats = new HashMap<>();
        stats.put("totalUsers", this.userRepository.count());
        stats.put("totalCompanies", this.companyRepository.count());
        stats.put("totalJobs", this.jobRepository.count());
        stats.put("totalResumes", this.resumeRepository.count());
        
        // Bổ sung số liệu chờ duyệt
        stats.put("pendingCompanies", this.companyRepository.countByActive(false));
        stats.put("inactiveJobs", this.jobRepository.countByActive(false));
        
        return ResponseEntity.ok(stats);
    }
}

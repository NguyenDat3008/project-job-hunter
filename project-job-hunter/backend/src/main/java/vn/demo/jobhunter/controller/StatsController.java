package vn.demo.jobhunter.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import vn.demo.jobhunter.repository.JobRepository;
import vn.demo.jobhunter.repository.ResumeRepository;
import vn.demo.jobhunter.repository.UserRepository;
import vn.demo.jobhunter.util.annotation.ApiMessage;

@RestController
@RequestMapping("/api/v1/stats")
public class StatsController {

    private final JobRepository jobRepository;
    private final ResumeRepository resumeRepository;
    private final UserRepository userRepository;

    public StatsController(JobRepository jobRepository, ResumeRepository resumeRepository,
            UserRepository userRepository) {
        this.jobRepository = jobRepository;
        this.resumeRepository = resumeRepository;
        this.userRepository = userRepository;
    }

    @GetMapping("/user")
    @ApiMessage("Get user stats")
    public ResponseEntity<UserStats> getUserStats(@RequestParam long id) {
        long totalResumes = this.resumeRepository.countByUserId(id);
        return ResponseEntity.ok(new UserStats(totalResumes));
    }

    @GetMapping("/company")
    @ApiMessage("Get company stats")
    public ResponseEntity<CompanyStats> getCompanyStats(@RequestParam long id) {
        long totalJobs = this.jobRepository.countByCompanyId(id);
        long totalEmployees = this.userRepository.countByCompanyId(id);
        return ResponseEntity.ok(new CompanyStats(totalJobs, totalEmployees));
    }

    public static class UserStats {
        private long totalResumes;

        public UserStats(long totalResumes) {
            this.totalResumes = totalResumes;
        }

        public long getTotalResumes() {
            return totalResumes;
        }
    }

    public static class CompanyStats {
        private long totalJobs;
        private long totalEmployees;

        public CompanyStats(long totalJobs, long totalEmployees) {
            this.totalJobs = totalJobs;
            this.totalEmployees = totalEmployees;
        }

        public long getTotalJobs() {
            return totalJobs;
        }

        public long getTotalEmployees() {
            return totalEmployees;
        }
    }
}

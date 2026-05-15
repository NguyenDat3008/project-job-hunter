package vn.demo.jobhunter.controller;

import java.util.Optional;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.turkraft.springfilter.boot.Filter;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import vn.demo.jobhunter.domain.Job;
import vn.demo.jobhunter.domain.response.ResultPaginationDTO;
import vn.demo.jobhunter.domain.response.job.ResCreateJobDTO;
import vn.demo.jobhunter.domain.response.job.ResUpdateJobDTO;
import vn.demo.jobhunter.service.JobService;
import vn.demo.jobhunter.util.annotation.ApiMessage;
import vn.demo.jobhunter.util.error.IdInvalidException;

/**
 * @controller JobController
 * @description API Quản lý Việc làm - CRUD Job, gợi ý AI, lưu Job yêu thích
 */
@RestController
@RequestMapping("/api/v1")
@Tag(name = "Job", description = "API Quản lý Việc làm")
public class JobController {

    private final vn.demo.jobhunter.service.JobService jobService;
    private final vn.demo.jobhunter.service.UserService userService;
    private final vn.demo.jobhunter.service.MatchScoreService matchScoreService;
    private final vn.demo.jobhunter.repository.SavedJobRepository savedJobRepository;

    public JobController(vn.demo.jobhunter.service.JobService jobService,
            vn.demo.jobhunter.service.UserService userService,
            vn.demo.jobhunter.service.MatchScoreService matchScoreService,
            vn.demo.jobhunter.repository.SavedJobRepository savedJobRepository) {
        this.jobService = jobService;
        this.userService = userService;
        this.matchScoreService = matchScoreService;
        this.savedJobRepository = savedJobRepository;
    }

    @PostMapping("/jobs")
    @ApiMessage("Create a job")
    @Operation(summary = "Tạo mới việc làm", description = "Tạo tin tuyển dụng mới (HR/COMPANY_REP tự gán company, SUPER_ADMIN tự chọn)")
    public ResponseEntity<ResCreateJobDTO> create(@Valid @RequestBody Job job) throws vn.demo.jobhunter.util.error.PermissionException {
        String email = vn.demo.jobhunter.util.SecurityUtil.getCurrentUserLogin().orElse("");
        vn.demo.jobhunter.domain.User currentUser = this.userService.handleGetUserByUsername(email);
        
        if (currentUser != null && currentUser.getRole() != null) {
            if (!currentUser.getRole().getName().equals("SUPER_ADMIN")) {
                if (currentUser.getCompany() == null) {
                    throw new vn.demo.jobhunter.util.error.PermissionException("Bạn không thuộc công ty nào để tạo Job.");
                }
                job.setCompany(currentUser.getCompany());
            }
        }

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(this.jobService.create(job));
    }

    @PutMapping("/jobs")
    @ApiMessage("Update a job")
    @Operation(summary = "Cập nhật việc làm", description = "Sửa thông tin tin tuyển dụng (chỉ được sửa Job của công ty mình)")
    public ResponseEntity<ResUpdateJobDTO> update(@Valid @RequestBody Job job) throws IdInvalidException, vn.demo.jobhunter.util.error.PermissionException {
        Optional<Job> currentJobOpt = this.jobService.fetchJobById(job.getId());
        if (!currentJobOpt.isPresent()) {
            throw new IdInvalidException("Job not found");
        }
        Job currentJob = currentJobOpt.get();

        String email = vn.demo.jobhunter.util.SecurityUtil.getCurrentUserLogin().orElse("");
        vn.demo.jobhunter.domain.User currentUser = this.userService.handleGetUserByUsername(email);
        
        if (currentUser != null && currentUser.getRole() != null) {
            if (!currentUser.getRole().getName().equals("SUPER_ADMIN")) {
                if (currentUser.getCompany() == null || currentJob.getCompany() == null || currentUser.getCompany().getId() != currentJob.getCompany().getId()) {
                    throw new vn.demo.jobhunter.util.error.PermissionException("Bạn không có quyền cập nhật Job của công ty khác.");
                }
                job.setCompany(currentUser.getCompany());
            }
        }

        return ResponseEntity.ok()
                .body(this.jobService.update(job, currentJob));
    }

    @DeleteMapping("/jobs/{id}")
    @ApiMessage("Delete a job by id")
    @Operation(summary = "Xóa việc làm", description = "Xóa tin tuyển dụng theo ID (chỉ được xóa Job của công ty mình)")
    public ResponseEntity<Void> delete(@PathVariable("id") long id) throws IdInvalidException, vn.demo.jobhunter.util.error.PermissionException {
        Optional<Job> currentJobOpt = this.jobService.fetchJobById(id);
        if (!currentJobOpt.isPresent()) {
            throw new IdInvalidException("Job not found");
        }
        Job currentJob = currentJobOpt.get();

        String email = vn.demo.jobhunter.util.SecurityUtil.getCurrentUserLogin().orElse("");
        vn.demo.jobhunter.domain.User currentUser = this.userService.handleGetUserByUsername(email);
        
        if (currentUser != null && currentUser.getRole() != null) {
            if (!currentUser.getRole().getName().equals("SUPER_ADMIN")) {
                if (currentUser.getCompany() == null || currentJob.getCompany() == null || currentUser.getCompany().getId() != currentJob.getCompany().getId()) {
                    throw new vn.demo.jobhunter.util.error.PermissionException("Bạn không có quyền xóa Job của công ty khác.");
                }
            }
        }

        this.jobService.delete(id);
        return ResponseEntity.ok().body(null);
    }

    @GetMapping("/jobs/nearby")
    @ApiMessage("Get jobs near a location")
    @Operation(summary = "Tìm việc làm quanh đây", description = "Lấy danh sách Job trong bán kính (radius) tính từ tọa độ (lat, lng)")
    public ResponseEntity<java.util.List<Job>> getJobsNearby(
            @org.springframework.web.bind.annotation.RequestParam("lat") double lat,
            @org.springframework.web.bind.annotation.RequestParam("lng") double lng,
            @org.springframework.web.bind.annotation.RequestParam(value = "radius", defaultValue = "10") double radius) {
        return ResponseEntity.ok().body(this.jobService.findJobsNearby(lat, lng, radius));
    }

    @GetMapping("/jobs/{id}")
    @ApiMessage("Get a job by id")
    @Operation(summary = "Lấy chi tiết việc làm", description = "Xem thông tin chi tiết của một tin tuyển dụng (công khai)")
    public ResponseEntity<vn.demo.jobhunter.domain.response.job.ResFetchJobDTO> getJob(@PathVariable("id") long id) throws IdInvalidException {
        Optional<Job> currentJob = this.jobService.fetchJobById(id);
        if (!currentJob.isPresent()) {
            throw new IdInvalidException("Job not found");
        }

        return ResponseEntity.ok().body(this.jobService.convertToResFetchJobDTO(currentJob.get()));
    }

    @GetMapping("/jobs")
    @ApiMessage("Get job with pagination")
    @Operation(summary = "Danh sách việc làm", description = "Lấy danh sách tin tuyển dụng với phân trang và bộ lọc (công khai)")
    public ResponseEntity<ResultPaginationDTO> getAllJob(
            @Filter Specification<Job> spec,
            Pageable pageable) {

        return ResponseEntity.ok().body(this.jobService.fetchAll(spec, pageable));
    }

    @GetMapping("/jobs/recommend")
    @ApiMessage("Get AI recommended jobs for current user")
    @Operation(summary = "Gợi ý việc làm (AI)", description = "Trả về danh sách Job phù hợp dựa trên kỹ năng của người dùng")
    public ResponseEntity<java.util.List<java.util.Map<String, Object>>> getRecommendedJobs() {
        String email = vn.demo.jobhunter.util.SecurityUtil.getCurrentUserLogin().orElse("");
        vn.demo.jobhunter.domain.User currentUser = this.userService.handleGetUserByUsername(email);

        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        // Fetch all active jobs with a reasonable limit to avoid memory issues
        // In real app, we should fetch jobs matching certain criteria first
        java.util.List<Job> allJobs = this.jobService.fetchActiveJobs(100);

        java.util.List<java.util.Map<String, Object>> recommendations = new java.util.ArrayList<>();
        for (Job job : allJobs) {
            if (job.isActive()) {
                java.util.Map<String, Object> matchResult = this.matchScoreService.calculateMatchScore(currentUser,
                        job);
                int score = (int) matchResult.get("matchScore");
                if (score > 30) { // arbitrary threshold
                    recommendations.add(matchResult);
                }
            }
        }

        // Sort by match score descending
        recommendations.sort((m1, m2) -> Integer.compare((int) m2.get("matchScore"), (int) m1.get("matchScore")));

        return ResponseEntity.ok().body(recommendations);
    }

    @PostMapping("/jobs/{id}/save")
    @ApiMessage("Toggle save job for current user")
    @Operation(summary = "Lưu/Bỏ lưu việc làm", description = "Toggle lưu hoặc bỏ lưu tin tuyển dụng yêu thích")
    public ResponseEntity<String> toggleSaveJob(@PathVariable("id") long id) throws IdInvalidException {
        String email = vn.demo.jobhunter.util.SecurityUtil.getCurrentUserLogin().orElse("");
        vn.demo.jobhunter.domain.User currentUser = this.userService.handleGetUserByUsername(email);

        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Optional<Job> currentJob = this.jobService.fetchJobById(id);
        if (!currentJob.isPresent()) {
            throw new IdInvalidException("Job not found");
        }

        Job job = currentJob.get();
        boolean exists = this.savedJobRepository.existsByUserAndJob(currentUser, job);

        if (exists) {
            vn.demo.jobhunter.domain.SavedJob savedJob = this.savedJobRepository.findByUserAndJob(currentUser, job);
            this.savedJobRepository.delete(savedJob);
            return ResponseEntity.ok().body("Job unsaved successfully");
        } else {
            vn.demo.jobhunter.domain.SavedJob savedJob = new vn.demo.jobhunter.domain.SavedJob();
            savedJob.setUser(currentUser);
            savedJob.setJob(job);
            this.savedJobRepository.save(savedJob);
            return ResponseEntity.ok().body("Job saved successfully");
        }
    }
}

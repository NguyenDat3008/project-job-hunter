package vn.demo.jobhunter.controller;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import vn.demo.jobhunter.domain.Job;
import vn.demo.jobhunter.domain.SavedJob;
import vn.demo.jobhunter.domain.User;
import vn.demo.jobhunter.repository.SavedJobRepository;
import vn.demo.jobhunter.service.JobService;
import vn.demo.jobhunter.service.UserService;
import vn.demo.jobhunter.domain.response.job.ResFetchJobDTO;
import vn.demo.jobhunter.util.SecurityUtil;
import vn.demo.jobhunter.util.annotation.ApiMessage;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

/**
 * @controller SavedJobController
 * @description API Việc làm đã lưu - Xem danh sách Job yêu thích của người dùng
 */
@RestController
@RequestMapping("/api/v1")
@Tag(name = "Saved Job", description = "API Việc làm đã lưu")
public class SavedJobController {
    
    private final SavedJobRepository savedJobRepository;
    private final UserService userService;
    private final JobService jobService;

    public SavedJobController(SavedJobRepository savedJobRepository, 
                            UserService userService,
                            JobService jobService) {
        this.savedJobRepository = savedJobRepository;
        this.userService = userService;
        this.jobService = jobService;
    }

    @GetMapping("/jobs/saved")
    @ApiMessage("Get saved jobs for current user")
    @Operation(summary = "Xem việc làm đã lưu", description = "Lấy danh sách tất cả Job mà người dùng đã lưu")
    public ResponseEntity<List<ResFetchJobDTO>> getSavedJobs() {
        String email = SecurityUtil.getCurrentUserLogin().orElse("");
        User currentUser = this.userService.handleGetUserByUsername(email);
        
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
    
        List<SavedJob> savedJobs = this.savedJobRepository.findByUser(currentUser);
        List<ResFetchJobDTO> jobs = savedJobs.stream()
                .map(SavedJob::getJob)
                .map(this.jobService::convertToResFetchJobDTO)
                .collect(Collectors.toList());
    
        return ResponseEntity.ok(jobs);
    }
}

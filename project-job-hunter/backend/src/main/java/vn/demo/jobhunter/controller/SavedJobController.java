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
import vn.demo.jobhunter.service.UserService;
import vn.demo.jobhunter.util.SecurityUtil;
import vn.demo.jobhunter.util.annotation.ApiMessage;

@RestController
@RequestMapping("/api/v1")
public class SavedJobController {
    
    private final SavedJobRepository savedJobRepository;
    private final UserService userService;

    public SavedJobController(SavedJobRepository savedJobRepository, UserService userService) {
        this.savedJobRepository = savedJobRepository;
        this.userService = userService;
    }

    @GetMapping("/jobs/saved")
    @ApiMessage("Get saved jobs for current user")
    public ResponseEntity<List<Job>> getSavedJobs() {
        String email = SecurityUtil.getCurrentUserLogin().orElse("");
        User currentUser = this.userService.handleGetUserByUsername(email);
        
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        List<SavedJob> savedJobs = this.savedJobRepository.findByUser(currentUser);
        List<Job> jobs = savedJobs.stream()
                .map(SavedJob::getJob)
                .map(job -> {
                    job.setIsPremium(job.getIsPremium() == null ? false : job.getIsPremium());
                    return job;
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(jobs);
    }
}

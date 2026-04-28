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
import jakarta.validation.Valid;
import vn.demo.jobhunter.domain.Job;
import vn.demo.jobhunter.domain.response.ResultPaginationDTO;
import vn.demo.jobhunter.domain.response.job.ResCreateJobDTO;
import vn.demo.jobhunter.domain.response.job.ResUpdateJobDTO;
import vn.demo.jobhunter.service.JobService;
import vn.demo.jobhunter.util.annotation.ApiMessage;
import vn.demo.jobhunter.util.error.IdInvalidException;

@RestController
@RequestMapping("/api/v1")
public class JobController {

    private final JobService jobService;
    private final vn.demo.jobhunter.service.UserService userService;
    private final vn.demo.jobhunter.service.MatchScoreService matchScoreService;
    private final vn.demo.jobhunter.repository.SavedJobRepository savedJobRepository;

    public JobController(JobService jobService,
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
    public ResponseEntity<ResCreateJobDTO> create(@Valid @RequestBody Job job) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(this.jobService.create(job));
    }

    @PutMapping("/jobs")
    @ApiMessage("Update a job")
    public ResponseEntity<ResUpdateJobDTO> update(@Valid @RequestBody Job job) throws IdInvalidException {
        Optional<Job> currentJob = this.jobService.fetchJobById(job.getId());
        if (!currentJob.isPresent()) {
            throw new IdInvalidException("Job not found");
        }

        return ResponseEntity.ok()
                .body(this.jobService.update(job, currentJob.get()));
    }

    @DeleteMapping("/jobs/{id}")
    @ApiMessage("Delete a job by id")
    public ResponseEntity<Void> delete(@PathVariable("id") long id) throws IdInvalidException {
        Optional<Job> currentJob = this.jobService.fetchJobById(id);
        if (!currentJob.isPresent()) {
            throw new IdInvalidException("Job not found");
        }
        this.jobService.delete(id);
        return ResponseEntity.ok().body(null);
    }

    @GetMapping("/jobs/{id}")
    @ApiMessage("Get a job by id")
    public ResponseEntity<Job> getJob(@PathVariable("id") long id) throws IdInvalidException {
        Optional<Job> currentJob = this.jobService.fetchJobById(id);
        if (!currentJob.isPresent()) {
            throw new IdInvalidException("Job not found");
        }

        return ResponseEntity.ok().body(currentJob.get());
    }

    @GetMapping("/jobs")
    @ApiMessage("Get job with pagination")
    public ResponseEntity<ResultPaginationDTO> getAllJob(
            @Filter Specification<Job> spec,
            Pageable pageable) {

        return ResponseEntity.ok().body(this.jobService.fetchAll(spec, pageable));
    }

    @GetMapping("/jobs/recommend")
    @ApiMessage("Get AI recommended jobs for current user")
    public ResponseEntity<java.util.List<java.util.Map<String, Object>>> getRecommendedJobs() {
        String email = vn.demo.jobhunter.util.SecurityUtil.getCurrentUserLogin().orElse("");
        vn.demo.jobhunter.domain.User currentUser = this.userService.handleGetUserByUsername(email);

        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        // Fetch all active jobs for simplicity, then calculate score
        // In real app, we should fetch jobs matching certain criteria first
        ResultPaginationDTO allJobsDTO = this.jobService.fetchAll(null, Pageable.unpaged());
        @SuppressWarnings("unchecked")
        java.util.List<Job> allJobs = (java.util.List<Job>) allJobsDTO.getResult();

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

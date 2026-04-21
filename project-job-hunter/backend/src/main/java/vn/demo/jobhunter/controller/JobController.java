package vn.demo.jobhunter.controller;

import java.util.List;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import vn.demo.jobhunter.domain.Job;
import vn.demo.jobhunter.domain.response.job.ResCreateJobDTO;
import vn.demo.jobhunter.domain.response.job.ResUpdateJobDTO;
import vn.demo.jobhunter.service.JobService;

@RestController
@RequestMapping("/api/v1")
@CrossOrigin(origins = "*")
@Tag(name = "Job", description = "API Quản lý Công việc")
public class JobController {

    private final JobService jobService;

    public JobController(JobService jobService) {
        this.jobService = jobService;
    }

    // CREATE → trả về ResCreateJobDTO (DTO)
    @PostMapping("/jobs")
    @Operation(summary = "Tạo mới công việc")
    public ResponseEntity<ResCreateJobDTO> create(@Valid @RequestBody Job job) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(this.jobService.create(job));
    }

    // READ ALL
    @GetMapping("/jobs")
    @Operation(summary = "Lấy danh sách việc làm")
    public ResponseEntity<List<Job>> getAllJobs() {
        return ResponseEntity.ok(this.jobService.fetchAll());
    }

    // READ ONE
    @GetMapping("/jobs/{id}")
    @Operation(summary = "Lấy việc làm theo ID")
    public ResponseEntity<Job> getJob(@PathVariable("id") long id) {
        Optional<Job> currentJob = this.jobService.fetchJobById(id);
        if (currentJob.isPresent()) {
            return ResponseEntity.ok(currentJob.get());
        }
        return ResponseEntity.notFound().build();
    }

    // UPDATE → trả về ResUpdateJobDTO (DTO)
    @PutMapping("/jobs")
    @Operation(summary = "Cập nhật việc làm")
    public ResponseEntity<ResUpdateJobDTO> update(@Valid @RequestBody Job job) {
        Optional<Job> currentJob = this.jobService.fetchJobById(job.getId());
        if (!currentJob.isPresent()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(this.jobService.update(job, currentJob.get()));
    }

    // DELETE
    @DeleteMapping("/jobs/{id}")
    @Operation(summary = "Xoá việc làm theo ID")
    public ResponseEntity<Void> delete(@PathVariable("id") long id) {
        Optional<Job> currentJob = this.jobService.fetchJobById(id);
        if (!currentJob.isPresent()) {
            return ResponseEntity.notFound().build();
        }
        this.jobService.delete(id);
        return ResponseEntity.ok(null);
    }
}

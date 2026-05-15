package vn.demo.jobhunter.service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import com.turkraft.springfilter.builder.FilterBuilder;
import com.turkraft.springfilter.converter.FilterSpecification;
import com.turkraft.springfilter.converter.FilterSpecificationConverter;
import com.turkraft.springfilter.parser.FilterParser;
import com.turkraft.springfilter.parser.node.FilterNode;

import vn.demo.jobhunter.domain.Job;
import vn.demo.jobhunter.domain.Resume;
import vn.demo.jobhunter.domain.User;
import vn.demo.jobhunter.domain.response.ResultPaginationDTO;
import vn.demo.jobhunter.domain.response.resume.ResCreateResumeDTO;
import vn.demo.jobhunter.domain.response.resume.ResFetchResumeDTO;
import vn.demo.jobhunter.domain.response.resume.ResUpdateResumeDTO;
import vn.demo.jobhunter.repository.JobRepository;
import vn.demo.jobhunter.repository.ResumeRepository;
import vn.demo.jobhunter.repository.UserRepository;
import vn.demo.jobhunter.util.SecurityUtil;

@Service
public class ResumeService {

    private final FilterBuilder fb;
    private final FilterParser filterParser;
    private final FilterSpecificationConverter filterSpecificationConverter;
    private final ResumeRepository resumeRepository;
    private final UserRepository userRepository;
    private final JobRepository jobRepository;
    private final NotificationService notificationService;

    public ResumeService(
            ResumeRepository resumeRepository,
            UserRepository userRepository,
            JobRepository jobRepository,
            FilterBuilder fb,
            FilterParser filterParser,
            FilterSpecificationConverter filterSpecificationConverter,
            NotificationService notificationService) {
        this.resumeRepository = resumeRepository;
        this.userRepository = userRepository;
        this.jobRepository = jobRepository;
        this.fb = fb;
        this.filterParser = filterParser;
        this.filterSpecificationConverter = filterSpecificationConverter;
        this.notificationService = notificationService;
    }

    public Optional<Resume> fetchById(long id) {
        return this.resumeRepository.findById(id);
    }

    public boolean checkResumeExistByUserAndJob(Resume resume) {
        // check user by id
        if (resume.getUser() == null)
            return false;
        Optional<User> userOptional = this.userRepository.findById(resume.getUser().getId());
        if (userOptional.isEmpty())
            return false;

        // check job by id
        if (resume.getJob() == null)
            return false;
        Optional<Job> jobOptional = this.jobRepository.findById(resume.getJob().getId());
        if (jobOptional.isEmpty())
            return false;

        return true;
    }

    public ResCreateResumeDTO create(Resume resume) {
        // Prevent duplicate application
        if (resume.getUser() != null && resume.getJob() != null) {
            boolean exists = this.resumeRepository.existsByUserIdAndJobId(resume.getUser().getId(), resume.getJob().getId());
            if (exists) {
                throw new RuntimeException("Bạn đã ứng tuyển vào công việc này rồi.");
            }
        }
        resume = this.resumeRepository.save(resume);

        // Gửi thông báo cho HR/Admin của công ty
        Optional<Job> jobOptional = this.jobRepository.findById(resume.getJob().getId());
        if (jobOptional.isPresent()) {
            Job job = jobOptional.get();
            User hrUser = this.userRepository.findByEmail(job.getCreatedBy());
            if (hrUser != null) {
                this.notificationService.createNotification(
                    hrUser,
                    "Ứng tuyển mới",
                    "Ứng viên " + resume.getEmail() + " đã ứng tuyển vào vị trí " + job.getName(),
                    "NEW_APPLICATION",
                    "{\"jobId\": " + job.getId() + "}"
                );
            }
        }

        ResCreateResumeDTO res = new ResCreateResumeDTO();
        res.setId(resume.getId());
        res.setCreatedBy(resume.getCreatedBy());
        res.setCreatedAt(resume.getCreatedAt());

        return res;
    }

    public ResUpdateResumeDTO update(Resume resume, vn.demo.jobhunter.util.constant.ResumeStateEnum newStatus, String message) {
        vn.demo.jobhunter.util.constant.ResumeStateEnum oldStatus = resume.getStatus();
        resume.setStatus(newStatus);
        resume = this.resumeRepository.save(resume);

        // Gửi thông báo cho ứng viên khi trạng thái thay đổi
        if (oldStatus != newStatus) {
            User candidate = this.userRepository.findById(resume.getUser().getId()).orElse(null);
            if (candidate != null) {
                String statusMsg = (message != null && !message.isEmpty()) 
                    ? message 
                    : "Trạng thái ứng tuyển của bạn tại " + resume.getJob().getName() + " đã được cập nhật thành: " + resume.getStatus();
                
                this.notificationService.createNotification(
                    candidate,
                    "Cập nhật trạng thái",
                    statusMsg,
                    "APPLICATION_STATUS",
                    "{\"jobId\": " + resume.getJob().getId() + "}"
                );
            }
        }

        ResUpdateResumeDTO res = new ResUpdateResumeDTO();
        res.setUpdatedAt(resume.getUpdatedAt());
        res.setUpdatedBy(resume.getUpdatedBy());
        return res;
    }

    public void delete(long id) {
        this.resumeRepository.deleteById(id);
    }

    public ResFetchResumeDTO getResume(Resume resume) {
        ResFetchResumeDTO res = new ResFetchResumeDTO();
        res.setId(resume.getId());
        res.setEmail(resume.getEmail());
        res.setUrl(resume.getUrl());
        res.setStatus(resume.getStatus());
        res.setCreatedAt(resume.getCreatedAt());
        res.setCreatedBy(resume.getCreatedBy());
        res.setUpdatedAt(resume.getUpdatedAt());
        res.setUpdatedBy(resume.getUpdatedBy());

        if (resume.getJob() != null) {
            res.setCompanyName(resume.getJob().getCompany().getName());
        }

        res.setUser(new ResFetchResumeDTO.UserResume(resume.getUser().getId(), resume.getUser().getName()));
        res.setJob(new ResFetchResumeDTO.JobResume(resume.getJob().getId(), resume.getJob().getName()));

        return res;
    }

    public ResultPaginationDTO fetchAllResume(Specification<Resume> spec, Pageable pageable) {
        Page<Resume> pageUser = this.resumeRepository.findAll(spec, pageable);
        ResultPaginationDTO rs = new ResultPaginationDTO();
        ResultPaginationDTO.Meta mt = new ResultPaginationDTO.Meta();

        mt.setPage(pageable.getPageNumber() + 1);
        mt.setPageSize(pageable.getPageSize());

        mt.setPages(pageUser.getTotalPages());
        mt.setTotal(pageUser.getTotalElements());

        rs.setMeta(mt);

        // remove sensitive data
        List<ResFetchResumeDTO> listResume = pageUser.getContent()
                .stream().map(item -> this.getResume(item))
                .collect(Collectors.toList());

        rs.setResult(listResume);

        return rs;
    }

    public ResultPaginationDTO fetchResumeByUser(Pageable pageable) {
        String email = SecurityUtil.getCurrentUserLogin().orElse("");
        User currentUser = this.userRepository.findByEmail(email);
        
        if (currentUser == null) {
            return new ResultPaginationDTO();
        }

        Page<Resume> pageResume = this.resumeRepository.findByUserId(currentUser.getId(), pageable);

        ResultPaginationDTO rs = new ResultPaginationDTO();
        ResultPaginationDTO.Meta mt = new ResultPaginationDTO.Meta();

        mt.setPage(pageable.getPageNumber() + 1);
        mt.setPageSize(pageable.getPageSize());

        mt.setPages(pageResume.getTotalPages());
        mt.setTotal(pageResume.getTotalElements());

        rs.setMeta(mt);

        // remove sensitive data
        List<ResFetchResumeDTO> listResume = pageResume.getContent()
                .stream().map(item -> this.getResume(item))
                .collect(Collectors.toList());

        rs.setResult(listResume);

        return rs;
    }
}

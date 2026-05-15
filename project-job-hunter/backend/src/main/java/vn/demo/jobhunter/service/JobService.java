package vn.demo.jobhunter.service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import vn.demo.jobhunter.domain.Company;
import vn.demo.jobhunter.domain.Job;
import vn.demo.jobhunter.domain.Skill;
import vn.demo.jobhunter.domain.response.ResultPaginationDTO;
import vn.demo.jobhunter.domain.response.job.ResCreateJobDTO;
import vn.demo.jobhunter.domain.response.job.ResFetchJobDTO;
import vn.demo.jobhunter.domain.response.job.ResUpdateJobDTO;
import vn.demo.jobhunter.repository.CompanyRepository;
import vn.demo.jobhunter.repository.JobRepository;
import vn.demo.jobhunter.repository.SavedJobRepository;
import vn.demo.jobhunter.repository.SkillRepository;
import vn.demo.jobhunter.util.SecurityUtil;
import vn.demo.jobhunter.domain.User;
import vn.demo.jobhunter.repository.UserRepository;
import vn.demo.jobhunter.repository.ResumeRepository;

@Service
public class JobService {

    private final JobRepository jobRepository;
    private final SkillRepository skillRepository;
    private final CompanyRepository companyRepository;
    private final SavedJobRepository savedJobRepository;
    private final UserRepository userRepository;
    private final ResumeRepository resumeRepository;

    public JobService(
            JobRepository jobRepository,
            SkillRepository skillRepository,
            CompanyRepository companyRepository,
            SavedJobRepository savedJobRepository,
            UserRepository userRepository,
            ResumeRepository resumeRepository) {
        this.jobRepository = jobRepository;
        this.skillRepository = skillRepository;
        this.companyRepository = companyRepository;
        this.savedJobRepository = savedJobRepository;
        this.userRepository = userRepository;
        this.resumeRepository = resumeRepository;
    }

    public Optional<Job> fetchJobById(long id) {
        return this.jobRepository.findById(id);
    }

    /**
     * Convert Job entity to ResFetchJobDTO — safe for API response (no lazy fields exposed).
     */
    public ResFetchJobDTO convertToResFetchJobDTO(Job job) {
        ResFetchJobDTO dto = new ResFetchJobDTO();
        dto.setId(job.getId());
        dto.setName(job.getName());
        dto.setLocation(job.getLocation());
        dto.setSalary(job.getSalary());
        dto.setQuantity(job.getQuantity());
        dto.setLevel(job.getLevel());
        dto.setDescription(job.getDescription());
        dto.setRequirements(job.getRequirements());
        dto.setStartDate(job.getStartDate());
        dto.setEndDate(job.getEndDate());
        dto.setActive(job.isActive());
        dto.setIsPremium(job.getIsPremium());
        dto.setIsUrgent(job.getIsUrgent());
        dto.setViewCount(job.getViewCount());
        dto.setApplicantCount(job.getApplicantCount());
        dto.setCreatedAt(job.getCreatedAt());
        dto.setUpdatedAt(job.getUpdatedAt());
        dto.setCreatedBy(job.getCreatedBy());
        dto.setUpdatedBy(job.getUpdatedBy());

        if (job.getSkills() != null) {
            List<String> skills = job.getSkills()
                    .stream().map(Skill::getName)
                    .collect(Collectors.toList());
            dto.setSkills(skills);
        }

        if (job.getCompany() != null) {
            dto.setCompany(new ResFetchJobDTO.CompanyJob(
                    job.getCompany().getId(),
                    job.getCompany().getName(),
                    job.getCompany().getLogo()));
        }

        // Check if saved or applied by current user
        String email = SecurityUtil.getCurrentUserLogin().orElse("");
        if (!email.isEmpty()) {
            User user = this.userRepository.findByEmail(email);
            if (user != null) {
                dto.setIsSaved(this.savedJobRepository.existsByUserAndJob(user, job));
                dto.setIsApplied(this.resumeRepository.existsByUserIdAndJobId(user.getId(), job.getId()));
            }
        } else {
            dto.setIsSaved(false);
            dto.setIsApplied(false);
        }
 
        return dto;
    }

    /**
     * Fetch active jobs with a limit (for recommendation engine).
     * Avoids loading entire DB table with Pageable.unpaged().
     */
    public List<Job> fetchActiveJobs(int limit) {
        Page<Job> page = this.jobRepository.findAll(
                (root, query, cb) -> cb.equal(root.get("active"), true),
                PageRequest.of(0, limit));
        return page.getContent();
    }

    public ResCreateJobDTO create(Job j) {
        // check skills
        if (j.getSkills() != null) {
            List<Long> reqSkills = j.getSkills()
                    .stream().map(x -> x.getId())
                    .collect(Collectors.toList());

            List<Skill> dbSkills = this.skillRepository.findByIdIn(reqSkills);
            j.setSkills(dbSkills);
        }

        // check company
        if (j.getCompany() != null) {
            Optional<Company> cOptional = this.companyRepository.findById(j.getCompany().getId());
            if (cOptional.isPresent()) {
                j.setCompany(cOptional.get());
            }
        }

        // create job
        Job currentJob = this.jobRepository.save(j);

        // convert response
        ResCreateJobDTO dto = new ResCreateJobDTO();
        dto.setId(currentJob.getId());
        dto.setName(currentJob.getName());
        dto.setSalary(currentJob.getSalary());
        dto.setQuantity(currentJob.getQuantity());
        dto.setLocation(currentJob.getLocation());
        dto.setLevel(currentJob.getLevel());
        dto.setRequirements(currentJob.getRequirements());
        dto.setStartDate(currentJob.getStartDate());
        dto.setEndDate(currentJob.getEndDate());
        dto.setActive(currentJob.isActive());
        dto.setCreatedAt(currentJob.getCreatedAt());
        dto.setCreatedBy(currentJob.getCreatedBy());

        if (currentJob.getSkills() != null) {
            List<String> skills = currentJob.getSkills()
                    .stream().map(item -> item.getName())
                    .collect(Collectors.toList());
            dto.setSkills(skills);
        }
        return dto;
    }

    public ResUpdateJobDTO update(Job j, Job jobInDB) {

        // check skills
        if (j.getSkills() != null) {
            List<Long> reqSkills = j.getSkills()
                    .stream().map(x -> x.getId())
                    .collect(Collectors.toList());

            List<Skill> dbSkills = this.skillRepository.findByIdIn(reqSkills);
            jobInDB.setSkills(dbSkills);
        }

        // check company
        if (j.getCompany() != null) {
            Optional<Company> cOptional = this.companyRepository.findById(j.getCompany().getId());
            if (cOptional.isPresent()) {
                jobInDB.setCompany(cOptional.get());
            }
        }

        // update correct info
        jobInDB.setName(j.getName());
        jobInDB.setSalary(j.getSalary());
        jobInDB.setQuantity(j.getQuantity());
        jobInDB.setLocation(j.getLocation());
        jobInDB.setLevel(j.getLevel());
        jobInDB.setDescription(j.getDescription());
        jobInDB.setRequirements(j.getRequirements());
        jobInDB.setStartDate(j.getStartDate());
        jobInDB.setEndDate(j.getEndDate());
        jobInDB.setActive(j.isActive());

        // update job
        Job currentJob = this.jobRepository.save(jobInDB);

        // convert response
        ResUpdateJobDTO dto = new ResUpdateJobDTO();
        dto.setId(currentJob.getId());
        dto.setName(currentJob.getName());
        dto.setSalary(currentJob.getSalary());
        dto.setQuantity(currentJob.getQuantity());
        dto.setLocation(currentJob.getLocation());
        dto.setLevel(currentJob.getLevel());
        dto.setRequirements(currentJob.getRequirements());
        dto.setStartDate(currentJob.getStartDate());
        dto.setEndDate(currentJob.getEndDate());
        dto.setActive(currentJob.isActive());
        dto.setUpdatedAt(currentJob.getUpdatedAt());
        dto.setUpdatedBy(currentJob.getUpdatedBy());

        if (currentJob.getSkills() != null) {
            List<String> skills = currentJob.getSkills()
                    .stream().map(item -> item.getName())
                    .collect(Collectors.toList());
            dto.setSkills(skills);
        }

        return dto;
    }

    public void delete(long id) {
        this.jobRepository.deleteById(id);
    }

    public ResultPaginationDTO fetchAll(Specification<Job> spec, org.springframework.data.domain.Pageable pageable) {
        // Ưu tiên cty Premium lên đầu, sau đó mới đến các tiêu chí sort khác
        org.springframework.data.domain.Sort premiumSort = org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "company.isPremium")
                .and(pageable.getSort());
        
        org.springframework.data.domain.Pageable newPageable = org.springframework.data.domain.PageRequest.of(
            pageable.getPageNumber(), 
            pageable.getPageSize(), 
            premiumSort
        );

        Page<Job> pageUser = this.jobRepository.findAll(spec, newPageable);
        ResultPaginationDTO rs = new ResultPaginationDTO();
        ResultPaginationDTO.Meta mt = new ResultPaginationDTO.Meta();
        mt.setPage(pageable.getPageNumber() + 1);
        mt.setPageSize(pageable.getPageSize());
        mt.setPages(pageUser.getTotalPages());
        mt.setTotal(pageUser.getTotalElements());
        rs.setMeta(mt);

        // Convert list to DTO
        List<ResFetchJobDTO> listDTO = pageUser.getContent()
                .stream().map(this::convertToResFetchJobDTO)
                .collect(Collectors.toList());
        rs.setResult(listDTO);

        return rs;
    }

    public List<Job> findJobsNearby(double lat, double lng, double radiusKm) {
        // Lấy tất cả job đang active
        List<Job> allJobs = this.jobRepository.findByActiveTrue();
        return allJobs.stream()
            .filter(j -> j.getCompany() != null && j.getCompany().getLatitude() != null && j.getCompany().getLongitude() != null)
            .filter(j -> {
                double distance = calculateDistance(lat, lng, j.getCompany().getLatitude(), j.getCompany().getLongitude());
                return distance <= radiusKm;
            })
            .collect(Collectors.toList());
    }

    private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        double R = 6371; // Bán kính Trái Đất (km)
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                   Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                   Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
}

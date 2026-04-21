package vn.demo.jobhunter.service;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import vn.demo.jobhunter.domain.Company;
import vn.demo.jobhunter.domain.Job;
import vn.demo.jobhunter.repository.CompanyRepository;
import vn.demo.jobhunter.repository.JobRepository;

@Service
public class JobService {

    private final JobRepository jobRepository;
    private final CompanyRepository companyRepository;

    public JobService(JobRepository jobRepository, CompanyRepository companyRepository) {
        this.jobRepository = jobRepository;
        this.companyRepository = companyRepository;
    }

    // tạo mới job
    public Job create(Job j) {
        // Check xem đã tồn tại chưa trước khi gắn vào
        if (j.getCompany() != null) {
            Optional<Company> cOptional = this.companyRepository.findById(j.getCompany().getId());
            if (cOptional.isPresent()) {
                j.setCompany(cOptional.get());
            }
        }
        return this.jobRepository.save(j);
    }

    //lấy tất cả job
    public List<Job> fetchAll() {
        return this.jobRepository.findAll();
    }

    // tìm job theo id
    public Optional<Job> fetchJobById(long id) {
        return this.jobRepository.findById(id);
    }

    //cập nhật job
    public Job update(Job j, Job jobInDB) {
        if (j.getCompany() != null) {
            Optional<Company> cOptional = this.companyRepository.findById(j.getCompany().getId());
            if (cOptional.isPresent()) {
                jobInDB.setCompany(cOptional.get());
            }
        }
        jobInDB.setName(j.getName());
        jobInDB.setSalary(j.getSalary());
        jobInDB.setQuantity(j.getQuantity());
        jobInDB.setLocation(j.getLocation());
        jobInDB.setDescription(j.getDescription());
        jobInDB.setStartDate(j.getStartDate());
        jobInDB.setEndDate(j.getEndDate());
        jobInDB.setActive(j.isActive());
        return this.jobRepository.save(jobInDB);
    }

    //xóa job
    public void delete(long id) {
        this.jobRepository.deleteById(id);
    }
}

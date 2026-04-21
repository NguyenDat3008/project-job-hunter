package vn.demo.jobhunter.service;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import vn.demo.jobhunter.domain.Company;
import vn.demo.jobhunter.repository.CompanyRepository;

@Service
public class CompanyService {

    private final CompanyRepository companyRepository;

    public CompanyService(CompanyRepository companyRepository) {
        this.companyRepository = companyRepository;
    }

    // tạo mới công ty
    public Company handleCreateCompany(Company c) {
        return this.companyRepository.save(c);
    }

    // lấy tất cả
    public List<Company> handleGetAllCompanies() {
        return this.companyRepository.findAll();
    }

    // tìm theo id
    public Optional<Company> findById(long id) {
        return this.companyRepository.findById(id);
    }

    // cập nhật
    public Company handleUpdateCompany(Company c) {
        Optional<Company> companyOptional = this.companyRepository.findById(c.getId());
        if (companyOptional.isPresent()) {
            Company currentCompany = companyOptional.get();
            currentCompany.setName(c.getName());
            currentCompany.setDescription(c.getDescription());
            currentCompany.setAddress(c.getAddress());
            currentCompany.setLogo(c.getLogo());
            return this.companyRepository.save(currentCompany);
        }
        return null;
    }

    // xóa công ty
    public void handleDeleteCompany(long id) {
        this.companyRepository.deleteById(id);
    }
}

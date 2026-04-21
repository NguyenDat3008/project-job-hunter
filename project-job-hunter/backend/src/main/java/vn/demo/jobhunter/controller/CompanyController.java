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
import vn.demo.jobhunter.domain.Company;
import vn.demo.jobhunter.service.CompanyService;

@RestController
@RequestMapping("/api/v1")
@CrossOrigin(origins = "*")
@Tag(name = "Company", description = "API Quản lý Công ty")
public class CompanyController {

    private final CompanyService companyService;

    public CompanyController(CompanyService companyService) {
        this.companyService = companyService;
    }

    // CREATE: POST http://localhost:8080/api/v1/companies
    @PostMapping("/companies")
    @Operation(summary = "Tạo mới công ty", description = "Nhập thông tin công ty mới vào hệ thống")
    public ResponseEntity<Company> createCompany(@Valid @RequestBody Company reqCompany) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(this.companyService.handleCreateCompany(reqCompany));
    }

    // READ ALL: GET http://localhost:8080/api/v1/companies
    @GetMapping("/companies")
    @Operation(summary = "Lấy danh sách công ty")
    public ResponseEntity<List<Company>> getAllCompanies() {
        return ResponseEntity.ok(this.companyService.handleGetAllCompanies());
    }

    // READ ONE: GET http://localhost:8080/api/v1/companies/1
    @GetMapping("/companies/{id}")
    @Operation(summary = "Lấy công ty theo ID")
    public ResponseEntity<Company> fetchCompanyById(@PathVariable("id") long id) {
        Optional<Company> cOptional = this.companyService.findById(id);
        if (cOptional.isPresent()) {
            return ResponseEntity.ok(cOptional.get());
        }
        return ResponseEntity.notFound().build();
    }

    // UPDATE: PUT http://localhost:8080/api/v1/companies
    @PutMapping("/companies")
    @Operation(summary = "Cập nhật công ty")
    public ResponseEntity<Company> updateCompany(@Valid @RequestBody Company reqCompany) {
        Company updatedCompany = this.companyService.handleUpdateCompany(reqCompany);
        if (updatedCompany != null) {
            return ResponseEntity.ok(updatedCompany);
        }
        return ResponseEntity.notFound().build();
    }

    // DELETE: DELETE http://localhost:8080/api/v1/companies/1
    @DeleteMapping("/companies/{id}")
    @Operation(summary = "Xoá công ty theo ID")
    public ResponseEntity<Void> deleteCompany(@PathVariable("id") long id) {
        this.companyService.handleDeleteCompany(id);
        return ResponseEntity.ok(null);
    }
}

package vn.demo.jobhunter.controller;

import java.util.Optional;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.turkraft.springfilter.boot.Filter;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import vn.demo.jobhunter.domain.Company;
import vn.demo.jobhunter.domain.response.ResultPaginationDTO;
import vn.demo.jobhunter.service.CompanyService;
import vn.demo.jobhunter.util.annotation.ApiMessage;
import vn.demo.jobhunter.util.error.PermissionException;


/**
 * @controller CompanyController
 * @description API Quản lý Công ty - Hỗ trợ quy trình Đăng ký & Phê duyệt
 */
@RestController
@RequestMapping("/api/v1")
@Tag(name = "Company", description = "API Quản lý Công ty")
public class CompanyController {
    private final CompanyService companyService;

    public CompanyController(CompanyService companyService) {
        this.companyService = companyService;
    }

    @PostMapping("/companies")
    @ApiMessage("Create a company")
    @Operation(summary = "Tạo mới công ty", description = "Nhập thông tin công ty mới vào hệ thống (NORMAL_USER tạo sẽ chờ duyệt)")
    public ResponseEntity<Company> createCompany(@Valid @RequestBody Company reqCompany) throws PermissionException {
        return ResponseEntity.status(HttpStatus.CREATED).body(this.companyService.handleCreateCompany(reqCompany));
    }

    @GetMapping("/companies")
    @ApiMessage("Fetch companies with pagination")
    @Operation(summary = "Lấy danh sách công ty", description = "Lấy danh sách các công ty có hỗ trợ phân trang và lọc")
    public ResponseEntity<ResultPaginationDTO> getCompany(
            @Filter Specification<Company> spec,
            Pageable pageable) {
        return ResponseEntity.ok(this.companyService.handleGetCompany(spec, pageable));
    }

    @PutMapping("/companies")
    @ApiMessage("Update company information")
    @Operation(summary = "Cập nhật công ty", description = "Cập nhật thông tin công ty hoặc phê duyệt trạng thái active")
    public ResponseEntity<Company> updateCompany(@Valid @RequestBody Company reqCompany) throws PermissionException {
        return ResponseEntity.ok(this.companyService.handleUpdateCompany(reqCompany));
    }

    @DeleteMapping("/companies/{id}")
    @ApiMessage("Delete a company")
    @Operation(summary = "Xóa công ty", description = "Xóa công ty khỏi hệ thống dựa trên ID (chỉ SUPER_ADMIN)")
    public ResponseEntity<Void> deleteCompany(@PathVariable("id") long id) {
        this.companyService.handleDeleteCompany(id);
        return ResponseEntity.ok(null);
    }

    @GetMapping("/companies/{id}")
    @ApiMessage("Fetch company by id")
    @Operation(summary = "Lấy chi tiết công ty", description = "Lấy toàn bộ thông tin của một công ty thông qua ID")
    public ResponseEntity<Company> fetchCompanyById(@PathVariable("id") long id) {
        Optional<Company> companyOptional = this.companyService.findById(id);
        return ResponseEntity.ok().body(companyOptional.orElse(null));
    }
}

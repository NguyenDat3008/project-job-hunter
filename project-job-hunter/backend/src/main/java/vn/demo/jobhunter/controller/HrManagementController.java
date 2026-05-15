package vn.demo.jobhunter.controller;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import vn.demo.jobhunter.domain.User;
import vn.demo.jobhunter.domain.response.ResUserDTO;
import vn.demo.jobhunter.service.UserService;
import vn.demo.jobhunter.util.SecurityUtil;
import vn.demo.jobhunter.util.annotation.ApiMessage;
import vn.demo.jobhunter.util.error.IdInvalidException;
import vn.demo.jobhunter.util.error.PermissionException;

/**
 * @controller HrManagementController
 * @description API Quản lý HR trong công ty - Chỉ COMPANY_REPRESENTATIVE hoặc SUPER_ADMIN
 */
@RestController
@RequestMapping("/api/v1")
@Tag(name = "HR Management", description = "API Quản lý nhân sự HR trong công ty")
public class HrManagementController {

    private final UserService userService;

    public HrManagementController(UserService userService) {
        this.userService = userService;
    }

    /**
     * Request body cho việc thêm HR
     */
    public static class AddHrRequest {
        private String email;

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }
    }

    @PostMapping("/hr-management/{companyId}")
    @ApiMessage("Add HR to company")
    @Operation(summary = "Thêm HR vào công ty",
            description = "Người đại diện công ty (COMPANY_REPRESENTATIVE) thêm một user trở thành HR của công ty mình")
    public ResponseEntity<ResUserDTO> addHrToCompany(
            @PathVariable("companyId") long companyId,
            @RequestBody AddHrRequest request) throws IdInvalidException, PermissionException {

        String email = SecurityUtil.getCurrentUserLogin().orElse("");
        // Call service to add HR by email
        User updatedUser = this.userService.addHrByEmail(request.getEmail(), companyId, email);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(this.userService.convertToResUserDTO(updatedUser));
    }

    @DeleteMapping("/hr-management/{companyId}/{userId}")
    @ApiMessage("Remove HR from company")
    @Operation(summary = "Xóa HR khỏi công ty",
            description = "Người đại diện công ty xóa một HR, reset user về NORMAL_USER")
    public ResponseEntity<ResUserDTO> removeHrFromCompany(
            @PathVariable("companyId") long companyId,
            @PathVariable("userId") long userId) throws IdInvalidException, PermissionException {

        String email = SecurityUtil.getCurrentUserLogin().orElse("");
        User updatedUser = this.userService.removeHrFromCompany(userId, companyId, email);
        return ResponseEntity.ok(this.userService.convertToResUserDTO(updatedUser));
    }

    @GetMapping("/hr-management/{companyId}")
    @ApiMessage("Get HR list of company")
    @Operation(summary = "Lấy danh sách HR của công ty",
            description = "Lấy tất cả HR và Người đại diện thuộc công ty")
    public ResponseEntity<List<ResUserDTO>> getHrByCompany(
            @PathVariable("companyId") long companyId) throws IdInvalidException, PermissionException {

        // Kiểm tra quyền: Chỉ cho phép Admin hoặc người thuộc chính công ty đó xem
        String email = SecurityUtil.getCurrentUserLogin().orElse("");
        User currentUser = this.userService.handleGetUserByUsername(email);
        
        if (currentUser != null && currentUser.getRole() != null) {
            String roleName = currentUser.getRole().getName();
            if (!roleName.equals("SUPER_ADMIN")) {
                if (currentUser.getCompany() == null || currentUser.getCompany().getId() != companyId) {
                    throw new PermissionException("Bạn không có quyền xem danh sách nhân sự của công ty khác.");
                }
            }
        }

        List<User> users = this.userService.getHrByCompany(companyId);
        List<ResUserDTO> result = users.stream()
                .map(this.userService::convertToResUserDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }
}

package vn.demo.jobhunter.controller;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.turkraft.springfilter.boot.Filter;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import vn.demo.jobhunter.domain.User;
import vn.demo.jobhunter.domain.response.ResCreateUserDTO;
import vn.demo.jobhunter.domain.response.ResUpdateUserDTO;
import vn.demo.jobhunter.domain.response.ResUserDTO;
import vn.demo.jobhunter.domain.response.ResultPaginationDTO;
import vn.demo.jobhunter.service.FileService;
import vn.demo.jobhunter.service.UserService;
import vn.demo.jobhunter.util.SecurityUtil;
import vn.demo.jobhunter.util.annotation.ApiMessage;
import vn.demo.jobhunter.util.error.IdInvalidException;
import vn.demo.jobhunter.util.error.PermissionException;

@RestController
@RequestMapping("/api/v1")
@Tag(name = "User", description = "API Quản lý Người dùng")
public class UserController {
    private final UserService userService;
    private final FileService fileService;
    private final PasswordEncoder passwordEncoder;

    public UserController(UserService userService, FileService fileService, PasswordEncoder passwordEncoder) {
        this.userService = userService;
        this.fileService = fileService;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/users/avatar")
    @ApiMessage("Upload user avatar")
    @Operation(summary = "Tải lên ảnh đại diện", description = "Lưu ảnh đại diện vào hệ thống lưu trữ (MinIO) và cập nhật thông tin người dùng")
    public ResponseEntity<String> uploadAvatar(@RequestParam("file") MultipartFile file) throws Exception {
        // 1. Lưu file vào MinIO
        String fileName = this.fileService.store(file, "avatars");
        
        // 2. Cập nhật vào DB
        String email = SecurityUtil.getCurrentUserLogin().orElse("");
        this.userService.updateAvatar(email, fileName);
        
        return ResponseEntity.ok(fileName);
    }

    @PostMapping("/users")
    @ApiMessage("Create a new user")
    @Operation(summary = "Tạo mới người dùng", description = "Đăng ký hoặc tạo mới một tài khoản người dùng")
    public ResponseEntity<ResCreateUserDTO> createNewUser(@Valid @RequestBody User postManUser)
            throws IdInvalidException {
        boolean isEmailExist = this.userService.isEmailExist(postManUser.getEmail());
        if (isEmailExist) {
            throw new IdInvalidException(
                    "Email " + postManUser.getEmail() + "đã tồn tại, vui lòng sử dụng email khác.");
        }

        String hashPassword = this.passwordEncoder.encode(postManUser.getPassword());
        postManUser.setPassword(hashPassword);
        User ericUser = this.userService.handleCreateUser(postManUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(this.userService.convertToResCreateUserDTO(ericUser));
    }

    @DeleteMapping("/users/{id}")
    @ApiMessage("Delete a user")
    @Operation(summary = "Xóa người dùng", description = "Xóa tài khoản người dùng dựa trên ID (Chỉ Admin hoặc chính chủ)")
    public ResponseEntity<Void> deleteUser(@PathVariable("id") long id)
            throws IdInvalidException, PermissionException {
        User currentUser = this.userService.fetchUserById(id);
        if (currentUser == null) {
            throw new IdInvalidException("User với id = " + id + " không tồn tại");
        }

        // CHECK OWNERSHIP
        String email = SecurityUtil.getCurrentUserLogin().isPresent() ? SecurityUtil.getCurrentUserLogin().get() : "";
        User loginUser = this.userService.handleGetUserByUsername(email);
        if (loginUser != null && loginUser.getId() != id && !loginUser.getRole().getName().equals("SUPER_ADMIN")) {
            throw new PermissionException("Bạn không có quyền xóa user này.");
        }

        this.userService.handleDeleteUser(id);
        return ResponseEntity.ok(null);
    }

    @GetMapping("/users/{id}")
    @ApiMessage("fetch user by id")
    @Operation(summary = "Lấy chi tiết người dùng", description = "Lấy toàn bộ thông tin của một người dùng dựa trên ID")
    public ResponseEntity<ResUserDTO> getUserById(@PathVariable("id") long id) throws IdInvalidException {
        User fetchUser = this.userService.fetchUserById(id);
        if (fetchUser == null) {
            throw new IdInvalidException("User với id = " + id + " không tồn tại");
        }

        return ResponseEntity.status(HttpStatus.OK)
                .body(this.userService.convertToResUserDTO(fetchUser));
    }

    // fetch all users
    @GetMapping("/users")
    @ApiMessage("fetch all users")
    @Operation(summary = "Lấy danh sách người dùng", description = "Lấy danh sách tất cả người dùng với phân trang và bộ lọc nâng cao")
    public ResponseEntity<ResultPaginationDTO> getAllUser(
            @Filter @org.springframework.lang.NonNull Specification<User> spec,
            @org.springframework.lang.NonNull Pageable pageable) {
        return ResponseEntity.status(HttpStatus.OK).body(this.userService.fetchAllUser(spec, pageable));
    }

    @PutMapping("/users")
    @ApiMessage("Update a user")
    @Operation(summary = "Cập nhật người dùng", description = "Sửa thông tin cá nhân của người dùng")
    public ResponseEntity<ResUpdateUserDTO> updateUser(@RequestBody User user) throws IdInvalidException, PermissionException {
        // CHECK OWNERSHIP
        String email = SecurityUtil.getCurrentUserLogin().isPresent() ? SecurityUtil.getCurrentUserLogin().get() : "";
        User loginUser = this.userService.handleGetUserByUsername(email);
        if (loginUser != null && loginUser.getId() != user.getId() && !loginUser.getRole().getName().equals("SUPER_ADMIN")) {
            throw new PermissionException("Bạn không có quyền cập nhật user này.");
        }

        User ericUser = this.userService.handleUpdateUser(user);
        if (ericUser == null) {
            throw new IdInvalidException("User với id = " + user.getId() + " không tồn tại");
        }
        return ResponseEntity.ok(this.userService.convertToResUpdateUserDTO(ericUser));
    }

    @PostMapping("/users/change-password")
    @ApiMessage("Change user password")
    @Operation(summary = "Đổi mật khẩu", description = "Người dùng tự thay đổi mật khẩu của mình")
    public ResponseEntity<Void> changePassword(@Valid @RequestBody vn.demo.jobhunter.domain.request.ReqChangePasswordDTO req) throws IdInvalidException {
        String email = SecurityUtil.getCurrentUserLogin().orElse("");
        User currentUser = this.userService.handleGetUserByUsername(email);
        
        if (currentUser == null) {
            throw new IdInvalidException("User không tồn tại");
        }

        if (!this.passwordEncoder.matches(req.getOldPassword(), currentUser.getPassword())) {
            throw new IdInvalidException("Mật khẩu cũ không chính xác");
        }

        String hashPassword = this.passwordEncoder.encode(req.getNewPassword());
        this.userService.handleChangePassword(email, hashPassword);
        
        return ResponseEntity.ok(null);
    }
}

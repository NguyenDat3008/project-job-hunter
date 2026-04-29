package vn.demo.jobhunter.controller;

import java.time.Instant;
import java.util.Arrays;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import vn.demo.jobhunter.domain.User;
import vn.demo.jobhunter.domain.response.file.ResUploadFileDTO;
import vn.demo.jobhunter.service.FileService;
import vn.demo.jobhunter.service.UserService;
import vn.demo.jobhunter.util.SecurityUtil;
import vn.demo.jobhunter.util.annotation.ApiMessage;
import vn.demo.jobhunter.util.error.PermissionException;
import vn.demo.jobhunter.util.error.StorageException;

@RestController
@RequestMapping("/api/v1")
@Tag(name = "File", description = "API Quản lý File (MinIO)")
public class FileController {

    private final FileService fileService;
    private final UserService userService;

    public FileController(FileService fileService, UserService userService) {
        this.fileService = fileService;
        this.userService = userService;
    }

    @PostMapping("/files")
    @ApiMessage("Upload a file")
    @Operation(summary = "Tải lên file", description = "Tải file lên MinIO (Hỗ trợ CV, Logo công ty, ảnh đại diện)")
    public ResponseEntity<ResUploadFileDTO> upload(
            @RequestParam(name = "file", required = false) MultipartFile file,
            @RequestParam(name = "folder", required = false) String folder)
            throws StorageException, PermissionException, Exception {

        // SECURITY CHECK: Only Admin or HR can upload company logos/job files
        String email = SecurityUtil.getCurrentUserLogin().orElse("");
        User currentUser = this.userService.handleGetUserByUsername(email);

        if (currentUser != null && currentUser.getRole() != null) {
            String roleName = currentUser.getRole().getName();
            // Candidate (NORMAL_USER) can only upload CVs (resumes)
            if (roleName.equals("NORMAL_USER") && !"resume".equals(folder)) {
                throw new PermissionException("Bạn chỉ có quyền upload hồ sơ cá nhân (CV).");
            }
        }

        // validate file
        if (file == null || file.isEmpty()) {
            throw new StorageException("File is empty. Please upload a file.");
        }

        List<String> allowedExtensions = Arrays.asList("pdf", "jpg", "jpeg", "png", "doc", "docx");
        String fileName = file.getOriginalFilename();
        boolean isValid = allowedExtensions.stream().anyMatch(item -> fileName != null && fileName.toLowerCase().endsWith(item));

        if (!isValid) {
            throw new StorageException("Invalid file extension. Allowed: " + allowedExtensions.toString());
        }

        // store file
        String uploadFile = this.fileService.store(file, folder);

        ResUploadFileDTO res = new ResUploadFileDTO();
        res.setFileName(uploadFile);
        res.setUploadedAt(Instant.now());

        return ResponseEntity.ok().body(res);
    }

    @GetMapping("/files")
    @ApiMessage("Get file URL from MinIO")
    @Operation(summary = "Lấy link tải file", description = "Lấy đường dẫn URL trực tiếp từ MinIO để xem hoặc tải file")
    public ResponseEntity<String> getFileUrl(
            @RequestParam(name = "fileName") String fileName) {
        return ResponseEntity.ok().body(this.fileService.getFileUrl(fileName));
    }
}

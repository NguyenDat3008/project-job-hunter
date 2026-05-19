package vn.demo.jobhunter.controller;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.turkraft.springfilter.boot.Filter;
import com.turkraft.springfilter.builder.FilterBuilder;
import com.turkraft.springfilter.converter.FilterSpecificationConverter;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import vn.demo.jobhunter.domain.Company;
import vn.demo.jobhunter.domain.Job;
import vn.demo.jobhunter.domain.Resume;
import vn.demo.jobhunter.domain.User;
import vn.demo.jobhunter.domain.response.ResultPaginationDTO;
import vn.demo.jobhunter.domain.response.resume.ResCreateResumeDTO;
import vn.demo.jobhunter.domain.response.resume.ResFetchResumeDTO;
import vn.demo.jobhunter.domain.response.resume.ResUpdateResumeDTO;
import vn.demo.jobhunter.service.ResumeService;
import vn.demo.jobhunter.service.UserService;
import vn.demo.jobhunter.util.SecurityUtil;
import vn.demo.jobhunter.util.annotation.ApiMessage;
import vn.demo.jobhunter.util.error.IdInvalidException;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

/**
 * @controller ResumeController
 * @description API Quản lý Hồ sơ ứng tuyển (Resume/CV) - Nộp, duyệt, theo dõi trạng thái
 */
@RestController
@RequestMapping("/api/v1")
@Tag(name = "Resume", description = "API Quản lý Hồ sơ ứng tuyển")
public class ResumeController {

    private final ResumeService resumeService;
    private final UserService userService;

    private final FilterBuilder filterBuilder;
    private final FilterSpecificationConverter filterSpecificationConverter;

    public ResumeController(
            ResumeService resumeService,
            UserService userService,
            FilterBuilder filterBuilder,
            FilterSpecificationConverter filterSpecificationConverter) {
        this.resumeService = resumeService;
        this.userService = userService;
        this.filterBuilder = filterBuilder;
        this.filterSpecificationConverter = filterSpecificationConverter;
    }

    @PostMapping("/resumes")
    @ApiMessage("Create a resume")
    @Operation(summary = "Nộp hồ sơ ứng tuyển", description = "Ứng viên nộp CV vào một Job cụ thể (cần upload file trước qua API File)")
    public ResponseEntity<ResCreateResumeDTO> create(@Valid @RequestBody Resume resume) throws IdInvalidException {
        // check id exists
        boolean isIdExist = this.resumeService.checkResumeExistByUserAndJob(resume);
        if (!isIdExist) {
            throw new IdInvalidException("User id/Job id không tồn tại");
        }

        // create new resume
        return ResponseEntity.status(HttpStatus.CREATED).body(this.resumeService.create(resume));
    }

    @PutMapping("/resumes")
    @ApiMessage("Update a resume")
    @Operation(summary = "Cập nhật trạng thái hồ sơ", description = "HR/Admin duyệt hoặc từ chối hồ sơ (chỉ được duyệt Resume của công ty mình)")
    public ResponseEntity<ResUpdateResumeDTO> update(@RequestBody vn.demo.jobhunter.domain.request.resume.ReqUpdateResumeDTO req) throws IdInvalidException, vn.demo.jobhunter.util.error.PermissionException {
        // check id exist
        Optional<Resume> reqResumeOptional = this.resumeService.fetchById(req.getId());
        if (reqResumeOptional.isEmpty()) {
            throw new IdInvalidException("Resume với id = " + req.getId() + " không tồn tại");
        }
 
        Resume reqResume = reqResumeOptional.get();
 
        // CHECK OWNERSHIP
        String email = SecurityUtil.getCurrentUserLogin().orElse("");
        User currentUser = this.userService.handleGetUserByUsername(email);
        if (currentUser != null && currentUser.getRole() != null) {
            if (!currentUser.getRole().getName().equals("SUPER_ADMIN")) {
                if (currentUser.getCompany() == null || reqResume.getJob() == null || reqResume.getJob().getCompany() == null || currentUser.getCompany().getId() != reqResume.getJob().getCompany().getId()) {
                    throw new vn.demo.jobhunter.util.error.PermissionException("Bạn không có quyền cập nhật Resume của công ty khác.");
                }
            }
        }
 
        return ResponseEntity.ok().body(this.resumeService.update(reqResume, req.getStatus(), req.getMessage()));
    }

    @DeleteMapping("/resumes/{id}")
    @ApiMessage("Delete a resume by id")
    @Operation(summary = "Xóa hồ sơ ứng tuyển", description = "Xóa Resume theo ID (chỉ được xóa Resume thuộc công ty mình)")
    public ResponseEntity<Void> delete(@PathVariable("id") long id) throws IdInvalidException, vn.demo.jobhunter.util.error.PermissionException {
        Optional<Resume> reqResumeOptional = this.resumeService.fetchById(id);
        if (reqResumeOptional.isEmpty()) {
            throw new IdInvalidException("Resume với id = " + id + " không tồn tại");
        }

        Resume reqResume = reqResumeOptional.get();

        // CHECK OWNERSHIP
        String email = SecurityUtil.getCurrentUserLogin().orElse("");
        User currentUser = this.userService.handleGetUserByUsername(email);
        if (currentUser != null && currentUser.getRole() != null) {
            if (!currentUser.getRole().getName().equals("SUPER_ADMIN")) {
                if (currentUser.getCompany() == null || reqResume.getJob() == null || reqResume.getJob().getCompany() == null || currentUser.getCompany().getId() != reqResume.getJob().getCompany().getId()) {
                    throw new vn.demo.jobhunter.util.error.PermissionException("Bạn không có quyền xóa Resume của công ty khác.");
                }
            }
        }

        this.resumeService.delete(id);
        return ResponseEntity.ok().body(null);
    }

    @GetMapping("/resumes/{id}")
    @ApiMessage("Fetch a resume by id")
    @Operation(summary = "Xem chi tiết hồ sơ", description = "Lấy thông tin chi tiết của một hồ sơ ứng tuyển theo ID")
    public ResponseEntity<ResFetchResumeDTO> fetchById(@PathVariable("id") long id) throws IdInvalidException {
        Optional<Resume> reqResumeOptional = this.resumeService.fetchById(id);
        if (reqResumeOptional.isEmpty()) {
            throw new IdInvalidException("Resume với id = " + id + " không tồn tại");
        }

        return ResponseEntity.ok().body(this.resumeService.getResume(reqResumeOptional.get()));
    }

    @GetMapping("/resumes")
    @ApiMessage("Fetch all resume with paginate")
    @Operation(summary = "Danh sách hồ sơ", description = "HR/Admin xem danh sách Resume có phân trang (lọc theo Job của công ty mình)")
    public ResponseEntity<ResultPaginationDTO> fetchAll(
            @Filter @org.springframework.lang.NonNull Specification<Resume> spec,
            @org.springframework.lang.NonNull Pageable pageable) {

        List<Long> arrJobIds = null;
        String email = SecurityUtil.getCurrentUserLogin().isPresent() == true
                ? SecurityUtil.getCurrentUserLogin().get()
                : "";
        User currentUser = this.userService.handleGetUserByUsername(email);
        if (currentUser != null) {
            Company userCompany = currentUser.getCompany();
            if (userCompany != null) {
                List<Job> companyJobs = userCompany.getJobs();
                if (companyJobs != null && companyJobs.size() > 0) {
                    arrJobIds = companyJobs.stream().map(x -> x.getId())
                            .collect(Collectors.toList());
                }
            }
        }

        // BUG FIX #2: Nếu user không thuộc công ty nào (arrJobIds == null hoặc rỗng)
        // thì không được trả về toàn bộ resumes của hệ thống.
        // SUPER_ADMIN không bị lọc theo company → kiểm tra role
        boolean isSuperAdmin = currentUser != null
                && currentUser.getRole() != null
                && currentUser.getRole().getName().equals("SUPER_ADMIN");

        if (!isSuperAdmin && (arrJobIds == null || arrJobIds.isEmpty())) {
            // Trả về kết quả rỗng — user không có công ty không được xem resume
            ResultPaginationDTO empty = new ResultPaginationDTO();
            ResultPaginationDTO.Meta mt = new ResultPaginationDTO.Meta();
            mt.setPage(pageable.getPageNumber() + 1);
            mt.setPageSize(pageable.getPageSize());
            mt.setPages(0);
            mt.setTotal(0);
            empty.setMeta(mt);
            empty.setResult(java.util.Collections.emptyList());
            return ResponseEntity.ok().body(empty);
        }

        Specification<Resume> finalSpec;
        if (isSuperAdmin) {
            // SUPER_ADMIN xem tất cả resumes, chỉ áp dụng filter từ request
            finalSpec = spec;
        } else {
            @SuppressWarnings("null")
            Specification<Resume> jobInSpec = filterSpecificationConverter.convert(filterBuilder.field("job")
                    .in(filterBuilder.input(arrJobIds != null ? arrJobIds : java.util.Collections.emptyList())).get());
            finalSpec = jobInSpec.and(spec);
        }

        return ResponseEntity.ok().body(this.resumeService.fetchAllResume(finalSpec, pageable));
    }

    // BUG FIX #3: Đổi từ @PostMapping → @GetMapping (không có body, chỉ đọc data)
    @GetMapping("/resumes/by-user")
    @ApiMessage("Get list resumes by user")
    @Operation(summary = "Xem Resume của tôi", description = "Ứng viên xem danh sách hồ sơ mình đã nộp")
    public ResponseEntity<ResultPaginationDTO> fetchResumeByUser(@org.springframework.lang.NonNull Pageable pageable) {

        return ResponseEntity.ok().body(this.resumeService.fetchResumeByUser(pageable));
    }

    @PutMapping("/resumes/{id}/report")
    @ApiMessage("Báo cáo vi phạm CV")
    @Operation(summary = "Báo cáo vi phạm CV", description = "HR báo cáo CV của ứng viên gửi linh tinh/rác")
    public ResponseEntity<ResFetchResumeDTO> reportResume(
            @PathVariable("id") long id,
            @RequestBody(required = false) java.util.Map<String, String> body) throws IdInvalidException, vn.demo.jobhunter.util.error.PermissionException {
        // CHECK OWNERSHIP
        String email = SecurityUtil.getCurrentUserLogin().orElse("");
        User currentUser = this.userService.handleGetUserByUsername(email);
        if (currentUser != null && currentUser.getRole() != null) {
            if (!currentUser.getRole().getName().equals("SUPER_ADMIN")) {
                Optional<Resume> reqResumeOptional = this.resumeService.fetchById(id);
                if (reqResumeOptional.isEmpty()) {
                    throw new IdInvalidException("Resume với id = " + id + " không tồn tại");
                }
                Resume reqResume = reqResumeOptional.get();
                if (currentUser.getCompany() == null || reqResume.getJob() == null || reqResume.getJob().getCompany() == null || currentUser.getCompany().getId() != reqResume.getJob().getCompany().getId()) {
                    throw new vn.demo.jobhunter.util.error.PermissionException("Bạn không có quyền báo cáo Resume của công ty khác.");
                }
            }
        }

        String reason = (body != null && body.containsKey("reason")) ? body.get("reason") : "Không rõ lý do";
        Resume updated = this.resumeService.report(id, reason);
        return ResponseEntity.ok().body(this.resumeService.getResume(updated));
    }

    @PutMapping("/resumes/{id}/warn")
    @ApiMessage("Cảnh cáo ứng viên vi phạm")
    @Operation(summary = "Cảnh cáo ứng viên", description = "Admin gửi cảnh cáo cho ứng viên. Đủ 2 cảnh cáo sẽ tự động khóa tài khoản.")
    public ResponseEntity<Void> warnCandidate(@PathVariable("id") long id) throws IdInvalidException, vn.demo.jobhunter.util.error.PermissionException {
        // CHECK ADMIN
        String email = SecurityUtil.getCurrentUserLogin().orElse("");
        User currentUser = this.userService.handleGetUserByUsername(email);
        if (currentUser == null || currentUser.getRole() == null || !currentUser.getRole().getName().equals("SUPER_ADMIN")) {
            throw new vn.demo.jobhunter.util.error.PermissionException("Bạn không có quyền thực hiện hành động này.");
        }

        this.resumeService.warnCandidate(id);
        return ResponseEntity.ok().body(null);
    }

    @PutMapping("/resumes/{id}/ban-user")
    @ApiMessage("Khóa tài khoản ứng viên")
    @Operation(summary = "Khóa tài khoản ứng viên", description = "Admin khóa vĩnh viễn tài khoản của ứng viên.")
    public ResponseEntity<Void> banUser(@PathVariable("id") long id) throws IdInvalidException, vn.demo.jobhunter.util.error.PermissionException {
        // CHECK ADMIN
        String email = SecurityUtil.getCurrentUserLogin().orElse("");
        User currentUser = this.userService.handleGetUserByUsername(email);
        if (currentUser == null || currentUser.getRole() == null || !currentUser.getRole().getName().equals("SUPER_ADMIN")) {
            throw new vn.demo.jobhunter.util.error.PermissionException("Bạn không có quyền thực hiện hành động này.");
        }

        this.resumeService.banUser(id);
        return ResponseEntity.ok().body(null);
    }

    @PutMapping("/resumes/{id}/dismiss-report")
    @ApiMessage("Bỏ qua báo cáo vi phạm")
    @Operation(summary = "Bỏ qua báo cáo vi phạm", description = "Admin bỏ qua báo cáo vi phạm của CV này.")
    public ResponseEntity<Void> dismissReport(@PathVariable("id") long id) throws IdInvalidException, vn.demo.jobhunter.util.error.PermissionException {
        // CHECK ADMIN
        String email = SecurityUtil.getCurrentUserLogin().orElse("");
        User currentUser = this.userService.handleGetUserByUsername(email);
        if (currentUser == null || currentUser.getRole() == null || !currentUser.getRole().getName().equals("SUPER_ADMIN")) {
            throw new vn.demo.jobhunter.util.error.PermissionException("Bạn không có quyền thực hiện hành động này.");
        }

        this.resumeService.dismissReport(id);
        return ResponseEntity.ok().body(null);
    }
}

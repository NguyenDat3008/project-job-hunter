package vn.demo.jobhunter.controller;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.turkraft.springfilter.boot.Filter;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import vn.demo.jobhunter.domain.Permission;
import vn.demo.jobhunter.domain.response.ResultPaginationDTO;
import vn.demo.jobhunter.service.PermissionService;
import vn.demo.jobhunter.util.annotation.ApiMessage;
import vn.demo.jobhunter.util.error.IdInvalidException;

/**
 * @controller PermissionController
 * @description API Quản lý Quyền hạn (Permission) - Chỉ SUPER_ADMIN mới có quyền
 */
@RestController
@RequestMapping("/api/v1")
@Tag(name = "Permission", description = "API Quản lý Quyền hạn (chỉ SUPER_ADMIN)")
public class PermissionController {

    private final PermissionService permissionService;

    public PermissionController(PermissionService permissionService) {
        this.permissionService = permissionService;
    }

    @PostMapping("/permissions")
    @ApiMessage("Create a permission")
    @Operation(summary = "Tạo quyền hạn mới", description = "Tạo Permission mới với API path, method và module")
    public ResponseEntity<Permission> create(@Valid @RequestBody @org.springframework.lang.NonNull Permission p) throws IdInvalidException {
        // check exist
        if (this.permissionService.isPermissionExist(p)) {
            throw new IdInvalidException("Permission đã tồn tại.");
        }

        // create new permission
        return ResponseEntity.status(HttpStatus.CREATED).body(this.permissionService.create(p));
    }

    @PutMapping("/permissions")
    @ApiMessage("Update a permission")
    @Operation(summary = "Cập nhật quyền hạn", description = "Sửa thông tin Permission theo ID")
    public ResponseEntity<Permission> update(@Valid @RequestBody @org.springframework.lang.NonNull Permission p) throws IdInvalidException {
        // check exist by id
        if (this.permissionService.fetchById(p.getId()) == null) {
            throw new IdInvalidException("Permission với id = " + p.getId() + " không tồn tại.");
        }

        // check exist by module, apiPath and method
        if (this.permissionService.isPermissionExist(p)) {
            // check name
            if (this.permissionService.isSameName(p)) {
                throw new IdInvalidException("Permission đã tồn tại.");
            }
        }

        // update permission
        return ResponseEntity.ok().body(this.permissionService.update(p));
    }

    @DeleteMapping("/permissions/{id}")
    @ApiMessage("delete a permission")
    @Operation(summary = "Xóa quyền hạn", description = "Xóa Permission khỏi hệ thống theo ID")
    public ResponseEntity<Void> delete(@PathVariable("id") long id) throws IdInvalidException {
        // check exist by id
        if (this.permissionService.fetchById(id) == null) {
            throw new IdInvalidException("Permission với id = " + id + " không tồn tại.");
        }
        this.permissionService.delete(id);
        return ResponseEntity.ok().body(null);
    }

    @GetMapping("/permissions")
    @ApiMessage("Fetch permissions")
    @Operation(summary = "Danh sách quyền hạn", description = "Lấy danh sách tất cả Permission với phân trang và bộ lọc")
    public ResponseEntity<ResultPaginationDTO> getPermissions(
            @Filter @org.springframework.lang.NonNull Specification<Permission> spec,
            @org.springframework.lang.NonNull Pageable pageable) {

        return ResponseEntity.ok(this.permissionService.getPermissions(spec, pageable));
    }
}

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
import vn.demo.jobhunter.domain.Role;
import vn.demo.jobhunter.domain.response.ResultPaginationDTO;
import vn.demo.jobhunter.service.RoleService;
import vn.demo.jobhunter.util.annotation.ApiMessage;
import vn.demo.jobhunter.util.error.IdInvalidException;

/**
 * @controller RoleController
 * @description API Quản lý Vai trò (Role) - Chỉ SUPER_ADMIN mới có quyền
 */
@RestController
@RequestMapping("/api/v1")
@Tag(name = "Role", description = "API Quản lý Vai trò (chỉ SUPER_ADMIN)")
public class RoleController {

    private final RoleService roleService;

    public RoleController(RoleService roleService) {
        this.roleService = roleService;
    }

    @PostMapping("/roles")
    @ApiMessage("Create a role")
    @Operation(summary = "Tạo vai trò mới", description = "Tạo Role mới với danh sách Permission tương ứng")
    public ResponseEntity<Role> create(@Valid @RequestBody Role r) throws IdInvalidException {
        // check name
        if (this.roleService.existByName(r.getName())) {
            throw new IdInvalidException("Role với name = " + r.getName() + " đã tồn tại");
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(this.roleService.create(r));
    }

    @PutMapping("/roles")
    @ApiMessage("Update a role")
    @Operation(summary = "Cập nhật vai trò", description = "Sửa thông tin Role và danh sách Permission")
    public ResponseEntity<Role> update(@Valid @RequestBody Role r) throws IdInvalidException {
        // check id
        if (this.roleService.fetchById(r.getId()) == null) {
            throw new IdInvalidException("Role với id = " + r.getId() + " không tồn tại");
        }

        // check name
        // if (this.roleService.existByName(r.getName())) {
        // throw new IdInvalidException("Role với name = " + r.getName() + " đã tồn
        // tại");
        // }

        return ResponseEntity.ok().body(this.roleService.update(r));
    }

    @DeleteMapping("/roles/{id}")
    @ApiMessage("Delete a role")
    @Operation(summary = "Xóa vai trò", description = "Xóa Role khỏi hệ thống theo ID")
    public ResponseEntity<Void> delete(@PathVariable("id") long id) throws IdInvalidException {
        // check id
        if (this.roleService.fetchById(id) == null) {
            throw new IdInvalidException("Role với id = " + id + " không tồn tại");
        }
        this.roleService.delete(id);
        return ResponseEntity.ok().body(null);
    }

    @GetMapping("/roles")
    @ApiMessage("Fetch roles")
    @Operation(summary = "Danh sách vai trò", description = "Lấy danh sách tất cả Role với phân trang")
    public ResponseEntity<ResultPaginationDTO> getPermissions(
            @Filter Specification<Role> spec, Pageable pageable) {

        return ResponseEntity.ok(this.roleService.getRoles(spec, pageable));
    }

    @GetMapping("/roles/{id}")
    @ApiMessage("Fetch role by id")
    @Operation(summary = "Chi tiết vai trò", description = "Xem thông tin chi tiết của một Role theo ID")
    public ResponseEntity<Role> getById(@PathVariable("id") long id) throws IdInvalidException {

        Role role = this.roleService.fetchById(id);
        if (role == null) {
            throw new IdInvalidException("Resume với id = " + id + " không tồn tại");
        }

        return ResponseEntity.ok().body(role);
    }

}

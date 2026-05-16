package vn.demo.jobhunter.controller;

import java.util.Optional;
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
import vn.demo.jobhunter.domain.Blog;
import vn.demo.jobhunter.domain.response.ResultPaginationDTO;
import vn.demo.jobhunter.service.BlogService;
import vn.demo.jobhunter.util.annotation.ApiMessage;
import vn.demo.jobhunter.util.error.IdInvalidException;

@RestController
@RequestMapping("/api/v1")
@Tag(name = "Blog", description = "API Quản lý Blog/Tin tức")
public class BlogController {

    private final BlogService blogService;

    public BlogController(BlogService blogService) {
        this.blogService = blogService;
    }

    @PostMapping("/blogs")
    @ApiMessage("Create a blog")
    @Operation(summary = "Tạo mới bài viết blog", description = "Tạo bài viết mới (Admin)")
    public ResponseEntity<Blog> create(@Valid @RequestBody Blog blog) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(this.blogService.create(blog));
    }

    @PutMapping("/blogs")
    @ApiMessage("Update a blog")
    @Operation(summary = "Cập nhật bài viết blog", description = "Sửa thông tin bài viết (Admin)")
    public ResponseEntity<Blog> update(@Valid @RequestBody Blog blog) throws IdInvalidException {
        Blog currentBlog = this.blogService.update(blog);
        if (currentBlog == null) {
            throw new IdInvalidException("Blog id không tồn tại");
        }
        return ResponseEntity.ok().body(currentBlog);
    }

    @DeleteMapping("/blogs/{id}")
    @ApiMessage("Delete a blog by id")
    @Operation(summary = "Xóa bài viết blog", description = "Xóa bài viết theo ID (Admin)")
    public ResponseEntity<Void> delete(@PathVariable("id") long id) throws IdInvalidException {
        Optional<Blog> blogOptional = this.blogService.fetchById(id);
        if (!blogOptional.isPresent()) {
            throw new IdInvalidException("Blog id không tồn tại");
        }
        this.blogService.delete(id);
        return ResponseEntity.ok().body(null);
    }

    @GetMapping("/blogs/{id}")
    @ApiMessage("Get a blog by id")
    @Operation(summary = "Lấy chi tiết bài viết blog", description = "Xem thông tin chi tiết bài viết")
    public ResponseEntity<Blog> getBlog(@PathVariable("id") long id) throws IdInvalidException {
        Optional<Blog> blogOptional = this.blogService.fetchById(id);
        if (!blogOptional.isPresent()) {
            throw new IdInvalidException("Blog id không tồn tại");
        }
        return ResponseEntity.ok().body(blogOptional.get());
    }

    @GetMapping("/blogs")
    @ApiMessage("Get blogs with pagination")
    @Operation(summary = "Danh sách bài viết blog", description = "Lấy danh sách bài viết với phân trang và bộ lọc")
    public ResponseEntity<ResultPaginationDTO> getAllBlog(
            @Filter Specification<Blog> spec,
            Pageable pageable) {
        return ResponseEntity.ok().body(this.blogService.fetchAll(spec, pageable));
    }
}

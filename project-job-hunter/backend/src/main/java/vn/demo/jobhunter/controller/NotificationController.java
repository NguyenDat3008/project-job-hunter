package vn.demo.jobhunter.controller;

import org.springframework.data.domain.Pageable;
import vn.demo.jobhunter.domain.response.ResultPaginationDTO;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import vn.demo.jobhunter.domain.Notification;
import vn.demo.jobhunter.domain.User;
import vn.demo.jobhunter.service.NotificationService;
import vn.demo.jobhunter.service.UserService;
import vn.demo.jobhunter.util.SecurityUtil;
import vn.demo.jobhunter.util.annotation.ApiMessage;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

/**
 * @controller NotificationController
 * @description API Quản lý Thông báo - Xem, đánh dấu đã đọc
 */
@RestController
@RequestMapping("/api/v1")
@Tag(name = "Notification", description = "API Quản lý Thông báo")
public class NotificationController {
    
    private final NotificationService notificationService;
    private final UserService userService;

    public NotificationController(NotificationService notificationService, UserService userService) {
        this.notificationService = notificationService;
        this.userService = userService;
    }

    @GetMapping("/notifications")
    @ApiMessage("Get notifications for user")
    @Operation(summary = "Xem thông báo", description = "Lấy danh sách tất cả thông báo của người dùng hiện tại")
    public ResponseEntity<ResultPaginationDTO> getNotifications(
            Pageable pageable) {
        String email = SecurityUtil.getCurrentUserLogin().orElse("");
        User currentUser = this.userService.handleGetUserByUsername(email);
        
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        org.springframework.data.domain.Page<Notification> pNotification = this.notificationService.fetchByUser(currentUser, pageable);
        
        ResultPaginationDTO rs = new ResultPaginationDTO();
        ResultPaginationDTO.Meta mt = new ResultPaginationDTO.Meta();
        mt.setPage(pageable.getPageNumber() + 1);
        mt.setPageSize(pageable.getPageSize());
        mt.setPages(pNotification.getTotalPages());
        mt.setTotal(pNotification.getTotalElements());
        rs.setMeta(mt);
        rs.setResult(pNotification.getContent());

        return ResponseEntity.ok().body(rs);
    }

    @GetMapping("/notifications/unread")
    @ApiMessage("Count unread notifications")
    @Operation(summary = "Đếm thông báo chưa đọc", description = "Trả về số lượng thông báo chưa đọc")
    public ResponseEntity<Long> countUnread() {
        String email = SecurityUtil.getCurrentUserLogin().orElse("");
        User currentUser = this.userService.handleGetUserByUsername(email);
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok().body(this.notificationService.countUnread(currentUser));
    }

    @PostMapping("/notifications/{id}/read")
    @ApiMessage("Mark notification as read")
    @Operation(summary = "Đánh dấu đã đọc", description = "Đánh dấu một thông báo cụ thể là đã đọc")
    public ResponseEntity<Void> markRead(@PathVariable("id") long id) {
        this.notificationService.markAsRead(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/notifications/read-all")
    @ApiMessage("Mark all notifications as read")
    @Operation(summary = "Đánh dấu tất cả đã đọc", description = "Đánh dấu toàn bộ thông báo là đã đọc")
    public ResponseEntity<Void> markAllRead() {
        String email = SecurityUtil.getCurrentUserLogin().orElse("");
        User currentUser = this.userService.handleGetUserByUsername(email);
        if (currentUser != null) {
            this.notificationService.markAllAsRead(currentUser);
        }
        return ResponseEntity.ok().build();
    }

    @PostMapping("/notifications/broadcast")
    @ApiMessage("Broadcast notification to all users or specific role")
    @Operation(summary = "Gửi thông báo toàn hệ thống", description = "Admin gửi thông báo cho tất cả hoặc nhóm đối tượng")
    public ResponseEntity<Void> broadcast(@jakarta.validation.Valid @org.springframework.web.bind.annotation.RequestBody BroadcastRequest req) {
        this.notificationService.broadcastNotification(req.getTitle(), req.getBody(), "SYSTEM", req.getRoleName());
        return ResponseEntity.ok().build();
    }

    @lombok.Getter
    @lombok.Setter
    public static class BroadcastRequest {
        @jakarta.validation.constraints.NotBlank(message = "Title không được để trống")
        private String title;
        @jakarta.validation.constraints.NotBlank(message = "Body không được để trống")
        private String body;
        private String roleName; // Có thể null để gửi cho tất cả
    }
}

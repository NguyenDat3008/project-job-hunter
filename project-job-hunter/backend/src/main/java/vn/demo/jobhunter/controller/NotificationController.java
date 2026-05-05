package vn.demo.jobhunter.controller;

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

@RestController
@RequestMapping("/api/v1")
public class NotificationController {
    
    private final NotificationService notificationService;
    private final UserService userService;

    public NotificationController(NotificationService notificationService, UserService userService) {
        this.notificationService = notificationService;
        this.userService = userService;
    }

    @GetMapping("/notifications")
    @ApiMessage("Get notifications for user")
    public ResponseEntity<List<Notification>> getNotifications() {
        String email = SecurityUtil.getCurrentUserLogin().orElse("");
        User currentUser = this.userService.handleGetUserByUsername(email);
        
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        return ResponseEntity.ok().body(this.notificationService.fetchByUser(currentUser));
    }

    @GetMapping("/notifications/unread")
    @ApiMessage("Count unread notifications")
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
    public ResponseEntity<Void> markRead(@PathVariable("id") long id) {
        this.notificationService.markAsRead(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/notifications/read-all")
    @ApiMessage("Mark all notifications as read")
    public ResponseEntity<Void> markAllRead() {
        String email = SecurityUtil.getCurrentUserLogin().orElse("");
        User currentUser = this.userService.handleGetUserByUsername(email);
        if (currentUser != null) {
            this.notificationService.markAllAsRead(currentUser);
        }
        return ResponseEntity.ok().build();
    }
}

package vn.demo.jobhunter.service;

import org.springframework.stereotype.Service;
import vn.demo.jobhunter.domain.Notification;
import vn.demo.jobhunter.domain.User;
import vn.demo.jobhunter.repository.NotificationRepository;

@Service
public class NotificationService {
    private final NotificationRepository notificationRepository;
    private final vn.demo.jobhunter.repository.UserRepository userRepository;

    public NotificationService(
            NotificationRepository notificationRepository,
            vn.demo.jobhunter.repository.UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    public void createNotification(User user, String title, String body, String type) {
        this.createNotification(user, title, body, type, null);
    }

    public void createNotification(User user, String title, String body, String type, String data) {
        if (user == null) return;
        Notification notification = new Notification();
        notification.setUser(user);
        notification.setTitle(title);
        notification.setBody(body);
        notification.setType(type);
        notification.setData(data);
        this.notificationRepository.save(notification);
    }

    /**
     * Gửi thông báo cho nhiều người dùng dựa trên Role
     * @param roleName Tên role (SUPER_ADMIN, COMPANY_REPRESENTATIVE, NORMAL_USER). Nếu null thì gửi cho tất cả.
     */
    public void broadcastNotification(String title, String body, String type, String roleName) {
        java.util.List<User> targets;
        if (roleName != null && !roleName.isEmpty()) {
            targets = this.userRepository.findByRoleName(roleName);
        } else {
            targets = this.userRepository.findAll();
        }

        java.util.List<Notification> notifications = new java.util.ArrayList<>();
        for (User user : targets) {
            Notification notification = new Notification();
            notification.setUser(user);
            notification.setTitle(title);
            notification.setBody(body);
            notification.setType(type);
            notifications.add(notification);
        }
        this.notificationRepository.saveAll(notifications);
    }

    public org.springframework.data.domain.Page<Notification> fetchByUser(
            @org.springframework.lang.NonNull User user,
            @org.springframework.lang.NonNull org.springframework.data.domain.Pageable pageable) {
        return this.notificationRepository.findAll((root, query, criteriaBuilder) -> 
            criteriaBuilder.equal(root.get("user"), user), pageable);
    }

    public long countUnread(User user) {
        return this.notificationRepository.countByUserAndIsRead(user, false);
    }

    public void markAsRead(long id) {
        java.util.Optional<Notification> notificationOptional = this.notificationRepository.findById(id);
        if (notificationOptional.isPresent()) {
            Notification notification = notificationOptional.get();
            notification.setRead(true);
            this.notificationRepository.save(notification);
        }
    }

    public void markAllAsRead(User user) {
        java.util.List<Notification> notifications = this.notificationRepository.findByUserAndIsRead(user, false);
        for (Notification notification : notifications) {
            notification.setRead(true);
        }
        if (!notifications.isEmpty()) {
            this.notificationRepository.saveAll(notifications);
        }
    }
}

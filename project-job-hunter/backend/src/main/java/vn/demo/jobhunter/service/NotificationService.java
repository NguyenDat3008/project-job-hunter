package vn.demo.jobhunter.service;

import org.springframework.stereotype.Service;
import vn.demo.jobhunter.domain.Notification;
import vn.demo.jobhunter.domain.User;
import vn.demo.jobhunter.repository.NotificationRepository;

@Service
public class NotificationService {
    private final NotificationRepository notificationRepository;

    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    public void createNotification(User user, String content, String type) {
        Notification notification = new Notification();
        notification.setUser(user);
        notification.setContent(content);
        notification.setType(type);
        this.notificationRepository.save(notification);
    }

    public java.util.List<Notification> fetchByUser(User user) {
        return this.notificationRepository.findByUser(user);
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
        this.notificationRepository.saveAll(notifications);
    }
}

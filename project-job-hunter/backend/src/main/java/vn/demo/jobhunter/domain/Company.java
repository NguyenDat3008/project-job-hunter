package vn.demo.jobhunter.domain;

import java.time.Instant;
import java.util.List;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

// === GIẢI THÍCH CHO BÁO CÁO ===
// @Entity: Đánh dấu class này tương ứng với 1 bảng trong Database MySQL
// @Table(name = "companies"): Tên bảng trong DB là "companies"
// @Getter @Setter: Thư viện Lombok tự tạo hàm get/set cho tất cả field
@Entity
@Table(name = "companies")
@Getter
@Setter
public class Company {

    // @Id: Đánh dấu đây là Primary Key
    // @GeneratedValue: Tự động tăng (Auto Increment) trong MySQL
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    // @NotBlank: Không cho phép để trống khi gửi request tạo mới
    @NotBlank(message = "name không được để trống")
    private String name;

    // @Column(columnDefinition = "MEDIUMTEXT"): Cho phép lưu text dài trong MySQL
    @Column(columnDefinition = "MEDIUMTEXT")
    private String description;

    private String address;
    private String logo;

    // Các trường theo dõi thời gian tạo và cập nhật
    private Instant createdAt;
    private Instant updatedAt;
    private String createdBy;
    private String updatedBy;

    @OneToMany(mappedBy = "company")
    List<Job> jobs;

    // === GIẢI THÍCH CHO BÁO CÁO ===
    // @PrePersist: Hàm này TỰ ĐỘNG chạy TRƯỚC KHI entity được lưu vào DB lần đầu
    // Mục đích: Tự động ghi lại thời điểm tạo record
    @PrePersist
    public void handleBeforeCreate() {
        this.createdAt = Instant.now();
    }

    // @PreUpdate: Hàm này TỰ ĐỘNG chạy TRƯỚC KHI entity được cập nhật trong DB
    @PreUpdate
    public void handleBeforeUpdate() {
        this.updatedAt = Instant.now();
    }
}

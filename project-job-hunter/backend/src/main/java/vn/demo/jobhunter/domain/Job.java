package vn.demo.jobhunter.domain;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

// === GIẢI THÍCH CHO BÁO CÁO ===
// Entity Job đại diện cho bảng "jobs" trong Database
// Một Job THUỘC VỀ một Company (quan hệ nhiều - một / ManyToOne)
@Entity
@Table(name = "jobs")
@Getter
@Setter
public class Job {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    @NotBlank(message = "name không được để trống")
    private String name;

    @NotBlank(message = "location không được để trống")
    private String location;

    private double salary;

    private int quantity;

    @Column(columnDefinition = "MEDIUMTEXT")
    private String description;

    private Instant startDate;
    private Instant endDate;
    private boolean active;

    private Instant createdAt;
    private Instant updatedAt;
    private String createdBy;
    private String updatedBy;

    // === GIẢI THÍCH CHO BÁO CÁO (QUAN TRỌNG!) ===
    // @ManyToOne: Quan hệ Nhiều-Một. Nghĩa là: NHIỀU Job có thể thuộc về MỘT Company
    // @JoinColumn(name = "company_id"): Tạo cột "company_id" trong bảng "jobs" làm KHÓA NGOẠI (Foreign Key)
    //   trỏ về cột "id" của bảng "companies"
    // 
    // Ví dụ trong Database:
    //   Bảng jobs:    | id=1 | name="Dev React" | company_id=1 |
    //   Bảng companies: | id=1 | name="FPT Software" |
    //   => Job "Dev React" thuộc về company "FPT Software"
    @ManyToOne
    @JoinColumn(name = "company_id")
    private Company company;

    @PrePersist
    public void handleBeforeCreate() {
        this.createdAt = Instant.now();
    }

    @PreUpdate
    public void handleBeforeUpdate() {
        this.updatedAt = Instant.now();
    }
}

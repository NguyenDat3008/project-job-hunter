package vn.demo.jobhunter.domain.response.job;

import java.time.Instant;
import lombok.Getter;
import lombok.Setter;

// DTO trả về sau khi CẬP NHẬT Job thành công
@Getter
@Setter
public class ResUpdateJobDTO {
    private long id;
    private String name;
    private String location;
    private double salary;
    private int quantity;
    private Instant startDate;
    private Instant endDate;
    private boolean isActive;
    private Instant updatedAt;
    private String updatedBy;
}

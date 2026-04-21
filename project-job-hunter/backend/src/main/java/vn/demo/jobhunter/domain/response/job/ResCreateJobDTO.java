package vn.demo.jobhunter.domain.response.job;

import java.time.Instant;
import lombok.Getter;
import lombok.Setter;

// DTO trả về sau khi TẠO Job thành công
// Chỉ chứa những trường cần thiết, không trả toàn bộ Entity
@Getter
@Setter
public class ResCreateJobDTO {
    private long id;
    private String name;
    private String location;
    private double salary;
    private int quantity;
    private Instant startDate;
    private Instant endDate;
    private boolean isActive;
    private Instant createdAt;
    private String createdBy;
}

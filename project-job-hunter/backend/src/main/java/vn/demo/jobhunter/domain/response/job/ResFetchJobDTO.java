package vn.demo.jobhunter.domain.response.job;

import java.time.Instant;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import vn.demo.jobhunter.util.constant.LevelEnum;

@Getter
@Setter
@NoArgsConstructor
public class ResFetchJobDTO {
    private long id;
    private String name;
    private String location;
    private double salary;
    private int quantity;
    private LevelEnum level;
    private String description;
    private String requirements;
    private String benefits;
    private String workingTime;
    private Instant startDate;
    private Instant endDate;
    private boolean active;
    private Boolean isPremium;
    private Boolean isUrgent;
    private Long viewCount;
    private Long applicantCount;
    private Boolean isSaved;
    private Boolean isApplied;
    private List<JobSkill> requiredSkills;
    private List<JobSkill> preferredSkills;
    private CompanyJob company;
    private Instant createdAt;
    private Instant updatedAt;
    private String createdBy;
    private String updatedBy;

    private Boolean isReported;
    private String reportReason;
    private String reportedBy;
    private java.time.Instant reportedAt;

    @Getter
    @Setter
    @AllArgsConstructor
    @NoArgsConstructor
    public static class CompanyJob {
        private long id;
        private String name;
        private String logo;
    }

    @Getter
    @Setter
    @AllArgsConstructor
    @NoArgsConstructor
    public static class JobSkill {
        private long id;
        private String name;
    }
}

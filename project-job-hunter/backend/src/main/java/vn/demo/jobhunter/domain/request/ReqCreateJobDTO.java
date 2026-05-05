package vn.demo.jobhunter.domain.request;

import java.time.Instant;
import java.util.List;
import lombok.Getter;
import lombok.Setter;
import vn.demo.jobhunter.util.constant.LevelEnum;

@Getter
@Setter
public class ReqCreateJobDTO {
    private String name;
    private String location;
    private double salary;
    private int quantity;
    private LevelEnum level;
    private String description;
    private Instant startDate;
    private Instant endDate;
    private List<Long> skills;
    private CompanyJob company;

    @Getter
    @Setter
    public static class CompanyJob {
        private long id;
    }
}

package vn.demo.jobhunter.domain.request.resume;

import lombok.Getter;
import lombok.Setter;
import vn.demo.jobhunter.util.constant.ResumeStateEnum;

@Getter
@Setter
public class ReqUpdateResumeDTO {
    private long id;
    private ResumeStateEnum status;
    private String message;
}

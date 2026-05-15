package vn.demo.jobhunter.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import vn.demo.jobhunter.domain.Subscriber;
import vn.demo.jobhunter.service.SubscriberService;
import vn.demo.jobhunter.util.SecurityUtil;
import vn.demo.jobhunter.util.annotation.ApiMessage;
import vn.demo.jobhunter.util.error.IdInvalidException;
import vn.demo.jobhunter.service.MatchScoreService;
import org.springframework.web.bind.annotation.RequestParam;
import java.util.Map;

/**
 * @controller SubscriberController
 * @description API Quản lý Người theo dõi - Đăng ký nhận thông báo việc làm theo kỹ năng
 */
@RestController
@RequestMapping("/api/v1")
@Tag(name = "Subscriber", description = "API Đăng ký nhận việc làm theo kỹ năng")
public class SubscriberController {
    private final SubscriberService subscriberService;
    private final MatchScoreService matchScoreService;

    public SubscriberController(SubscriberService subscriberService, MatchScoreService matchScoreService) {
        this.subscriberService = subscriberService;
        this.matchScoreService = matchScoreService;
    }

    @PostMapping("/subscribers")
    @ApiMessage("Create a subscriber")
    @Operation(summary = "Tạo subscriber", description = "Đăng ký nhận thông báo việc làm với danh sách kỹ năng quan tâm")
    public ResponseEntity<Subscriber> create(@Valid @RequestBody Subscriber sub) throws IdInvalidException {
        // check email
        boolean isExist = this.subscriberService.isExistsByEmail(sub.getEmail());
        if (isExist == true) {
            throw new IdInvalidException("Email " + sub.getEmail() + " đã tồn tại");
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(this.subscriberService.create(sub));
    }

    @PutMapping("/subscribers")
    @ApiMessage("Update a subscriber")
    @Operation(summary = "Cập nhật subscriber", description = "Thay đổi danh sách kỹ năng quan tâm của subscriber")
    public ResponseEntity<Subscriber> update(@RequestBody Subscriber subsRequest) throws IdInvalidException {
        // check id
        Subscriber subsDB = this.subscriberService.findById(subsRequest.getId());
        if (subsDB == null) {
            throw new IdInvalidException("Id " + subsRequest.getId() + " không tồn tại");
        }
        return ResponseEntity.ok().body(this.subscriberService.update(subsDB, subsRequest));
    }

    @PostMapping("/subscribers/skills")
    @ApiMessage("Get subscriber's skill")
    @Operation(summary = "Xem kỹ năng của tôi", description = "Lấy danh sách kỹ năng mà người dùng đã đăng ký theo dõi")
    public ResponseEntity<Subscriber> getSubscribersSkill() throws IdInvalidException {
        String email = SecurityUtil.getCurrentUserLogin().isPresent() == true
                ? SecurityUtil.getCurrentUserLogin().get()
                : "";

        Subscriber sub = this.subscriberService.findByEmail(email);
        if (sub == null) {
            // Tự động tạo mới nếu chưa có
            sub = new Subscriber();
            sub.setEmail(email);
            sub.setName(email.split("@")[0]); // Tạm lấy phần trước @ làm tên
            sub = this.subscriberService.create(sub);
        }

        return ResponseEntity.ok().body(sub);
    }

    @PostMapping("/subscribers/scan-cv")
    @ApiMessage("Scan CV and extract skills")
    public ResponseEntity<Map<String, Object>> scanCV(@RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        return ResponseEntity.ok().body(this.matchScoreService.extractSkillsFromCV(file));
    }
}

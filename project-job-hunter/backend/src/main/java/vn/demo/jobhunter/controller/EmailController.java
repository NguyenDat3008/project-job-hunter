package vn.demo.jobhunter.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import vn.demo.jobhunter.service.SubscriberService;
import vn.demo.jobhunter.util.annotation.ApiMessage;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

/**
 * @controller EmailController
 * @description API Gửi Email - Gửi thông báo việc làm qua email cho subscriber
 */
@RestController
@RequestMapping("/api/v1")
@Tag(name = "Email", description = "API Gửi Email thông báo việc làm")
public class EmailController {

    private final SubscriberService subscriberService;

    public EmailController(SubscriberService subscriberService) {
        this.subscriberService = subscriberService;
    }

    @GetMapping("/email")
    @ApiMessage("Send simple email")
    @Operation(summary = "Gửi email thông báo", description = "Gửi email việc làm phù hợp cho tất cả subscriber đã đăng ký")

    public String sendSimpleEmail() {
        this.subscriberService.sendSubscribersEmailJobs();
        return "ok";
    }
}

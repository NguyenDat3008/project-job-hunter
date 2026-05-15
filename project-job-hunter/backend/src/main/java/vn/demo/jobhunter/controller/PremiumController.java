package vn.demo.jobhunter.controller;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import vn.demo.jobhunter.domain.Company;
import vn.demo.jobhunter.domain.User;
import vn.demo.jobhunter.service.PremiumService;
import vn.demo.jobhunter.service.UserService;
import vn.demo.jobhunter.util.SecurityUtil;
import vn.demo.jobhunter.util.annotation.ApiMessage;

@RestController
@RequestMapping("/api/v1/premium")
@Tag(name = "Premium", description = "API Quản lý gói Premium cho nhà tuyển dụng")
public class PremiumController {

    private final UserService userService;
    private final PremiumService premiumService;

    public PremiumController(UserService userService, PremiumService premiumService) {
        this.userService = userService;
        this.premiumService = premiumService;
    }

    @GetMapping("/packages")
    @ApiMessage("Get premium packages")
    @Operation(summary = "Danh sách gói Premium", description = "Trả về các gói premium có thể đăng ký")
    public ResponseEntity<List<Map<String, Object>>> getPackages() {
        List<Map<String, Object>> packages = new ArrayList<>();

        Map<String, Object> basic = new HashMap<>();
        basic.put("id", 1);
        basic.put("name", "Nổi bật");
        basic.put("price", 1000000);
        basic.put("description", "Làm nổi bật tin tuyển dụng trong 30 ngày");
        basic.put("duration", 30);

        Map<String, Object> pro = new HashMap<>();
        pro.put("id", 2);
        pro.put("name", "Pro");
        pro.put("price", 3000000);
        pro.put("isPopular", true);
        pro.put("description", "Ưu tiên hiển thị + badge Pro trong 30 ngày");
        pro.put("duration", 30);

        packages.add(basic);
        packages.add(pro);

        return ResponseEntity.ok(packages);
    }

    @PostMapping("/subscribe/{tier}")
    @ApiMessage("Subscribe to a premium package")
    @Operation(summary = "Đăng ký gói Premium", description = "Nâng cấp công ty lên gói Premium (Basic / Pro)")
    public ResponseEntity<String> subscribePremium(@PathVariable("tier") String tier) {
        String email = SecurityUtil.getCurrentUserLogin().orElse("");
        User currentUser = this.userService.handleGetUserByUsername(email);

        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Bạn chưa đăng nhập.");
        }

        if (currentUser.getCompany() == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Chỉ tài khoản công ty mới có thể đăng ký gói Premium.");
        }

        // Validate tier
        String upperTier = tier.toUpperCase();
        if (!upperTier.equals("BASIC") && !upperTier.equals("PRO") && !upperTier.equals("ENTERPRISE")) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Gói không hợp lệ. Chọn: BASIC, PRO hoặc ENTERPRISE.");
        }

        Company company = currentUser.getCompany();
        int days = upperTier.equals("ENTERPRISE") ? 365 : 30;
        this.premiumService.subscribePremium(company, upperTier, days);

        return ResponseEntity.ok("Đăng ký thành công gói " + upperTier + " trong " + days + " ngày!");
    }
}

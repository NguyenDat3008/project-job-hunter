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
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.fasterxml.jackson.databind.ObjectMapper;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import vn.demo.jobhunter.domain.Company;
import vn.demo.jobhunter.domain.Order;
import vn.demo.jobhunter.domain.User;
import vn.demo.jobhunter.service.PaymentService;
import vn.demo.jobhunter.service.UserService;
import vn.demo.jobhunter.util.SecurityUtil;
import vn.demo.jobhunter.util.annotation.ApiMessage;

@RestController
@RequestMapping("/api/v1/payment")
@Tag(name = "Payment", description = "API Thanh toán Premium với VietQR + HMAC")
public class PaymentController {

    private final PaymentService paymentService;
    private final UserService userService;
    private final ObjectMapper objectMapper;

    public PaymentController(PaymentService paymentService, UserService userService) {
        this.paymentService = paymentService;
        this.userService = userService;
        this.objectMapper = new ObjectMapper();
    }

    @GetMapping("/packages")
    @ApiMessage("Get payment packages")
    @Operation(summary = "Danh sách gói Premium", description = "Trả về các gói premium có thể đăng ký")
    public ResponseEntity<List<Map<String, Object>>> getPackages() {
        List<Map<String, Object>> packages = new ArrayList<>();

        Map<String, Object> monthly = new HashMap<>();
        monthly.put("id", "MONTHLY");
        monthly.put("name", "Gói Tháng");
        monthly.put("price", 50000);
        monthly.put("description", "Premium 30 ngày – Nổi bật tin tuyển dụng");
        monthly.put("duration", 30);
        monthly.put("durationUnit", "days");

        Map<String, Object> yearly = new HashMap<>();
        yearly.put("id", "YEARLY");
        yearly.put("name", "Gói Năm");
        yearly.put("price", 499000);
        yearly.put("description", "Premium 365 ngày – Ưu tiên hiển thị + badge Pro");
        yearly.put("duration", 365);
        yearly.put("durationUnit", "days");
        yearly.put("isPopular", true);

        packages.add(monthly);
        packages.add(yearly);

        return ResponseEntity.ok(packages);
    }

    @PostMapping("/create-order")
    @ApiMessage("Create payment order")
    @Operation(summary = "Tạo đơn thanh toán", description = "Tạo đơn và nhận QR code để thanh toán")
    public ResponseEntity<?> createOrder(@RequestBody Map<String, String> body) {
        try {
            // 1. Lấy user hiện tại
            String email = SecurityUtil.getCurrentUserLogin().orElse("");
            User currentUser = this.userService.handleGetUserByUsername(email);

            if (currentUser == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Bạn chưa đăng nhập."));
            }

            if (currentUser.getCompany() == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Chỉ tài khoản công ty mới có thể mua gói Premium."));
            }

            // 2. Validate tier
            String tier = body.get("tier");
            if (tier == null || (!tier.equalsIgnoreCase("MONTHLY") && !tier.equalsIgnoreCase("YEARLY"))) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Gói không hợp lệ. Chọn: MONTHLY hoặc YEARLY."));
            }

            // 3. Tạo Order + gọi Gateway
            Company company = currentUser.getCompany();
            Order order = this.paymentService.createOrder(currentUser, company, tier);

            // 4. Trả response
            Map<String, Object> response = new HashMap<>();
            response.put("orderCode", order.getOrderCode());
            response.put("billId", order.getBillId());
            response.put("amount", order.getAmount());
            response.put("tier", order.getTier());
            response.put("qrUrl", order.getQrUrl());
            response.put("status", order.getStatus());
            response.put("expiredAt", order.getExpiredAt() != null ? order.getExpiredAt().toString() : null);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Lỗi tạo đơn thanh toán: " + e.getMessage()));
        }
    }

    @PostMapping("/callback")
    @ApiMessage("Payment callback from Gateway")
    @Operation(summary = "Callback thanh toán", description = "Gateway gọi khi thanh toán thành công (HMAC)")
    public ResponseEntity<?> paymentCallback(
            @RequestBody String body,
            @RequestHeader(value = "X-Signature", required = false) String signature,
            @RequestHeader(value = "X-Timestamp", required = false) String timestamp) {
        try {
            // Validate headers
            if (signature == null || timestamp == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Missing HMAC headers"));
            }

            // Xử lý callback (verify HMAC + kích hoạt Premium)
            this.paymentService.handleCallback(body, signature, timestamp);

            System.out.println("[BE] ✅ Payment callback processed successfully");
            return ResponseEntity.ok(Map.of("message", "Callback processed successfully"));

        } catch (Exception e) {
            System.out.println("[BE] ❌ Payment callback error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/status/{orderCode}")
    @ApiMessage("Get order status")
    @Operation(summary = "Kiểm tra trạng thái đơn", description = "FE polling để biết đã thanh toán chưa")
    public ResponseEntity<?> getOrderStatus(@PathVariable String orderCode) {
        Order order = this.paymentService.getOrderByCode(orderCode);

        if (order == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Order not found"));
        }

        Map<String, Object> response = new HashMap<>();
        response.put("orderCode", order.getOrderCode());
        response.put("status", order.getStatus());
        response.put("amount", order.getAmount());
        response.put("tier", order.getTier());
        response.put("paidAt", order.getPaidAt() != null ? order.getPaidAt().toString() : null);

        return ResponseEntity.ok(response);
    }

    // === MOCK GATEWAY ENDPOINTS (FOR TESTING) ===

    @PostMapping("/mock/gw/create-bill")
    @Operation(summary = "Mock Gateway: Tạo hóa đơn", description = "Giả lập cổng thanh toán VNPay/VietQR")
    public ResponseEntity<?> mockCreateBill(@RequestBody Map<String, Object> body) {
        String orderId = (String) body.get("orderId");
        Map<String, Object> data = new HashMap<>();
        data.put("billId", "BILL-" + System.currentTimeMillis());
        data.put("qrUrl", "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=" + orderId);
        data.put("expiredAt", java.time.Instant.now().plusSeconds(600).toString());

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", data);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/mock/simulate-success/{orderCode}")
    @Operation(summary = "Mock: Giả lập thanh toán thành công", description = "Gọi callback để kích hoạt Premium cho một đơn hàng")
    public ResponseEntity<?> simulateSuccess(@PathVariable String orderCode) {
        Order order = this.paymentService.getOrderByCode(orderCode);
        if (order == null) return ResponseEntity.status(404).body("Order not found");

        try {
            Map<String, Object> callbackData = new HashMap<>();
            callbackData.put("billId", order.getBillId());
            callbackData.put("orderId", order.getOrderCode());
            callbackData.put("status", "PAID");

            String bodyJson = objectMapper.writeValueAsString(callbackData);
            String secret = "jobhunter_secret_key_2026"; // Match application.properties
            String signature = vn.demo.jobhunter.util.HmacUtil.sign(secret, bodyJson);

            return this.paymentCallback(bodyJson, signature, String.valueOf(System.currentTimeMillis()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
        }
    }
}

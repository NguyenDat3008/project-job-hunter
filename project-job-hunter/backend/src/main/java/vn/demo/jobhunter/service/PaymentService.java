package vn.demo.jobhunter.service;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import vn.demo.jobhunter.domain.Company;
import vn.demo.jobhunter.domain.Order;
import vn.demo.jobhunter.domain.User;
import vn.demo.jobhunter.repository.OrderRepository;
import vn.demo.jobhunter.util.HmacUtil;

@Service
public class PaymentService {

    private final OrderRepository orderRepository;
    private final PremiumService premiumService;
    private final vn.demo.jobhunter.repository.UserRepository userRepository;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;

    @Value("${payment.gateway.url}")
    private String gatewayUrl;

    @Value("${payment.gateway.shared-secret}")
    private String sharedSecret;

    @Value("${payment.gateway.callback-url}")
    private String callbackUrl;

    public PaymentService(OrderRepository orderRepository, PremiumService premiumService, vn.demo.jobhunter.repository.UserRepository userRepository) {
        this.orderRepository = orderRepository;
        this.premiumService = premiumService;
        this.userRepository = userRepository;
        this.objectMapper = new ObjectMapper();
        this.restTemplate = new RestTemplate();
    }

    public Order createOrder(User user, Company company, String tier) throws Exception {
        // 1. Tính tiền
        long amount = getAmountByTier(tier);

        // 2. Tạo Order
        String orderCode = "ORD-" + System.currentTimeMillis();
        Order order = new Order();
        order.setOrderCode(orderCode);
        order.setAmount(amount);
        order.setTier(tier.toUpperCase());
        order.setStatus("PENDING");
        order.setUser(user);
        order.setCompany(company);
        order = this.orderRepository.save(order);

        // 3. Gọi Payment Gateway
        Map<String, Object> billRequest = new HashMap<>();
        billRequest.put("orderId", orderCode);
        billRequest.put("amount", amount);
        billRequest.put("description", "Thanh toan goi Premium " + tier.toUpperCase() + " - JobHunter");
        billRequest.put("callbackUrl", callbackUrl);

        String bodyJson = this.objectMapper.writeValueAsString(billRequest);

        // Tạo HMAC signature
        String signature = HmacUtil.sign(sharedSecret, bodyJson);

        // Gửi request đến Gateway
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-Signature", signature);
        headers.set("X-Timestamp", String.valueOf(System.currentTimeMillis()));

        HttpEntity<String> entity = new HttpEntity<>(bodyJson, headers);

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(
                    gatewayUrl + "/gw/create-bill", entity, String.class);

            // Parse response
            JsonNode responseBody = this.objectMapper.readTree(response.getBody());
            
            // Bóc vỏ lớp 1 (RestResponse)
            JsonNode restData = responseBody.has("data") ? responseBody.get("data") : responseBody;

            // Kiểm tra thành công (có thể ở lớp ngoài hoặc trong data)
            boolean isSuccess = responseBody.path("statusCode").asInt() == 200 || 
                               restData.path("success").asBoolean() == true;

            if (isSuccess) {
                // Lấy data thực sự (Lớp 2)
                JsonNode realData = restData.has("data") ? restData.get("data") : restData;
                
                order.setBillId(realData.get("billId").asText());
                order.setQrUrl(realData.get("qrUrl").asText());
                order.setExpiredAt(Instant.parse(realData.get("expiredAt").asText()));
                order = this.orderRepository.save(order);
            } else {
                order.setStatus("FAILED");
                this.orderRepository.save(order);
                throw new RuntimeException("Gateway returned error: " + response.getBody());
            }
        } catch (Exception e) {
            order.setStatus("FAILED");
            this.orderRepository.save(order);
            throw new RuntimeException("Failed to create bill at Gateway: " + e.getMessage(), e);
        }

        return order;
    }

    public void handleCallback(String bodyJson, String signature, String timestamp) 
            throws JsonProcessingException {
        // 1. Verify HMAC
        if (!HmacUtil.verify(sharedSecret, bodyJson, signature)) {
            throw new RuntimeException("Invalid HMAC signature");
        }

        // 2. Verify timestamp (chống replay attack - cho phép lệch 5 phút)
        long requestTime = Long.parseLong(timestamp);
        long now = System.currentTimeMillis();
        if (Math.abs(now - requestTime) > 5 * 60 * 1000) {
            throw new RuntimeException("Request timestamp expired");
        }

        // 3. Parse callback data
        JsonNode callbackData = this.objectMapper.readTree(bodyJson);
        String billId = callbackData.get("billId").asText();
        String orderId = callbackData.get("orderId").asText();
        String status = callbackData.get("status").asText();

        // 4. Tìm Order
        Optional<Order> optOrder = this.orderRepository.findByBillId(billId);
        if (optOrder.isEmpty()) {
            optOrder = this.orderRepository.findByOrderCode(orderId);
        }

        if (optOrder.isEmpty()) {
            throw new RuntimeException("Order not found for billId: " + billId);
        }

        Order order = optOrder.get();

        // 5. Cập nhật trạng thái
        if ("PAID".equals(status)) {
            order.setStatus("COMPLETED");
            order.setPaidAt(Instant.now());
            this.orderRepository.save(order);

            // 6. Kích hoạt Premium
            if (order.getCompany() != null) {
                String tier = order.getTier().toUpperCase();
                int days = tier.contains("YEAR") || tier.equals("ENTERPRISE") ? 365 : 30;
                this.premiumService.subscribePremium(order.getCompany(), tier, days);
                System.out.println("[BE] Premium " + tier + " activated for company: " + order.getCompany().getName());
            } else {
                // Kích hoạt cho Cá nhân (Ứng viên)
                User user = order.getUser();
                if (user != null) {
                    user.setIsPremiumCandidate(true);
                    String tier = order.getTier().toUpperCase();
                    int days = tier.contains("YEAR") ? 365 : 30;
                    user.setPremiumCandidateExpiryDate(Instant.now().plus(days, java.time.temporal.ChronoUnit.DAYS));
                    this.userRepository.save(user);
                    System.out.println("[BE] Premium activated for candidate: " + user.getEmail());
                }
            }
        } else {
            order.setStatus("FAILED");
            this.orderRepository.save(order);
        }
    }

     //Kiểm tra trạng thái đơn hàng
    public Order getOrderByCode(String orderCode) {
        return this.orderRepository.findByOrderCode(orderCode).orElse(null);
    }

    //Tính tiền theo gói
    private long getAmountByTier(String tier) {
        return switch (tier.toUpperCase()) {
            case "PRO" -> 500000;         // 500,000 VND / tháng
            case "MONTHLY" -> 500000;     // Compatibility
            case "ENTERPRISE" -> 5000000; // 5,000,000 VND / năm
            case "YEARLY" -> 5000000;     // Compatibility
            default -> throw new IllegalArgumentException("Invalid tier: " + tier);
        };
    }
}

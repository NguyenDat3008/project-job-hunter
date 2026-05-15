package vn.demo.jobhunter.config;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.HandlerMapping;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import vn.demo.jobhunter.domain.Permission;
import vn.demo.jobhunter.domain.Role;
import vn.demo.jobhunter.domain.User;
import vn.demo.jobhunter.service.UserService;
import vn.demo.jobhunter.util.SecurityUtil;
import vn.demo.jobhunter.util.error.PermissionException;

public class PermissionInterceptor implements HandlerInterceptor {

    private final UserService userService;

    public PermissionInterceptor(UserService userService) {
        this.userService = userService;
    }

    @Override
    @Transactional
    public boolean preHandle(
            HttpServletRequest request,
            HttpServletResponse response, Object handler)
            throws Exception {

        String path = (String) request.getAttribute(HandlerMapping.BEST_MATCHING_PATTERN_ATTRIBUTE);
        String requestURI = request.getRequestURI();
        String httpMethod = request.getMethod();

        System.out.println(">>> [DEBUG] Interceptor Start: " + httpMethod + " " + requestURI + " (Path: " + path + ")");

        // 1. Skip OPTIONS requests
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }

        // 2. Skip whitelist paths manually as a fallback
        String lowerURI = requestURI.toLowerCase();
        if (lowerURI.contains("auth") || 
            lowerURI.contains("notifications") ||
            lowerURI.contains("stats") ||
            lowerURI.contains("v3/api-docs") ||
            lowerURI.contains("swagger-ui")) {
            System.out.println(">>> [DEBUG] Whitelist Skip (Aggressive): " + requestURI);
            return true;
        }

        System.out.println(">>> RUN preHandle");
        System.out.println(">>> path= " + path);
        System.out.println(">>> httpMethod= " + httpMethod);
        System.out.println(">>> requestURI= " + requestURI);

        // check permission
        String email = SecurityUtil.getCurrentUserLogin().isPresent() == true
                ? SecurityUtil.getCurrentUserLogin().get()
                : "";
        if (email != null && !email.isEmpty()) {
            User user = this.userService.handleGetUserByUsername(email);
            if (user != null) {
                Role role = user.getRole();
                if (role != null) {
                    String roleName = role.getName();
                    if (roleName != null && (roleName.toUpperCase().contains("ADMIN"))) {
                        return true;
                    }
                    List<Permission> permissions = role.getPermissions();

                    boolean isAllow = permissions.stream().anyMatch(item -> item.getApiPath().equals(path)
                            && item.getMethod().equals(httpMethod));
                    
                    if (!isAllow) {
                        System.out.println(">>> Access Denied for path: " + path + " Method: " + httpMethod + " Role: " + roleName);
                        throw new PermissionException("Bạn không có quyền truy cập endpoint này.");
                    }
                } else {
                    // User tồn tại nhưng không có role → từ chối
                    throw new PermissionException("Tài khoản chưa được gán quyền truy cập.");
                }
            } else {
                // BUG FIX #4: Token hợp lệ nhưng user đã bị xóa khỏi DB → từ chối
                throw new PermissionException("Tài khoản không tồn tại hoặc đã bị vô hiệu hóa.");
            }
        }

        return true;
    }
}

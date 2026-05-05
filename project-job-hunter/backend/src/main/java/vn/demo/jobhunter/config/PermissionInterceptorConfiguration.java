package vn.demo.jobhunter.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class PermissionInterceptorConfiguration implements WebMvcConfigurer {
    @Bean
    PermissionInterceptor getPermissionInterceptor() {
        return new PermissionInterceptor();
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        String[] whiteList = {
                "/",
                // Auth endpoints
                "/api/v1/auth/**",
                // Static resources
                "/storage/**",
                // Swagger
                "/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html",
                // Public GET endpoints (already allowed in SecurityConfiguration)
                "/api/v1/companies", "/api/v1/companies/**",
                "/api/v1/jobs", "/api/v1/jobs/**",
                "/api/v1/skills", "/api/v1/skills/**",
                // Premium packages (public)
                "/api/v1/premium/packages",
                // Email
                "/api/v1/email/**"
        };
        registry.addInterceptor(getPermissionInterceptor())
                .excludePathPatterns(whiteList);
    }
}

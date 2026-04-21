package vn.demo.jobhunter.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.Contact;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

// http://localhost:8080/swagger-ui/index.html
@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("JobHunter API - Mini Demo")
                        .version("1.0")
                        .description("Hệ thống API quản lý Tuyển dụng - CRUD cho Company và Job")
                        .contact(new Contact()
                                .name("Sinh viên nghèo DEMO")
                                .email("demo@gmail.com")));
    }
}

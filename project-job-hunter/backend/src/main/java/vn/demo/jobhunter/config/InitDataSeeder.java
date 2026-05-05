package vn.demo.jobhunter.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

/**
 * InitDataSeeder - DISABLED.
 * Toàn bộ việc seed dữ liệu mẫu đã được quản lý tập trung tại DatabaseInitializer.
 * Class này được giữ lại để tránh lỗi nếu có reference, nhưng không làm gì.
 */
@Component
public class InitDataSeeder implements CommandLineRunner {

    @Override
    public void run(String... args) throws Exception {
        // Intentionally left empty.
        // All data seeding is handled by DatabaseInitializer.
    }
}

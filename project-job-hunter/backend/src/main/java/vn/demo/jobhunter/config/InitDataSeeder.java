package vn.demo.jobhunter.config;

import java.time.Instant;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import vn.demo.jobhunter.domain.Company;
import vn.demo.jobhunter.domain.Job;
import vn.demo.jobhunter.repository.CompanyRepository;
import vn.demo.jobhunter.repository.JobRepository;

@Component
public class InitDataSeeder implements CommandLineRunner {

    private final CompanyRepository companyRepository;
    private final JobRepository jobRepository;

    public InitDataSeeder(CompanyRepository companyRepository, JobRepository jobRepository) {
        this.companyRepository = companyRepository;
        this.jobRepository = jobRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        System.out.println(">>> Kiểm tra dữ liệu mẫu...");

        // Chỉ thêm data nếu bảng companies đang rỗng (tránh trùng lặp khi restart)
        if (companyRepository.count() == 0) {
            System.out.println(">>> Database trống! Đang thêm dữ liệu mẫu...");

            // ===== TẠO 3 CÔNG TY MẪU =====
            Company fpt = new Company();
            fpt.setName("FPT Software");
            fpt.setDescription("Công ty phần mềm hàng đầu Việt Nam, chuyên gia công phần mềm cho thị trường Nhật Bản, Mỹ, Châu Âu.");
            fpt.setAddress("Đà Nẵng, Việt Nam");
            fpt.setLogo("https://via.placeholder.com/100x100?text=FPT");
            companyRepository.save(fpt);

            Company vietcombank = new Company();
            vietcombank.setName("Ngân hàng Vietcombank");
            vietcombank.setDescription("Ngân hàng thương mại cổ phần Ngoại thương Việt Nam, một trong những ngân hàng lớn nhất Việt Nam.");
            vietcombank.setAddress("Hà Nội, Việt Nam");
            vietcombank.setLogo("https://via.placeholder.com/100x100?text=VCB");
            companyRepository.save(vietcombank);

            Company topcv = new Company();
            topcv.setName("TopCV Vietnam");
            topcv.setDescription("Nền tảng tuyển dụng trực tuyến hàng đầu Việt Nam, kết nối ứng viên và nhà tuyển dụng.");
            topcv.setAddress("TP. Hồ Chí Minh, Việt Nam");
            topcv.setLogo("https://via.placeholder.com/100x100?text=TopCV");
            companyRepository.save(topcv);

            // ===== TẠO 5 CÔNG VIỆC MẪU (có liên kết với Company) =====
            Job job1 = new Job();
            job1.setName("Lập trình viên React Native");
            job1.setLocation("Đà Nẵng");
            job1.setSalary(20000000);
            job1.setQuantity(3);
            job1.setDescription("Phát triển ứng dụng mobile đa nền tảng bằng React Native cho khách hàng Nhật Bản.");
            job1.setActive(true);
            job1.setStartDate(Instant.now());
            job1.setCompany(fpt); // Liên kết với FPT
            jobRepository.save(job1);

            Job job2 = new Job();
            job2.setName("Lập trình viên Spring Boot");
            job2.setLocation("Hà Nội");
            job2.setSalary(30000000);
            job2.setQuantity(2);
            job2.setDescription("Xây dựng hệ thống Backend cho ngân hàng số, xử lý giao dịch tài chính.");
            job2.setActive(true);
            job2.setStartDate(Instant.now());
            job2.setCompany(vietcombank); // Liên kết với Vietcombank
            jobRepository.save(job2);

            Job job3 = new Job();
            job3.setName("Thực tập sinh Frontend");
            job3.setLocation("TP. Hồ Chí Minh");
            job3.setSalary(5000000);
            job3.setQuantity(5);
            job3.setDescription("Hỗ trợ development team xây dựng giao diện web bằng ReactJS.");
            job3.setActive(true);
            job3.setStartDate(Instant.now());
            job3.setCompany(topcv); // Liên kết với TopCV
            jobRepository.save(job3);

            Job job4 = new Job();
            job4.setName("DevOps Engineer");
            job4.setLocation("Đà Nẵng");
            job4.setSalary(35000000);
            job4.setQuantity(1);
            job4.setDescription("Quản lý hệ thống CI/CD, Docker, Kubernetes cho các dự án outsource.");
            job4.setActive(true);
            job4.setStartDate(Instant.now());
            job4.setCompany(fpt);
            jobRepository.save(job4);

            Job job5 = new Job();
            job5.setName("Tester QA");
            job5.setLocation("Hà Nội");
            job5.setSalary(15000000);
            job5.setQuantity(4);
            job5.setDescription("Kiểm thử phần mềm, viết test case, đảm bảo chất lượng sản phẩm trước khi release.");
            job5.setActive(true);
            job5.setStartDate(Instant.now());
            job5.setCompany(vietcombank);
            jobRepository.save(job5);

            System.out.println(">>>Đã thêm 3 Công ty và 5 Công việc mẫu thành công!");
        } else {
            System.out.println(">>>Database đã có dữ liệu, bỏ qua seeding.");
        }
    }
}

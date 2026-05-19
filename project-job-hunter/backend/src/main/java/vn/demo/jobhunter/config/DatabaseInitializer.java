package vn.demo.jobhunter.config;

import java.util.ArrayList;
import java.util.List;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import vn.demo.jobhunter.domain.Company;
import vn.demo.jobhunter.domain.Job;
import vn.demo.jobhunter.domain.Permission;
import vn.demo.jobhunter.domain.Role;
import vn.demo.jobhunter.domain.Skill;
import vn.demo.jobhunter.domain.User;
import vn.demo.jobhunter.repository.CompanyRepository;
import vn.demo.jobhunter.repository.JobRepository;
import vn.demo.jobhunter.repository.PermissionRepository;
import vn.demo.jobhunter.repository.RoleRepository;
import vn.demo.jobhunter.repository.SkillRepository;
import vn.demo.jobhunter.repository.UserRepository;
import vn.demo.jobhunter.util.constant.GenderEnum;
import vn.demo.jobhunter.util.constant.LevelEnum;

@Service
public class DatabaseInitializer implements CommandLineRunner {

    private final PermissionRepository permissionRepository;
    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final CompanyRepository companyRepository;
    private final JobRepository jobRepository;
    private final SkillRepository skillRepository;

    public DatabaseInitializer(
            PermissionRepository permissionRepository,
            RoleRepository roleRepository,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            CompanyRepository companyRepository,
            JobRepository jobRepository,
            SkillRepository skillRepository) {
        this.permissionRepository = permissionRepository;
        this.roleRepository = roleRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.companyRepository = companyRepository;
        this.jobRepository = jobRepository;
        this.skillRepository = skillRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        System.out.println(">>> START INIT DATABASE");
        long countPermissions = this.permissionRepository.count();
        long countRoles = this.roleRepository.count();
        long countUsers = this.userRepository.count();
        long countCompanies = this.companyRepository.count();
        long countSkills = this.skillRepository.count();
        long countJobs = this.jobRepository.count();

        if (countPermissions == 0) {
            ArrayList<Permission> arr = new ArrayList<>();
            
            arr.add(new Permission("Create a company", "/api/v1/companies", "POST", "COMPANIES"));
            arr.add(new Permission("Update a company", "/api/v1/companies", "PUT", "COMPANIES"));
            arr.add(new Permission("Delete a company", "/api/v1/companies/{id}", "DELETE", "COMPANIES"));
            arr.add(new Permission("Get a company by id", "/api/v1/companies/{id}", "GET", "COMPANIES"));
            arr.add(new Permission("Get companies with pagination", "/api/v1/companies", "GET", "COMPANIES"));

            arr.add(new Permission("Create a job", "/api/v1/jobs", "POST", "JOBS"));
            arr.add(new Permission("Update a job", "/api/v1/jobs", "PUT", "JOBS"));
            arr.add(new Permission("Delete a job", "/api/v1/jobs/{id}", "DELETE", "JOBS"));
            arr.add(new Permission("Get a job by id", "/api/v1/jobs/{id}", "GET", "JOBS"));
            arr.add(new Permission("Get jobs with pagination", "/api/v1/jobs", "GET", "JOBS"));

            arr.add(new Permission("Create a permission", "/api/v1/permissions", "POST", "PERMISSIONS"));
            arr.add(new Permission("Update a permission", "/api/v1/permissions", "PUT", "PERMISSIONS"));
            arr.add(new Permission("Delete a permission", "/api/v1/permissions/{id}", "DELETE", "PERMISSIONS"));
            arr.add(new Permission("Get a permission by id", "/api/v1/permissions/{id}", "GET", "PERMISSIONS"));
            arr.add(new Permission("Get permissions with pagination", "/api/v1/permissions", "GET", "PERMISSIONS"));

            arr.add(new Permission("Create a resume", "/api/v1/resumes", "POST", "RESUMES"));
            arr.add(new Permission("Update a resume", "/api/v1/resumes", "PUT", "RESUMES"));
            arr.add(new Permission("Delete a resume", "/api/v1/resumes/{id}", "DELETE", "RESUMES"));
            arr.add(new Permission("Get a resume by id", "/api/v1/resumes/{id}", "GET", "RESUMES"));
            arr.add(new Permission("Get resumes with pagination", "/api/v1/resumes", "GET", "RESUMES"));

            arr.add(new Permission("Create a role", "/api/v1/roles", "POST", "ROLES"));
            arr.add(new Permission("Update a role", "/api/v1/roles", "PUT", "ROLES"));
            arr.add(new Permission("Delete a role", "/api/v1/roles/{id}", "DELETE", "ROLES"));
            arr.add(new Permission("Get a role by id", "/api/v1/roles/{id}", "GET", "ROLES"));
            arr.add(new Permission("Get roles with pagination", "/api/v1/roles", "GET", "ROLES"));

            arr.add(new Permission("Create a user", "/api/v1/users", "POST", "USERS"));
            arr.add(new Permission("Update a user", "/api/v1/users", "PUT", "USERS"));
            arr.add(new Permission("Delete a user", "/api/v1/users/{id}", "DELETE", "USERS"));
            arr.add(new Permission("Get a user by id", "/api/v1/users/{id}", "GET", "USERS"));
            arr.add(new Permission("Get users with pagination", "/api/v1/users", "GET", "USERS"));

            arr.add(new Permission("Create a subscriber", "/api/v1/subscribers", "POST", "SUBSCRIBERS"));
            arr.add(new Permission("Update a subscriber", "/api/v1/subscribers", "PUT", "SUBSCRIBERS"));
            arr.add(new Permission("Delete a subscriber", "/api/v1/subscribers/{id}", "DELETE", "SUBSCRIBERS"));
            arr.add(new Permission("Get a subscriber by id", "/api/v1/subscribers/{id}", "GET", "SUBSCRIBERS"));
            arr.add(new Permission("Get subscribers with pagination", "/api/v1/subscribers", "GET", "SUBSCRIBERS"));

            arr.add(new Permission("Download a file", "/api/v1/files/download", "GET", "FILES"));
            arr.add(new Permission("Upload a file", "/api/v1/files", "POST", "FILES"));
            arr.add(new Permission("Get file URL", "/api/v1/files", "GET", "FILES"));

            // Additional permissions for new features
            arr.add(new Permission("Get AI recommended jobs", "/api/v1/jobs/recommend", "GET", "JOBS"));
            arr.add(new Permission("Toggle save job", "/api/v1/jobs/{id}/save", "POST", "JOBS"));
            arr.add(new Permission("Get saved jobs", "/api/v1/jobs/saved", "GET", "JOBS"));
            arr.add(new Permission("Get resumes by user", "/api/v1/resumes/by-user", "GET", "RESUMES"));
            // User self-service permissions
            arr.add(new Permission("Upload avatar", "/api/v1/users/avatar", "POST", "USERS"));
            arr.add(new Permission("Change password", "/api/v1/users/change-password", "POST", "USERS"));
            arr.add(new Permission("Update own profile", "/api/v1/users", "PUT", "USERS"));
            arr.add(new Permission("Delete own account", "/api/v1/users/{id}", "DELETE", "USERS"));
            arr.add(new Permission("Subscribe premium", "/api/v1/premium/subscribe/{tier}", "POST", "PREMIUM"));

            // HR Management permissions (COMPANY_REPRESENTATIVE)
            arr.add(new Permission("Add HR to company", "/api/v1/hr-management/{companyId}", "POST", "HR_MANAGEMENT"));
            arr.add(new Permission("Remove HR from company", "/api/v1/hr-management/{companyId}/{userId}", "DELETE", "HR_MANAGEMENT"));
            arr.add(new Permission("Get HR list of company", "/api/v1/hr-management/{companyId}", "GET", "HR_MANAGEMENT"));

            this.permissionRepository.saveAll(arr);
        }

        // Add BLOGS permissions if missing
        if (!this.permissionRepository.existsByModuleAndApiPathAndMethod("BLOGS", "/api/v1/blogs", "POST")) {
            List<Permission> blogPerms = new ArrayList<>();
            blogPerms.add(new Permission("Create a blog", "/api/v1/blogs", "POST", "BLOGS"));
            blogPerms.add(new Permission("Update a blog", "/api/v1/blogs", "PUT", "BLOGS"));
            blogPerms.add(new Permission("Delete a blog", "/api/v1/blogs/{id}", "DELETE", "BLOGS"));
            blogPerms.add(new Permission("Get a blog by id", "/api/v1/blogs/{id}", "GET", "BLOGS"));
            blogPerms.add(new Permission("Get blogs with pagination", "/api/v1/blogs", "GET", "BLOGS"));
            this.permissionRepository.saveAll(blogPerms);

            // Sync with SUPER_ADMIN
            Role adminRole = this.roleRepository.findByName("SUPER_ADMIN");
            if (adminRole != null) {
                List<Permission> allPermissions = this.permissionRepository.findAll();
                adminRole.setPermissions(allPermissions);
                this.roleRepository.save(adminRole);
                System.out.println(">>> UPDATED SUPER_ADMIN PERMISSIONS WITH BLOGS");
            }
        }

        if (countRoles == 0) {
            List<Permission> allPermissions = this.permissionRepository.findAll();

            // Super Admin
            Role adminRole = new Role();
            adminRole.setName("SUPER_ADMIN");
            adminRole.setDescription("Full permissions");
            adminRole.setActive(true);
            adminRole.setPermissions(allPermissions);
            this.roleRepository.save(adminRole);

            // COMPANY_REPRESENTATIVE Role (Người đại diện công ty)
            Role repRole = new Role();
            repRole.setName("COMPANY_REPRESENTATIVE");
            repRole.setDescription("Company Representative - Manage company, HR members, jobs and resumes");
            repRole.setActive(true);
            List<Permission> repPermissions = allPermissions.stream()
                .filter(p ->
                    // Tất cả quyền của HR: JOBS, COMPANIES, RESUMES, FILES
                    p.getModule().equals("JOBS")
                    || p.getModule().equals("COMPANIES")
                    || p.getModule().equals("RESUMES")
                    || p.getModule().equals("FILES")
                    // Quyền quản lý HR (thêm/sửa/xóa HR)
                    || p.getModule().equals("HR_MANAGEMENT")
                    // Tự quản lý profile
                    || (p.getApiPath().equals("/api/v1/users/avatar") && p.getMethod().equals("POST"))
                    || (p.getApiPath().equals("/api/v1/users/change-password") && p.getMethod().equals("POST"))
                    || (p.getApiPath().equals("/api/v1/users") && p.getMethod().equals("PUT"))
                    || (p.getApiPath().equals("/api/v1/users/{id}") && p.getMethod().equals("DELETE"))
                    // Subscriber
                    || (p.getApiPath().equals("/api/v1/subscribers") && p.getMethod().equals("POST"))
                    || (p.getApiPath().equals("/api/v1/subscribers") && p.getMethod().equals("PUT"))
                )
                .collect(java.util.stream.Collectors.toList());
            repRole.setPermissions(repPermissions);
            this.roleRepository.save(repRole);

            // HR Role
            Role hrRole = new Role();
            hrRole.setName("HR");
            hrRole.setDescription("Human Resources - Manage jobs and resumes");
            hrRole.setActive(true);
            List<Permission> hrPermissions = allPermissions.stream()
                .filter(p -> p.getModule().equals("JOBS") || p.getModule().equals("COMPANIES") || p.getModule().equals("RESUMES") || p.getModule().equals("FILES")
                    // Tự quản lý profile
                    || (p.getApiPath().equals("/api/v1/users/avatar") && p.getMethod().equals("POST"))
                    || (p.getApiPath().equals("/api/v1/users/change-password") && p.getMethod().equals("POST"))
                    || (p.getApiPath().equals("/api/v1/users") && p.getMethod().equals("PUT"))
                    || (p.getApiPath().equals("/api/v1/users/{id}") && p.getMethod().equals("DELETE"))
                    // Xem danh sách HR cùng công ty
                    || (p.getApiPath().equals("/api/v1/hr-management/{companyId}") && p.getMethod().equals("GET"))
                    // Subscriber
                    || (p.getApiPath().equals("/api/v1/subscribers") && p.getMethod().equals("POST"))
                    || (p.getApiPath().equals("/api/v1/subscribers") && p.getMethod().equals("PUT"))
                )
                .collect(java.util.stream.Collectors.toList());
            hrRole.setPermissions(hrPermissions);
            this.roleRepository.save(hrRole);

            // Normal User
            Role userRole = new Role();
            userRole.setName("NORMAL_USER");
            userRole.setDescription("Candidate - Apply jobs and manage profile");
            userRole.setActive(true);
            List<Permission> userPermissions = allPermissions.stream()
                .filter(p ->
                    // Xem jobs
                    (p.getModule().equals("JOBS") && p.getMethod().equals("GET"))
                    // Lưu job / xem job đã lưu / gợi ý job
                    || (p.getApiPath().equals("/api/v1/jobs/{id}/save") && p.getMethod().equals("POST"))
                    || (p.getApiPath().equals("/api/v1/jobs/saved") && p.getMethod().equals("GET"))
                    || (p.getApiPath().equals("/api/v1/jobs/recommend") && p.getMethod().equals("GET"))
                    // Xem companies + Tạo company (chờ duyệt)
                    || (p.getModule().equals("COMPANIES") && p.getMethod().equals("GET"))
                    || (p.getApiPath().equals("/api/v1/companies") && p.getMethod().equals("POST"))
                    // Nộp resume và xem resume của bản thân
                    || (p.getApiPath().equals("/api/v1/resumes") && p.getMethod().equals("POST"))
                    || (p.getApiPath().equals("/api/v1/resumes/by-user") && p.getMethod().equals("GET"))
                    // Upload file (chỉ resume, được check ở FileController)
                    || (p.getModule().equals("FILES"))
                    // Tự quản lý profile
                    || (p.getApiPath().equals("/api/v1/users/avatar") && p.getMethod().equals("POST"))
                    || (p.getApiPath().equals("/api/v1/users/change-password") && p.getMethod().equals("POST"))
                    || (p.getApiPath().equals("/api/v1/users") && p.getMethod().equals("PUT"))
                    || (p.getApiPath().equals("/api/v1/users/{id}") && p.getMethod().equals("DELETE"))
                    // Subscriber
                    || (p.getApiPath().equals("/api/v1/subscribers") && p.getMethod().equals("POST"))
                    || (p.getApiPath().equals("/api/v1/subscribers") && p.getMethod().equals("PUT"))
                )
                .collect(java.util.stream.Collectors.toList());
            userRole.setPermissions(userPermissions);
            this.roleRepository.save(userRole);
        }

        if (countUsers == 0) {
            User adminUser = new User();
            adminUser.setEmail("admin@gmail.com");
            adminUser.setAddress("hn");
            adminUser.setAge(25);
            adminUser.setGender(GenderEnum.MALE);
            adminUser.setName("I'm super admin");
            adminUser.setPassword(this.passwordEncoder.encode("123456"));

            Role adminRole = this.roleRepository.findByName("SUPER_ADMIN");
            if (adminRole != null) {
                adminUser.setRole(adminRole);
            }

            this.userRepository.save(adminUser);
        }

        if (countSkills == 0) {
            List<Skill> skills = new ArrayList<>();
            Skill s1 = new Skill(); s1.setName("Java"); skills.add(s1);
            Skill s2 = new Skill(); s2.setName("Spring Boot"); skills.add(s2);
            Skill s3 = new Skill(); s3.setName("React Native"); skills.add(s3);
            Skill s4 = new Skill(); s4.setName("Node.js"); skills.add(s4);
            Skill s5 = new Skill(); s5.setName("TypeScript"); skills.add(s5);
            Skill s6 = new Skill(); s6.setName("SQL"); skills.add(s6);
            this.skillRepository.saveAll(skills);
        }

        if (countCompanies == 0) {
            List<Company> companies = new ArrayList<>();
            
            Company c1 = new Company();
            c1.setName("FPT Software");
            c1.setDescription("Leading IT service provider in Vietnam");
            c1.setAddress("Cau Giay, Hanoi");
            c1.setWebsite("https://fpt-software.com");
            c1.setLogo("https://vudigital.co/wp-content/uploads/2021/06/fpt-logo-vudigital.jpg");
            c1.setActive(true);
            companies.add(c1);

            Company c2 = new Company();
            c2.setName("VNG Corporation");
            c2.setDescription("Vietnam's leading internet and technology company");
            c2.setAddress("District 7, HCM");
            c2.setWebsite("https://vng.com.vn");
            c2.setLogo("https://vng.com.vn/static/images/vng_logo.png");
            c2.setActive(true);
            companies.add(c2);

            this.companyRepository.saveAll(companies);
        }

        if (countJobs == 0) {
            Company fpt = this.companyRepository.findAll().stream().filter(c -> c.getName().contains("FPT")).findFirst().orElse(null);
            Company vng = this.companyRepository.findAll().stream().filter(c -> c.getName().contains("VNG")).findFirst().orElse(null);
            List<Skill> allSkills = this.skillRepository.findAll();

            if (fpt != null) {
                Job j1 = new Job();
                j1.setName("Senior Java Developer");
                j1.setLocation("Hanoi");
                j1.setSalary(2500);
                j1.setQuantity(5);
                j1.setLevel(LevelEnum.SENIOR);
                j1.setDescription("Build high-performance banking systems using Spring Boot");
                j1.setActive(true);
                j1.setCompany(fpt);
                if (allSkills.size() >= 2) j1.setSkills(allSkills.subList(0, 2));
                this.jobRepository.save(j1);
            }

            if (vng != null) {
                Job j2 = new Job();
                j2.setName("React Native Lead");
                j2.setLocation("HCM");
                j2.setSalary(3000);
                j2.setQuantity(2);
                j2.setLevel(LevelEnum.SENIOR);
                j2.setDescription("Develop ZaloPay's next generation mobile application");
                j2.setActive(true);
                j2.setCompany(vng);
                if (allSkills.size() >= 5) j2.setSkills(allSkills.subList(2, 5));
                this.jobRepository.save(j2);
            }
        }

        // SYNC PERMISSIONS FIX (For existing databases)
        this.syncPermissions();

        if (countPermissions > 0 && countRoles > 0 && countUsers > 0 && countCompanies > 0) {
            System.out.println(">>> SKIP INIT DATABASE ~ ALREADY HAVE DATA...");
        } else
            System.out.println(">>> END INIT DATABASE");
    }

    private void syncPermissions() {
        // Fix "Upload a file" (POST) and "Download a file" (GET)
        Permission uploadPerm = this.permissionRepository.findByName("Upload a file");
        if (uploadPerm != null && uploadPerm.getMethod().equals("GET")) {
            uploadPerm.setMethod("POST");
            this.permissionRepository.save(uploadPerm);
        }

        Permission downloadPerm = this.permissionRepository.findByName("Download a file");
        if (downloadPerm != null && (downloadPerm.getMethod().equals("POST") || !downloadPerm.getApiPath().contains("download"))) {
            downloadPerm.setMethod("GET");
            downloadPerm.setApiPath("/api/v1/files/download");
            this.permissionRepository.save(downloadPerm);
        }

        // Fix "Get resumes by user" (GET)
        Permission resumesByUserPerm = this.permissionRepository.findByName("Get resumes by user");
        if (resumesByUserPerm != null && resumesByUserPerm.getMethod().equals("POST")) {
            resumesByUserPerm.setMethod("GET");
            this.permissionRepository.save(resumesByUserPerm);
        }

        // Ensure NORMAL_USER has correct permissions after sync
        Role userRole = this.roleRepository.findByName("NORMAL_USER");
        if (userRole != null) {
            List<Permission> allPermissions = this.permissionRepository.findAll();
            List<Permission> userPermissions = allPermissions.stream()
                .filter(p ->
                    (p.getModule().equals("JOBS") && p.getMethod().equals("GET"))
                    || (p.getApiPath().equals("/api/v1/jobs/{id}/save") && p.getMethod().equals("POST"))
                    || (p.getApiPath().equals("/api/v1/jobs/saved") && p.getMethod().equals("GET"))
                    || (p.getApiPath().equals("/api/v1/jobs/recommend") && p.getMethod().equals("GET"))
                    || (p.getModule().equals("COMPANIES") && p.getMethod().equals("GET"))
                    || (p.getApiPath().equals("/api/v1/companies") && p.getMethod().equals("POST"))
                    || (p.getApiPath().equals("/api/v1/resumes") && p.getMethod().equals("POST"))
                    || (p.getApiPath().equals("/api/v1/resumes/by-user") && p.getMethod().equals("GET"))
                    || (p.getModule().equals("FILES"))
                    || (p.getApiPath().equals("/api/v1/users/avatar") && p.getMethod().equals("POST"))
                    || (p.getApiPath().equals("/api/v1/users/change-password") && p.getMethod().equals("POST"))
                    || (p.getApiPath().equals("/api/v1/users") && p.getMethod().equals("PUT"))
                    || (p.getApiPath().equals("/api/v1/users/{id}") && p.getMethod().equals("DELETE"))
                    || (p.getApiPath().equals("/api/v1/subscribers") && p.getMethod().equals("POST"))
                    || (p.getApiPath().equals("/api/v1/subscribers") && p.getMethod().equals("PUT"))
                )
                .collect(java.util.stream.Collectors.toList());
            userRole.setPermissions(userPermissions);
            this.roleRepository.save(userRole);
        }
    }

}

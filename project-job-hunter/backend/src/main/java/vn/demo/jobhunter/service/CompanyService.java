package vn.demo.jobhunter.service;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import vn.demo.jobhunter.domain.Company;
import vn.demo.jobhunter.domain.Role;
import vn.demo.jobhunter.domain.User;
import vn.demo.jobhunter.domain.response.ResultPaginationDTO;
import vn.demo.jobhunter.repository.CompanyRepository;
import vn.demo.jobhunter.repository.RoleRepository;
import vn.demo.jobhunter.repository.UserRepository;
import vn.demo.jobhunter.util.SecurityUtil;
import vn.demo.jobhunter.util.error.PermissionException;

@Service
public class CompanyService {

    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final NotificationService notificationService;
    private final FileService fileService;

    public CompanyService(
            CompanyRepository companyRepository,
            UserRepository userRepository,
            RoleRepository roleRepository,
            NotificationService notificationService,
            FileService fileService) {
        this.companyRepository = companyRepository;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.notificationService = notificationService;
        this.fileService = fileService;
    }

    public Company handleCreateCompany(Company c) throws PermissionException {
        // Kiểm tra trùng tên công ty
        if (this.companyRepository.existsByName(c.getName())) {
            throw new PermissionException("Tên công ty này đã tồn tại trên hệ thống.");
        }
        c.setActive(false);
        Company saved = this.companyRepository.save(c);

        // Gán user tạo vào công ty luôn (để họ thấy mình thuộc cty đang chờ duyệt)
        String email = SecurityUtil.getCurrentUserLogin().orElse("");
        User currentUser = this.userRepository.findByEmail(email);
        if (currentUser != null) {
            currentUser.setCompany(saved);
            this.userRepository.save(currentUser);
        }

        // Notify Admin
        User admin = this.userRepository.findByEmail("admin@gmail.com");
        if (admin != null) {
            this.notificationService.createNotification(
                    admin,
                    "Yêu cầu đăng ký doanh nghiệp mới",
                    "Doanh nghiệp " + c.getName() + " vừa gửi yêu cầu tham gia hệ thống.",
                    "COMPANY_REGISTRATION_REQUEST");
        }
        return saved;
    }

    @SuppressWarnings("null")
    public ResultPaginationDTO handleGetCompany(Specification<Company> spec, Pageable pageable) {
        String email = SecurityUtil.getCurrentUserLogin().orElse("");
        User currentUser = this.userRepository.findByEmail(email);

        if (currentUser == null || currentUser.getRole() == null
                || !currentUser.getRole().getName().equals("SUPER_ADMIN")) {
            Specification<Company> activeSpec = (root, query, criteriaBuilder) -> criteriaBuilder
                    .equal(root.get("active"), true);
            spec = spec == null ? activeSpec : spec.and(activeSpec);
        }

        Page<Company> pCompany = this.companyRepository.findAll(spec, pageable);
        ResultPaginationDTO rs = new ResultPaginationDTO();
        ResultPaginationDTO.Meta mt = new ResultPaginationDTO.Meta();
        mt.setPage(pageable.getPageNumber() + 1);
        mt.setPageSize(pageable.getPageSize());
        mt.setPages(pCompany.getTotalPages());
        mt.setTotal(pCompany.getTotalElements());
        rs.setMeta(mt);
        rs.setResult(pCompany.getContent());
        return rs;
    }

    @SuppressWarnings("null")
    public Company handleUpdateCompany(Company c) throws PermissionException {
        Optional<Company> companyOptional = this.companyRepository.findById(c.getId());
        if (companyOptional.isPresent()) {
            Company currentCompany = companyOptional.get();
            String email = SecurityUtil.getCurrentUserLogin().orElse("");
            User currentUser = this.userRepository.findByEmail(email);

            if (currentUser != null && currentUser.getRole() != null) {
                String roleName = currentUser.getRole().getName();

                if (roleName.equals("SUPER_ADMIN")) {
                    // Khi Admin Duyệt
                    if (!currentCompany.isActive() && c.isActive()) {
                        User creator = this.userRepository.findByEmail(currentCompany.getCreatedBy());
                        if (creator != null) {
                            creator.setCompany(currentCompany);
                            // Gán role COMPANY_REPRESENTATIVE (người đại diện công ty)
                            Role repRole = this.roleRepository.findByName("COMPANY_REPRESENTATIVE");
                            if (repRole != null)
                                creator.setRole(repRole);
                            this.userRepository.save(creator);

                            // Gửi thông báo cho người dùng
                            this.notificationService.createNotification(
                                    creator,
                                    "Phê duyệt doanh nghiệp",
                                    "Chúc mừng! Doanh nghiệp " + currentCompany.getName()
                                            + " của bạn đã được phê duyệt. Bạn là Người đại diện công ty.",
                                    "COMPANY_APPROVED");
                        }
                    }
                    
                    // Nếu Admin duyệt các thay đổi quan trọng (Name, Logo)
                    if (currentCompany.getPendingName() != null || currentCompany.getPendingLogo() != null) {
                        if (c.isActive()) { // Admin gửi active=true để phê duyệt thay đổi
                            if (currentCompany.getPendingName() != null) 
                                currentCompany.setName(currentCompany.getPendingName());
                            if (currentCompany.getPendingLogo() != null)
                                currentCompany.setLogo(currentCompany.getPendingLogo());
                            
                            currentCompany.setPendingName(null);
                            currentCompany.setPendingLogo(null);
                            currentCompany.setUpdateReason(null);
                        }
                    }
                    currentCompany.setActive(c.isActive());

                    // Khi Admin Từ chối (Active vẫn false nhưng có updateReason mới)
                    if (!c.isActive() && c.getUpdateReason() != null && c.getUpdateReason().startsWith("Từ chối:")) {
                        User creator = this.userRepository.findByEmail(currentCompany.getCreatedBy());
                        if (creator != null) {
                            this.notificationService.createNotification(
                                creator,
                                "Yêu cầu đăng ký bị từ chối",
                                "Yêu cầu đăng ký công ty " + currentCompany.getName() + " bị từ chối. Lý do: " + c.getUpdateReason().replace("Từ chối: ", ""),
                                "COMPANY_REJECTED"
                            );
                        }
                    }
                    
                    // Thông báo nâng cấp Premium
                    if (!currentCompany.getIsPremium() && c.getIsPremium()) {
                        User creator = this.userRepository.findByEmail(currentCompany.getCreatedBy());
                        if (creator != null) {
                            this.notificationService.createNotification(
                                creator,
                                "Nâng cấp Premium thành công",
                                "Chúc mừng! Công ty " + currentCompany.getName() + " đã được nâng cấp lên gói Premium.",
                                "PREMIUM_UPGRADE"
                            );
                        }
                    }

                    currentCompany.setIsPremium(c.getIsPremium());
                    currentCompany.setPremiumTier(c.getPremiumTier());
                    currentCompany.setPremiumExpiryDate(c.getPremiumExpiryDate());
                } else {
                    if (currentUser.getCompany() == null || currentUser.getCompany().getId() != c.getId()) {
                        throw new PermissionException("Bạn không có quyền chỉnh sửa thông tin của công ty khác.");
                    }
                    
                    // Kiểm tra các thay đổi quan trọng cần duyệt (Tên và Logo)
                    boolean isNameChanged = c.getName() != null && !c.getName().trim().isEmpty() && !c.getName().equals(currentCompany.getName());
                    boolean isLogoChanged = c.getLogo() != null && !c.getLogo().trim().isEmpty() && !c.getLogo().equals(currentCompany.getLogo());

                    if (isNameChanged || isLogoChanged) {
                        // Nếu có thay đổi quan trọng, lưu vào trường Pending và giữ nguyên trường chính
                        if (isNameChanged) currentCompany.setPendingName(c.getName());
                        if (isLogoChanged) currentCompany.setPendingLogo(c.getLogo());
                        
                        currentCompany.setUpdateReason(c.getUpdateReason());
                        
                        // Nội dung thông báo chi tiết
                        String msg = "Công ty " + currentCompany.getName() + " yêu cầu thay đổi: ";
                        if (isNameChanged && isLogoChanged) msg += "Tên và Logo";
                        else if (isNameChanged) msg += "Tên công ty";
                        else msg += "Logo công ty";

                        // Gửi thông báo cho admin
                        this.notificationService.createNotification(
                            this.userRepository.findByEmail("admin@gmail.com"), 
                            "Yêu cầu thay đổi thông tin",
                            msg,
                            "COMPANY_UPDATE_REQUEST"
                        );
                    }

                    // Các thông tin khác cập nhật ngay lập tức (không cần duyệt)
                    if (c.getDescription() != null) currentCompany.setDescription(c.getDescription());
                    if (c.getAddress() != null) currentCompany.setAddress(c.getAddress());
                    if (c.getWebsite() != null) currentCompany.setWebsite(c.getWebsite());
                    if (c.getIndustry() != null) currentCompany.setIndustry(c.getIndustry());
                    if (c.getSize() != null) currentCompany.setSize(c.getSize());
                    if (c.getLatitude() != null) currentCompany.setLatitude(c.getLatitude());
                    if (c.getLongitude() != null) currentCompany.setLongitude(c.getLongitude());
                }
            }

            return this.companyRepository.save(currentCompany);
        }
        return null;
    }

    public void handleDeleteCompany(long id) {
        Optional<Company> comOptional = this.companyRepository.findById(id);
        if (comOptional.isPresent()) {
            Company com = comOptional.get();
            List<User> users = this.userRepository.findByCompany(com);
            for (User u : users) {
                u.setCompany(null);
                // Giảm Role xuống Normal User nếu công ty bị xóa
                Role userRole = this.roleRepository.findByName("NORMAL_USER");
                if (userRole != null)
                    u.setRole(userRole);
                this.userRepository.save(u);
            }
        }
        this.companyRepository.deleteById(id);
    }

    public Optional<Company> findById(long id) {
        return this.companyRepository.findById(id);
    }

    public String uploadCompanyLogo(org.springframework.web.multipart.MultipartFile file) throws Exception {
        return this.fileService.store(file, "company-logos");
    }
}

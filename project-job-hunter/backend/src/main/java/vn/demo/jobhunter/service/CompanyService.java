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
                System.out.println(">>> [DEBUG] handleUpdateCompany - User: " + email + ", Role: '" + roleName + "'");

                if (roleName != null && roleName.trim().equalsIgnoreCase("SUPER_ADMIN")) {
                    System.out.println(">>> [ADMIN_ACTION] Approving Company ID: " + c.getId());
                    System.out.println(">>> [BEFORE] Name: " + currentCompany.getName() + ", PendingName: " + currentCompany.getPendingName());
                    System.out.println(">>> [BEFORE] Logo: " + currentCompany.getLogo() + ", PendingLogo: " + currentCompany.getPendingLogo());

                    // TRƯỜNG HỢP 1: Phê duyệt thay đổi thông tin (Dành cho cty đã Active)
                    if (c.isActive()) {
                        boolean hasChanges = false;
                        if (currentCompany.getPendingName() != null) {
                            System.out.println(">>> [UPDATE] Applying Pending Name: " + currentCompany.getPendingName());
                            currentCompany.setName(currentCompany.getPendingName());
                            currentCompany.setPendingName(null);
                            hasChanges = true;
                        }
                        if (currentCompany.getPendingLogo() != null) {
                            System.out.println(">>> [UPDATE] Applying Pending Logo: " + currentCompany.getPendingLogo());
                            currentCompany.setLogo(currentCompany.getPendingLogo());
                            currentCompany.setPendingLogo(null);
                            hasChanges = true;
                        }
                        
                        if (hasChanges) {
                            currentCompany.setUpdateReason(null);
                        }
                    }

                    // TRƯỜNG HỢP 2: Phê duyệt kích hoạt tài khoản mới
                    if (!currentCompany.isActive() && c.isActive()) {
                        System.out.println(">>> [UPDATE] Activating NEW Company");
                        User creator = this.userRepository.findByEmail(currentCompany.getCreatedBy());
                        if (creator != null) {
                            creator.setCompany(currentCompany);
                            Role repRole = this.roleRepository.findByName("COMPANY_REPRESENTATIVE");
                            if (repRole != null) creator.setRole(repRole);
                            this.userRepository.save(creator);

                            this.notificationService.createNotification(
                                creator,
                                "Tài khoản đã kích hoạt",
                                "Chúc mừng! Công ty " + currentCompany.getName() + " của bạn đã sẵn sàng hoạt động.",
                                "COMPANY_APPROVED"
                            );
                        }
                    }

                    currentCompany.setActive(c.isActive());

                    // Xử lý Từ chối
                    if (!c.isActive() && c.getUpdateReason() != null && c.getUpdateReason().startsWith("Từ chối:")) {
                        System.out.println(">>> [UPDATE] Admin REJECTED");
                        User creator = this.userRepository.findByEmail(currentCompany.getCreatedBy());
                        if (creator != null) {
                            this.notificationService.createNotification(
                                creator,
                                "Yêu cầu bị từ chối",
                                "Lý do: " + c.getUpdateReason().replace("Từ chối: ", ""),
                                "COMPANY_REJECTED"
                            );
                        }
                    }

                    // Cập nhật Premium (nếu có)
                    currentCompany.setIsPremium(c.getIsPremium());
                    currentCompany.setPremiumTier(c.getPremiumTier());
                    currentCompany.setPremiumExpiryDate(c.getPremiumExpiryDate());
                } else {
                    // LUỒNG HR (Người đại diện cập nhật)
                    System.out.println(">>> [HR_ACTION] Requesting Update for Company ID: " + c.getId());
                    if (currentUser.getCompany() == null || currentUser.getCompany().getId() != c.getId()) {
                        throw new PermissionException("Bạn không có quyền chỉnh sửa công ty này.");
                    }
                    
                    // Phát hiện thay đổi quan trọng
                    boolean nameChanged = c.getName() != null && !c.getName().trim().isEmpty() && !c.getName().equals(currentCompany.getName());
                    boolean logoChanged = c.getLogo() != null && !c.getLogo().trim().isEmpty() && !c.getLogo().equals(currentCompany.getLogo());

                    if (nameChanged || logoChanged) {
                        if (nameChanged) currentCompany.setPendingName(c.getName());
                        if (logoChanged) currentCompany.setPendingLogo(c.getLogo());
                        currentCompany.setUpdateReason(c.getUpdateReason());
                        
                        // Thông báo cho admin
                        this.notificationService.createNotification(
                            this.userRepository.findByEmail("admin@gmail.com"), 
                            "Yêu cầu phê duyệt thay đổi",
                            "Công ty " + currentCompany.getName() + " vừa cập nhật " + (nameChanged && logoChanged ? "Tên & Logo" : nameChanged ? "Tên" : "Logo"),
                            "COMPANY_UPDATE_REQUEST"
                        );
                    }

                    // Cập nhật các thông tin phụ ngay lập tức
                    if (c.getDescription() != null) currentCompany.setDescription(c.getDescription());
                    if (c.getAddress() != null) currentCompany.setAddress(c.getAddress());
                    if (c.getWebsite() != null) currentCompany.setWebsite(c.getWebsite());
                    if (c.getIndustry() != null) currentCompany.setIndustry(c.getIndustry());
                    if (c.getSize() != null) currentCompany.setSize(c.getSize());
                    if (c.getLatitude() != null) currentCompany.setLatitude(c.getLatitude());
                    if (c.getLongitude() != null) currentCompany.setLongitude(c.getLongitude());
                }
            }

            Company saved = this.companyRepository.save(currentCompany);
            System.out.println(">>> [AFTER_SAVE] Name: " + saved.getName() + ", Logo: " + saved.getLogo());
            return saved;
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

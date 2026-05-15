package vn.demo.jobhunter.service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import vn.demo.jobhunter.domain.Company;
import vn.demo.jobhunter.domain.Role;
import vn.demo.jobhunter.domain.User;
import vn.demo.jobhunter.domain.response.ResCreateUserDTO;
import vn.demo.jobhunter.domain.response.ResUpdateUserDTO;
import vn.demo.jobhunter.domain.response.ResUserDTO;
import vn.demo.jobhunter.domain.response.ResultPaginationDTO;
import vn.demo.jobhunter.repository.UserRepository;
import vn.demo.jobhunter.util.error.IdInvalidException;
import vn.demo.jobhunter.util.error.PermissionException;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final CompanyService companyService;
    private final RoleService roleService;

    public UserService(UserRepository userRepository,
            CompanyService companyService,
            RoleService roleService) {
        this.userRepository = userRepository;
        this.companyService = companyService;
        this.roleService = roleService;
    }

    public User handleCreateUser(User user) {
        // check company
        if (user.getCompany() != null) {
            Optional<Company> companyOptional = this.companyService.findById(user.getCompany().getId());
            user.setCompany(companyOptional.isPresent() ? companyOptional.get() : null);
        }

        // check role
        if (user.getRole() != null) {
            Role r = this.roleService.fetchById(user.getRole().getId());
            user.setRole(r != null ? r : null);
        }

        return this.userRepository.save(user);
    }

    public void handleDeleteUser(long id) {
        this.userRepository.deleteById(id);
    }

    public User fetchUserById(long id) {
        Optional<User> userOptional = this.userRepository.findById(id);
        if (userOptional.isPresent()) {
            return userOptional.get();
        }
        return null;
    }

    public ResultPaginationDTO fetchAllUser(Specification<User> spec, Pageable pageable) {
        Page<User> pageUser = this.userRepository.findAll(spec, pageable);
        ResultPaginationDTO rs = new ResultPaginationDTO();
        ResultPaginationDTO.Meta mt = new ResultPaginationDTO.Meta();

        mt.setPage(pageable.getPageNumber() + 1);
        mt.setPageSize(pageable.getPageSize());

        mt.setPages(pageUser.getTotalPages());
        mt.setTotal(pageUser.getTotalElements());

        rs.setMeta(mt);

        // remove sensitive data
        List<ResUserDTO> listUser = pageUser.getContent()
                .stream().map(item -> this.convertToResUserDTO(item))
                .collect(Collectors.toList());

        rs.setResult(listUser);

        return rs;
    }

    public User handleUpdateUser(User reqUser) {
        User currentUser = this.fetchUserById(reqUser.getId());
        if (currentUser != null) {
            currentUser.setAddress(reqUser.getAddress());
            currentUser.setGender(reqUser.getGender());
            currentUser.setAge(reqUser.getAge());
            currentUser.setName(reqUser.getName());

            // check company
            if (reqUser.getCompany() != null) {
                Optional<Company> companyOptional = this.companyService.findById(reqUser.getCompany().getId());
                currentUser.setCompany(companyOptional.isPresent() ? companyOptional.get() : null);
            }

            // check role
            if (reqUser.getRole() != null) {
                Role r = this.roleService.fetchById(reqUser.getRole().getId());
                currentUser.setRole(r != null ? r : null);
            }

            // update
            currentUser = this.userRepository.save(currentUser);
        }
        return currentUser;
    }

    public User handleGetUserByUsername(String username) {
        return this.userRepository.findByEmail(username);
    }

    public boolean isEmailExist(String email) {
        return this.userRepository.existsByEmail(email);
    }

    public ResCreateUserDTO convertToResCreateUserDTO(User user) {
        ResCreateUserDTO res = new ResCreateUserDTO();
        ResCreateUserDTO.CompanyUser com = new ResCreateUserDTO.CompanyUser();

        res.setId(user.getId());
        res.setEmail(user.getEmail());
        res.setName(user.getName());
        res.setAge(user.getAge());
        res.setCreatedAt(user.getCreatedAt());
        res.setGender(user.getGender());
        res.setAddress(user.getAddress());

        if (user.getCompany() != null) {
            com.setId(user.getCompany().getId());
            com.setName(user.getCompany().getName());
            res.setCompany(com);
        }
        return res;
    }

    public ResUpdateUserDTO convertToResUpdateUserDTO(User user) {
        ResUpdateUserDTO res = new ResUpdateUserDTO();
        ResUpdateUserDTO.CompanyUser com = new ResUpdateUserDTO.CompanyUser();
        if (user.getCompany() != null) {
            com.setId(user.getCompany().getId());
            com.setName(user.getCompany().getName());
            res.setCompany(com);
        }

        res.setId(user.getId());
        res.setName(user.getName());
        res.setAge(user.getAge());
        res.setUpdatedAt(user.getUpdatedAt());
        res.setGender(user.getGender());
        res.setAddress(user.getAddress());
        return res;
    }

    public ResUserDTO convertToResUserDTO(User user) {
        ResUserDTO res = new ResUserDTO();
        ResUserDTO.CompanyUser com = new ResUserDTO.CompanyUser();
        ResUserDTO.RoleUser roleUser = new ResUserDTO.RoleUser();
        if (user.getCompany() != null) {
            com.setId(user.getCompany().getId());
            com.setName(user.getCompany().getName());
            res.setCompany(com);
        }

        if (user.getRole() != null) {
            roleUser.setId(user.getRole().getId());
            roleUser.setName(user.getRole().getName());
            res.setRole(roleUser);
        }

        res.setId(user.getId());
        res.setEmail(user.getEmail());
        res.setName(user.getName());
        res.setAge(user.getAge());
        res.setUpdatedAt(user.getUpdatedAt());
        res.setCreatedAt(user.getCreatedAt());
        res.setGender(user.getGender());
        res.setAddress(user.getAddress());
        return res;
    }

    public void updateUserToken(String token, String email) {
        User currentUser = this.handleGetUserByUsername(email);
        if (currentUser != null) {
            currentUser.setRefreshToken(token);
            this.userRepository.save(currentUser);
        }
    }

    public User updateAvatar(String email, String avatarName) {
        User currentUser = this.handleGetUserByUsername(email);
        if (currentUser != null) {
            currentUser.setAvatar(avatarName);
            return this.userRepository.save(currentUser);
        }
        return null;
    }

    public User getUserByRefreshTokenAndEmail(String token, String email) {
        return this.userRepository.findByRefreshTokenAndEmail(token, email);
    }

    public void handleChangePassword(String email, String newPassword) {
        User user = this.handleGetUserByUsername(email);
        if (user != null) {
            user.setPassword(newPassword);
            this.userRepository.save(user);
        }
    }

    public User addHrByEmail(String targetEmail, long companyId, String currentEmail)
            throws IdInvalidException, PermissionException {
        User targetUser = this.handleGetUserByUsername(targetEmail);
        if (targetUser == null) {
            throw new IdInvalidException("User với email = " + targetEmail + " không tồn tại trên hệ thống.");
        }
        return this.addHrToCompany(targetUser.getId(), companyId, currentEmail);
    }

    /**
     * Thêm HR vào công ty - chỉ COMPANY_REPRESENTATIVE mới được gọi
     */
    public User addHrToCompany(long targetUserId, long companyId, String currentEmail)
            throws IdInvalidException, PermissionException {
        // Kiểm tra quyền: người gọi phải là COMPANY_REPRESENTATIVE của company này
        User currentUser = this.handleGetUserByUsername(currentEmail);
        if (currentUser == null || currentUser.getRole() == null) {
            throw new PermissionException("Bạn không có quyền thực hiện thao tác này.");
        }

        String roleName = currentUser.getRole().getName();
        boolean isSuperAdmin = roleName.equals("SUPER_ADMIN");
        boolean isRep = roleName.equals("COMPANY_REPRESENTATIVE");

        if (!isSuperAdmin && !isRep) {
            throw new PermissionException("Chỉ Người đại diện công ty hoặc Admin mới có quyền thêm HR.");
        }

        if (isRep) {
            if (currentUser.getCompany() == null || currentUser.getCompany().getId() != companyId) {
                throw new PermissionException("Bạn chỉ có quyền quản lý HR trong công ty của mình.");
            }
        }

        // Kiểm tra target user
        User targetUser = this.fetchUserById(targetUserId);
        if (targetUser == null) {
            throw new IdInvalidException("User với id = " + targetUserId + " không tồn tại.");
        }

        // Kiểm tra target user chưa thuộc công ty nào (hoặc đã thuộc công ty này)
        if (targetUser.getCompany() != null && targetUser.getCompany().getId() != companyId) {
            throw new PermissionException("User này đã thuộc công ty khác.");
        }

        // Kiểm tra company tồn tại
        java.util.Optional<Company> companyOpt = this.companyService.findById(companyId);
        if (companyOpt.isEmpty()) {
            throw new IdInvalidException("Company với id = " + companyId + " không tồn tại.");
        }

        // Gán role HR và company
        Role hrRole = this.roleService.findByName("HR");
        if (hrRole == null) {
            throw new IdInvalidException("Role HR không tồn tại trong hệ thống.");
        }

        targetUser.setRole(hrRole);
        targetUser.setCompany(companyOpt.get());
        return this.userRepository.save(targetUser);
    }

    /**
     * Xóa HR khỏi công ty - reset về NORMAL_USER
     */
    public User removeHrFromCompany(long targetUserId, long companyId, String currentEmail)
            throws IdInvalidException, PermissionException {
        // Kiểm tra quyền
        User currentUser = this.handleGetUserByUsername(currentEmail);
        if (currentUser == null || currentUser.getRole() == null) {
            throw new PermissionException("Bạn không có quyền thực hiện thao tác này.");
        }

        String roleName = currentUser.getRole().getName();
        boolean isSuperAdmin = roleName.equals("SUPER_ADMIN");
        boolean isRep = roleName.equals("COMPANY_REPRESENTATIVE");

        if (!isSuperAdmin && !isRep) {
            throw new PermissionException("Chỉ Người đại diện công ty hoặc Admin mới có quyền xóa HR.");
        }

        if (isRep) {
            if (currentUser.getCompany() == null || currentUser.getCompany().getId() != companyId) {
                throw new PermissionException("Bạn chỉ có quyền quản lý HR trong công ty của mình.");
            }
        }

        // Kiểm tra target user
        User targetUser = this.fetchUserById(targetUserId);
        if (targetUser == null) {
            throw new IdInvalidException("User với id = " + targetUserId + " không tồn tại.");
        }

        // Kiểm tra target user thuộc đúng công ty
        if (targetUser.getCompany() == null || targetUser.getCompany().getId() != companyId) {
            throw new PermissionException("User này không thuộc công ty của bạn.");
        }

        // Không cho xóa chính mình (COMPANY_REPRESENTATIVE)
        if (targetUser.getRole() != null && targetUser.getRole().getName().equals("COMPANY_REPRESENTATIVE")) {
            throw new PermissionException("Không thể xóa Người đại diện công ty.");
        }

        // Reset về NORMAL_USER
        Role normalRole = this.roleService.findByName("NORMAL_USER");
        if (normalRole != null) {
            targetUser.setRole(normalRole);
        }
        targetUser.setCompany(null);
        return this.userRepository.save(targetUser);
    }

    /**
     * Lấy danh sách HR của công ty
     */
    public List<User> getHrByCompany(long companyId)
            throws IdInvalidException {
        java.util.Optional<Company> companyOpt = this.companyService.findById(companyId);
        if (companyOpt.isEmpty()) {
            throw new IdInvalidException("Company với id = " + companyId + " không tồn tại.");
        }

        Role hrRole = this.roleService.findByName("HR");
        Role repRole = this.roleService.findByName("COMPANY_REPRESENTATIVE");

        List<User> result = new java.util.ArrayList<>();

        if (hrRole != null) {
            result.addAll(this.userRepository.findByCompanyAndRole(companyOpt.get(), hrRole));
        }
        if (repRole != null) {
            result.addAll(this.userRepository.findByCompanyAndRole(companyOpt.get(), repRole));
        }

        return result;
    }
}

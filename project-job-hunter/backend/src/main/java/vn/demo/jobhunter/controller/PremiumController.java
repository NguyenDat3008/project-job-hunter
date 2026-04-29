package vn.demo.jobhunter.controller;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import vn.demo.jobhunter.domain.Company;
import vn.demo.jobhunter.domain.Job;
import vn.demo.jobhunter.domain.User;
import vn.demo.jobhunter.repository.CompanyRepository;
import vn.demo.jobhunter.repository.JobRepository;
import vn.demo.jobhunter.service.UserService;
import vn.demo.jobhunter.util.SecurityUtil;
import vn.demo.jobhunter.util.annotation.ApiMessage;

@RestController
@RequestMapping("/api/v1/premium")
public class PremiumController {

    private final UserService userService;
    private final CompanyRepository companyRepository;
    private final JobRepository jobRepository;

    public PremiumController(UserService userService, CompanyRepository companyRepository,
            JobRepository jobRepository) {
        this.userService = userService;
        this.companyRepository = companyRepository;
        this.jobRepository = jobRepository;
    }

    @GetMapping("/packages")
    @ApiMessage("Get premium packages")
    public ResponseEntity<List<Map<String, Object>>> getPackages() {
        List<Map<String, Object>> packages = new ArrayList<>();

        Map<String, Object> basic = new HashMap<>();
        basic.put("id", 1);
        basic.put("name", "Nổi bật");
        basic.put("price", 1000000);

        Map<String, Object> pro = new HashMap<>();
        pro.put("id", 2);
        pro.put("name", "Pro");
        pro.put("price", 3000000);
        pro.put("isPopular", true);

        packages.add(basic);
        packages.add(pro);

        return ResponseEntity.ok(packages);
    }

    @PostMapping("/subscribe/{tier}")
    @ApiMessage("Subscribe to a premium package")
    public ResponseEntity<String> subscribePremium(@PathVariable("tier") String tier) {
        String email = SecurityUtil.getCurrentUserLogin().orElse("");
        User currentUser = this.userService.handleGetUserByUsername(email);

        if (currentUser == null || currentUser.getCompany() == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only users with a company can subscribe.");
        }

        Company company = currentUser.getCompany();
        company.setIsPremium(true);
        company.setPremiumTier(tier.toUpperCase());
        this.companyRepository.save(company);

        // Also update all jobs of this company to be premium
        List<Job> jobs = company.getJobs();
        if (jobs != null) {
            for (Job j : jobs) {
                j.setIsPremium(true);
            }
            this.jobRepository.saveAll(jobs);
        }

        return ResponseEntity.ok("Successfully upgraded to " + tier);
    }
}

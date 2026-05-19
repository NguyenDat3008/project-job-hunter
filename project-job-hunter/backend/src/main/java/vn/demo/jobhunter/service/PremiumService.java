package vn.demo.jobhunter.service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import org.springframework.stereotype.Service;

import vn.demo.jobhunter.domain.Company;
import vn.demo.jobhunter.repository.CompanyRepository;
import vn.demo.jobhunter.repository.JobRepository;

@Service
public class PremiumService {

    private final CompanyRepository companyRepository;
    private final JobRepository jobRepository;

    public PremiumService(CompanyRepository companyRepository, JobRepository jobRepository) {
        this.companyRepository = companyRepository;
        this.jobRepository = jobRepository;
    }

    public void subscribePremium(Company company, String tier, int days) {
        company.setIsPremium(true);
        company.setPremiumTier(tier.toUpperCase());
        // Set expiry
        company.setPremiumExpiryDate(Instant.now().plus(days, ChronoUnit.DAYS));
        this.companyRepository.save(company);

        // Update jobs
        this.jobRepository.updateIsPremiumByCompanyId(company.getId(), true);
    }

    public boolean isCompanyPremium(Company company) {
        return company.getIsPremium() != null && company.getIsPremium() 
               && company.getPremiumExpiryDate() != null 
               && company.getPremiumExpiryDate().isAfter(Instant.now());
    }
}

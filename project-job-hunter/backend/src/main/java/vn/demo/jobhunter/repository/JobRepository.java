package vn.demo.jobhunter.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import vn.demo.jobhunter.domain.Job;
import vn.demo.jobhunter.domain.Skill;

@Repository
public interface JobRepository extends JpaRepository<Job, Long>,
                JpaSpecificationExecutor<Job> {

        List<Job> findBySkillsIn(List<Skill> skills);
        List<Job> findByActiveTrue();
        long countByCompanyId(long companyId);
        long countByActive(boolean active);

        @org.springframework.data.jpa.repository.Modifying
        @org.springframework.data.jpa.repository.Query("UPDATE Job j SET j.isPremium = :isPremium WHERE j.company.id = :companyId")
        void updateIsPremiumByCompanyId(long companyId, boolean isPremium);
}

package vn.demo.jobhunter.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;
import vn.demo.jobhunter.domain.Resume;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Repository
public interface ResumeRepository extends JpaRepository<Resume, Long>,
                JpaSpecificationExecutor<Resume> {
    Page<Resume> findByUserId(long userId, Pageable pageable);
    long countByUserId(long userId);
    boolean existsByUserIdAndJobId(long userId, long jobId);
}

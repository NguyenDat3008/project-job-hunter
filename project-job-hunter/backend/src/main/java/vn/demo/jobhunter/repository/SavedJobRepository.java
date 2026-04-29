package vn.demo.jobhunter.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import vn.demo.jobhunter.domain.SavedJob;
import vn.demo.jobhunter.domain.User;
import vn.demo.jobhunter.domain.Job;

@Repository
public interface SavedJobRepository extends JpaRepository<SavedJob, Long> {
    List<SavedJob> findByUser(User user);
    SavedJob findByUserAndJob(User user, Job job);
    boolean existsByUserAndJob(User user, Job job);
}

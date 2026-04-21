package vn.demo.jobhunter.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import vn.demo.jobhunter.domain.Job;

@Repository
public interface JobRepository extends JpaRepository<Job, Long> {

}

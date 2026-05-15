package vn.demo.jobhunter.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import vn.demo.jobhunter.domain.Order;
import vn.demo.jobhunter.domain.User;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    Optional<Order> findByOrderCode(String orderCode);
    Optional<Order> findByBillId(String billId);
    List<Order> findByUserAndStatus(User user, String status);
    List<Order> findByUser(User user);
}

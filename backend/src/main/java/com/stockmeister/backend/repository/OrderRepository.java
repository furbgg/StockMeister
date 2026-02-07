package com.stockmeister.backend.repository;

import com.stockmeister.backend.model.Order;
import com.stockmeister.backend.model.OrderStatus;
import com.stockmeister.backend.model.PaymentMethod;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

       List<Order> findByTableNumber(String tableNumber);

       List<Order> findByStatus(OrderStatus status);

       List<Order> findByPaymentMethod(PaymentMethod paymentMethod);

       List<Order> findByWaiterId(Long waiterId);

       @Query("SELECT o FROM Order o WHERE o.waiter.username = :username")
       List<Order> findByWaiterUsername(@Param("username") String username);

       @Query("SELECT DISTINCT o FROM Order o " +
                     "LEFT JOIN FETCH o.orderItems oi " +
                     "LEFT JOIN FETCH oi.recipe " +
                     "LEFT JOIN FETCH o.waiter " +
                     "WHERE o.id = :id")
       Optional<Order> findByIdWithItems(@Param("id") Long id);

       @Query("SELECT DISTINCT o FROM Order o " +
                     "LEFT JOIN FETCH o.orderItems oi " +
                     "LEFT JOIN FETCH oi.recipe " +
                     "LEFT JOIN FETCH o.waiter " +
                     "ORDER BY o.createdAt DESC")
       List<Order> findAllWithItems();

       @Query("SELECT DISTINCT o FROM Order o " +
                     "LEFT JOIN FETCH o.orderItems oi " +
                     "LEFT JOIN FETCH oi.recipe " +
                     "LEFT JOIN FETCH o.waiter " +
                     "WHERE o.status = :status " +
                     "ORDER BY o.createdAt DESC")
       List<Order> findByStatusWithItems(@Param("status") OrderStatus status);

       List<Order> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end);

       @Query("SELECT o FROM Order o WHERE DATE(o.createdAt) = DATE(:date)")
       List<Order> findByCreatedDate(@Param("date") LocalDateTime date);

       @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o " +
                     "WHERE o.status = 'COMPLETED' " +
                     "AND o.createdAt BETWEEN :start AND :end")
       BigDecimal calculateTotalRevenue(@Param("start") LocalDateTime start,
                     @Param("end") LocalDateTime end);

       long countByStatus(OrderStatus status);

       long countByWaiterId(Long waiterId);

       @Query("SELECT o FROM Order o " +
                     "WHERE o.status NOT IN ('COMPLETED', 'CANCELLED') " +
                     "ORDER BY o.createdAt ASC")
       List<Order> findActiveOrders();

       @Query("SELECT DISTINCT o FROM Order o " +
                     "LEFT JOIN FETCH o.orderItems oi " +
                     "LEFT JOIN FETCH oi.recipe " +
                     "LEFT JOIN FETCH o.waiter " +
                     "WHERE o.status NOT IN ('COMPLETED', 'CANCELLED') " +
                     "ORDER BY o.createdAt ASC")
       List<Order> findActiveOrdersWithItems();
}

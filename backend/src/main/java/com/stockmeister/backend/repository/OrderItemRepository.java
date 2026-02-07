package com.stockmeister.backend.repository;

import com.stockmeister.backend.model.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    List<OrderItem> findByOrderId(Long orderId);

    List<OrderItem> findByRecipeId(Long recipeId);

    @Query("SELECT COALESCE(SUM(oi.quantity), 0) FROM OrderItem oi WHERE oi.recipe.id = :recipeId")
    Long countTotalQuantityByRecipeId(@Param("recipeId") Long recipeId);

    @Query("SELECT oi.recipe.id, oi.recipeName, SUM(oi.quantity) as totalQty " +
            "FROM OrderItem oi " +
            "GROUP BY oi.recipe.id, oi.recipeName " +
            "ORDER BY totalQty DESC")
    List<Object[]> findTopSellingRecipes();
}

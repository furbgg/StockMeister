package com.stockmeister.backend.repository;

import com.stockmeister.backend.model.Ingredient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface IngredientRepository extends JpaRepository<Ingredient, Long> {

       Optional<Ingredient> findByNameIgnoreCase(String name);

       List<Ingredient> findByCategory(String category);

       List<Ingredient> findByNameContainingIgnoreCase(String name);

       boolean existsByNameIgnoreCase(String name);

       @Query("SELECT i FROM Ingredient i WHERE i.isActive = true AND i.currentStock < i.minimumStock")
       List<Ingredient> findLowStockIngredients();

       @Query("SELECT i FROM Ingredient i WHERE i.isActive = true AND " +
                     "COALESCE(i.currentStock, 0) <= COALESCE(i.minimumStock, 0) * :multiplier")
       List<Ingredient> findLowStockIngredientsWithMultiplier(@Param("multiplier") BigDecimal multiplier);

       @Query("SELECT i FROM Ingredient i WHERE i.isActive = true AND COALESCE(i.currentStock, 0) = 0")
       List<Ingredient> findOutOfStockIngredients();

       @Query("SELECT i FROM Ingredient i WHERE " +
                     "i.isActive = true AND " +
                     "COALESCE(i.currentStock, 0) > 0 AND " +
                     "COALESCE(i.currentStock, 0) < COALESCE(i.minimumStock, 0)")
       List<Ingredient> findLowStockButNotEmpty();

       List<Ingredient> findAllByIsActiveTrue();

       List<Ingredient> findByCategoryAndIsActiveTrue(String category);

       List<Ingredient> findByNameContainingIgnoreCaseAndIsActiveTrue(String name);
}
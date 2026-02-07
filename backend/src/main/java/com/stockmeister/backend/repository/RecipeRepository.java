package com.stockmeister.backend.repository;

import com.stockmeister.backend.model.Recipe;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RecipeRepository extends JpaRepository<Recipe, Long> {

       Optional<Recipe> findByNameIgnoreCase(String name);

       boolean existsByNameIgnoreCase(String name);

       List<Recipe> findByNameContainingIgnoreCase(String name);

       @Query("SELECT DISTINCT r " +
                     "FROM Recipe r " +
                     "LEFT JOIN FETCH r.ingredients ri " +
                     "LEFT JOIN FETCH ri.ingredient " +
                     "WHERE r.id = :id")
       Optional<Recipe> findByIdWithIngredients(@Param("id") Long id);

       @Query("SELECT DISTINCT r " +
                     "FROM Recipe r " +
                     "LEFT JOIN FETCH r.ingredients ri " +
                     "LEFT JOIN FETCH ri.ingredient " +
                     "WHERE r.isActive = true")
       List<Recipe> findAllWithIngredients();

       List<Recipe> findAllByIsActiveTrue();

       List<Recipe> findByNameContainingIgnoreCaseAndIsActiveTrue(String name);
}
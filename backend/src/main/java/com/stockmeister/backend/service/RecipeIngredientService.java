package com.stockmeister.backend.service;

import com.stockmeister.backend.dto.RecipeIngredientRequest;
import com.stockmeister.backend.model.Ingredient;
import com.stockmeister.backend.model.Recipe;
import com.stockmeister.backend.model.RecipeIngredient;
import com.stockmeister.backend.repository.IngredientRepository;
import com.stockmeister.backend.repository.RecipeIngredientRepository;
import com.stockmeister.backend.repository.RecipeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class RecipeIngredientService {

    private final RecipeRepository recipeRepository;
    private final IngredientRepository ingredientRepository;
    private final RecipeIngredientRepository recipeIngredientRepository;

    @Transactional(readOnly = true)
    public List<RecipeIngredient> getByRecipeId(Long recipeId) {
        log.info("Fetching ingredients for recipe {}", recipeId);
        return recipeIngredientRepository.findByRecipeIdWithIngredient(recipeId);
    }

    @Transactional
    public Recipe updateRecipeIngredients(Long recipeId, List<RecipeIngredientRequest> items) {
        log.info("Updating ingredients for recipe {}. Item count: {}", recipeId,
                items != null ? items.size() : 0);

        if (items != null) {
            for (RecipeIngredientRequest item : items) {
                log.info("  Item: ingredientId={}, amount={}", item.getIngredientId(), item.getAmount());
            }
        }

        Recipe recipe = recipeRepository.findById(recipeId)
                .orElseThrow(() -> new RuntimeException("Recipe not found with id: " + recipeId));

        recipeIngredientRepository.deleteByRecipeId(recipeId);
        log.info("Deleted existing ingredients for recipe {}", recipeId);

        List<RecipeIngredient> savedIngredients = new ArrayList<>();

        if (items != null && !items.isEmpty()) {
            List<RecipeIngredient> newLines = new ArrayList<>();

            for (RecipeIngredientRequest item : items) {
                if (item.getIngredientId() == null) {
                    log.warn("Skipping item with null ingredientId");
                    continue;
                }

                BigDecimal amount = item.getAmount() != null ? item.getAmount() : BigDecimal.ZERO;
                if (amount.compareTo(BigDecimal.ZERO) <= 0) {
                    log.warn("Skipping item with zero or negative amount: {}", amount);
                    continue;
                }

                Ingredient ingredient = ingredientRepository.findById(item.getIngredientId())
                        .orElseThrow(() -> new RuntimeException(
                                "Ingredient not found with id: " + item.getIngredientId()));

                RecipeIngredient ri = RecipeIngredient.builder()
                        .recipe(recipe)
                        .ingredient(ingredient)
                        .amount(amount)
                        .build();

                newLines.add(ri);
                log.info("Prepared ingredient '{}' with amount {}", ingredient.getName(), amount);
            }

            if (!newLines.isEmpty()) {
                savedIngredients = recipeIngredientRepository.saveAll(newLines);
                log.info("Saved {} recipe ingredients", savedIngredients.size());
            }
        }

        Recipe updatedRecipe = recipeRepository.findByIdWithIngredients(recipeId)
                .orElse(recipe);

        log.info("Recipe updated successfully. Total ingredients: {}", savedIngredients.size());
        return updatedRecipe;
    }
}

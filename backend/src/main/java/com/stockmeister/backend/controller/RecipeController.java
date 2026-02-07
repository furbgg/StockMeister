package com.stockmeister.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.stockmeister.backend.dto.RecipeDTO;
import com.stockmeister.backend.model.Recipe;
import com.stockmeister.backend.service.RecipeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/recipes")
@RequiredArgsConstructor
@Slf4j
public class RecipeController {

    private final RecipeService recipeService;
    private final ObjectMapper objectMapper;

    @GetMapping
    public ResponseEntity<List<RecipeDTO>> getAllRecipes(
            @RequestParam(required = false, defaultValue = "false") boolean withIngredients,
            @RequestParam(required = false) String search) {
        log.info("GET /api/recipes - withIngredients: {}, search: {}", withIngredients, search);

        List<Recipe> recipes;
        if (search != null && !search.isEmpty()) {
            recipes = recipeService.searchRecipesByName(search);
        } else if (withIngredients) {
            recipes = recipeService.getAllRecipesWithIngredients();
        } else {
            recipes = recipeService.getAllRecipes();
        }

        List<RecipeDTO> dtos = recipes.stream()
                .map(recipe -> withIngredients || (search != null && !search.isEmpty())
                        ? RecipeDTO.fromEntityWithIngredients(recipe)
                        : RecipeDTO.fromEntity(recipe))
                .collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/{id}")
    public ResponseEntity<RecipeDTO> getRecipeById(
            @PathVariable Long id,
            @RequestParam(required = false, defaultValue = "true") boolean withIngredients) {
        log.info("GET /api/recipes/{} - withIngredients: {}", id, withIngredients);

        Recipe recipe = withIngredients
                ? recipeService.getRecipeByIdWithIngredients(id)
                : recipeService.getRecipeById(id);

        RecipeDTO dto = withIngredients
                ? RecipeDTO.fromEntityWithIngredients(recipe)
                : RecipeDTO.fromEntity(recipe);

        return ResponseEntity.ok(dto);
    }

    @PostMapping(consumes = { MediaType.MULTIPART_FORM_DATA_VALUE })
    public ResponseEntity<RecipeDTO> createRecipe(
            @RequestPart("recipe") String recipeJson,
            @RequestPart(value = "image", required = false) MultipartFile image) {
        log.info("POST /api/recipes - Creating new recipe with image support");

        try {
            Recipe recipe = objectMapper.readValue(recipeJson, Recipe.class);
            log.info("Parsed recipe: {}", recipe.getName());

            if (image != null && !image.isEmpty()) {
                log.info("Image received: {} ({})", image.getOriginalFilename(), image.getSize());
            }

            Recipe createdRecipe = recipeService.createRecipe(recipe, image);
            return ResponseEntity.status(HttpStatus.CREATED).body(RecipeDTO.fromEntity(createdRecipe));

        } catch (Exception e) {
            log.error("Error creating recipe: {}", e.getMessage());
            throw new RuntimeException("Failed to create recipe: " + e.getMessage());
        }
    }

    @PutMapping(value = "/{id}", consumes = { MediaType.MULTIPART_FORM_DATA_VALUE })
    public ResponseEntity<RecipeDTO> updateRecipe(
            @PathVariable Long id,
            @RequestPart("recipe") String recipeJson,
            @RequestPart(value = "image", required = false) MultipartFile image) {
        log.info("PUT /api/recipes/{} - Updating with image support", id);

        try {
            Recipe recipe = objectMapper.readValue(recipeJson, Recipe.class);
            log.info("Parsed recipe for update: {}", recipe.getName());

            if (image != null && !image.isEmpty()) {
                log.info("New image received: {} ({})", image.getOriginalFilename(), image.getSize());
            }

            Recipe updatedRecipe = recipeService.updateRecipe(id, recipe, image);
            return ResponseEntity.ok(RecipeDTO.fromEntityWithIngredients(updatedRecipe));

        } catch (Exception e) {
            log.error("Error updating recipe: {}", e.getMessage());
            throw new RuntimeException("Failed to update recipe: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRecipe(@PathVariable Long id) {
        log.info("DELETE /api/recipes/{}", id);
        recipeService.deleteRecipe(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/cost")
    public ResponseEntity<Map<String, Object>> getRecipeCost(@PathVariable Long id) {
        log.info("GET /api/recipes/{}/cost", id);

        BigDecimal cost = recipeService.calculateCost(id);
        Recipe recipe = recipeService.getRecipeById(id);

        Map<String, Object> response = new HashMap<>();
        response.put("recipeId", recipe.getId());
        response.put("recipeName", recipe.getName());
        response.put("cost", cost);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}/profit")
    public ResponseEntity<Map<String, Object>> getRecipeProfit(@PathVariable Long id) {
        log.info("GET /api/recipes/{}/profit", id);

        Recipe recipe = recipeService.getRecipeById(id);
        BigDecimal cost = recipeService.calculateCost(id);
        BigDecimal profitMargin = recipeService.calculateProfitMargin(id);

        BigDecimal sellingPrice = recipe.getSellingPrice() != null
                ? recipe.getSellingPrice()
                : BigDecimal.ZERO;

        BigDecimal profitPercentage = BigDecimal.ZERO;
        if (sellingPrice.compareTo(BigDecimal.ZERO) > 0) {
            profitPercentage = profitMargin
                    .divide(sellingPrice, 4, RoundingMode.HALF_UP)
                    .multiply(new BigDecimal("100"))
                    .setScale(2, RoundingMode.HALF_UP);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("recipeId", recipe.getId());
        response.put("sellingPrice", sellingPrice);
        response.put("cost", cost);
        response.put("profitMargin", profitMargin);
        response.put("profitPercentage", profitPercentage);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/sell")
    public ResponseEntity<Map<String, Object>> sellRecipe(
            @PathVariable Long id,
            @RequestParam(required = false, defaultValue = "1") int quantity) {
        log.info("POST /api/recipes/{}/sell - quantity: {}", id, quantity);

        recipeService.deductStockForRecipe(id, quantity);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", String.format("Sold %d unit(s) successfully", quantity));
        response.put("recipeId", id);
        response.put("quantitySold", quantity);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}/can-sell")
    public ResponseEntity<Map<String, Object>> canSellRecipe(
            @PathVariable Long id,
            @RequestParam(required = false, defaultValue = "1") int quantity) {
        log.info("GET /api/recipes/{}/can-sell - quantity: {}", id, quantity);

        boolean canSell = recipeService.canSellRecipe(id, quantity);
        int maxQuantity = recipeService.getMaxSellableQuantity(id);

        Map<String, Object> response = new HashMap<>();
        response.put("recipeId", id);
        response.put("requestedQuantity", quantity);
        response.put("canSell", canSell);
        response.put("maxSellableQuantity", maxQuantity);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}/max-sellable")
    public ResponseEntity<Map<String, Object>> getMaxSellable(@PathVariable Long id) {
        log.info("GET /api/recipes/{}/max-sellable", id);

        int maxQuantity = recipeService.getMaxSellableQuantity(id);
        Recipe recipe = recipeService.getRecipeById(id);

        Map<String, Object> response = new HashMap<>();
        response.put("recipeId", id);
        response.put("recipeName", recipe.getName());
        response.put("maxSellableQuantity", maxQuantity);

        return ResponseEntity.ok(response);
    }
}

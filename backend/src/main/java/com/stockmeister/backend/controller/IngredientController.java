package com.stockmeister.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.stockmeister.backend.dto.IngredientDTO;
import com.stockmeister.backend.model.Ingredient;
import com.stockmeister.backend.service.IngredientService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import com.stockmeister.backend.dto.StockAdjustmentRequest;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/ingredients")
@RequiredArgsConstructor
@Slf4j
public class IngredientController {

    private final IngredientService ingredientService;
    private final ObjectMapper objectMapper;

    @GetMapping
    public ResponseEntity<List<IngredientDTO>> getAllIngredients(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean lowStock) {
        log.info("GET /api/ingredients - category: {}, search: {}, lowStock: {}", category, search, lowStock);

        List<Ingredient> ingredients;

        if (lowStock != null && lowStock) {
            ingredients = ingredientService.getLowStockIngredients();
        } else if (search != null && !search.isEmpty()) {
            ingredients = ingredientService.searchIngredientsByName(search);
        } else if (category != null && !category.isEmpty()) {
            ingredients = ingredientService.getIngredientsByCategory(category);
        } else {
            ingredients = ingredientService.getAllIngredients();
        }

        List<IngredientDTO> dtos = ingredients.stream()
                .map(IngredientDTO::fromEntity)
                .collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/{id}")
    public ResponseEntity<IngredientDTO> getIngredientById(@PathVariable Long id) {
        log.info("GET /api/ingredients/{}", id);

        Ingredient ingredient = ingredientService.getIngredientById(id);
        return ResponseEntity.ok(IngredientDTO.fromEntity(ingredient));
    }

    @PostMapping(consumes = { MediaType.MULTIPART_FORM_DATA_VALUE })
    public ResponseEntity<IngredientDTO> createIngredient(
            @RequestPart("ingredient") String ingredientJson,
            @RequestPart(value = "image", required = false) MultipartFile image) {
        log.info("POST /api/ingredients - Creating new ingredient with image support");

        try {
            Ingredient ingredient = objectMapper.readValue(ingredientJson, Ingredient.class);
            log.info("Parsed ingredient: {}", ingredient.getName());

            if (image != null && !image.isEmpty()) {
                log.info("Image received: {} ({})", image.getOriginalFilename(), image.getSize());
            }

            Ingredient createdIngredient = ingredientService.createIngredient(ingredient, image);
            return ResponseEntity.status(HttpStatus.CREATED).body(IngredientDTO.fromEntity(createdIngredient));
        } catch (Exception e) {
            log.error("Error creating ingredient: {}", e.getMessage());
            throw new RuntimeException("Failed to create ingredient: " + e.getMessage());
        }
    }

    @PutMapping(value = "/{id}", consumes = { MediaType.MULTIPART_FORM_DATA_VALUE })
    public ResponseEntity<IngredientDTO> updateIngredient(
            @PathVariable Long id,
            @RequestPart("ingredient") String ingredientJson,
            @RequestPart(value = "image", required = false) MultipartFile image) {
        log.info("PUT /api/ingredients/{} - Updating with image support", id);

        try {
            Ingredient ingredient = objectMapper.readValue(ingredientJson, Ingredient.class);
            log.info("Parsed ingredient for update: {}", ingredient.getName());

            if (image != null && !image.isEmpty()) {
                log.info("New image received: {} ({})", image.getOriginalFilename(), image.getSize());
            }

            Ingredient updatedIngredient = ingredientService.updateIngredient(id, ingredient, image);
            return ResponseEntity.ok(IngredientDTO.fromEntity(updatedIngredient));
        } catch (Exception e) {
            log.error("Error updating ingredient: {}", e.getMessage());
            throw new RuntimeException("Failed to update ingredient: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteIngredient(@PathVariable Long id) {
        log.info("DELETE /api/ingredients/{}", id);

        ingredientService.deleteIngredient(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/low-stock")
    public ResponseEntity<List<IngredientDTO>> getLowStockIngredients(
            @RequestParam(required = false, defaultValue = "1.0") BigDecimal thresholdMultiplier) {
        log.info("GET /api/ingredients/low-stock - thresholdMultiplier: {}", thresholdMultiplier);

        List<Ingredient> lowStockIngredients = ingredientService.getLowStockIngredients(thresholdMultiplier);
        List<IngredientDTO> dtos = lowStockIngredients.stream()
                .map(IngredientDTO::fromEntity)
                .collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/out-of-stock")
    public ResponseEntity<List<IngredientDTO>> getOutOfStockIngredients() {
        log.info("GET /api/ingredients/out-of-stock");
        List<Ingredient> outOfStockIngredients = ingredientService.getOutOfStockIngredients();
        List<IngredientDTO> dtos = outOfStockIngredients.stream()
                .map(IngredientDTO::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/low-stock-only")
    public ResponseEntity<List<IngredientDTO>> getLowStockButNotEmpty() {
        log.info("GET /api/ingredients/low-stock-only");
        List<Ingredient> lowStockIngredients = ingredientService.getLowStockButNotEmpty();
        List<IngredientDTO> dtos = lowStockIngredients.stream()
                .map(IngredientDTO::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @PatchMapping("/{id}/stock")
    public ResponseEntity<IngredientDTO> updateStock(
            @PathVariable Long id,
            @RequestParam BigDecimal newStock) {
        log.info("PATCH /api/ingredients/{}/stock - newStock: {}", id, newStock);

        Ingredient updatedIngredient = ingredientService.updateStock(id, newStock);
        return ResponseEntity.ok(IngredientDTO.fromEntity(updatedIngredient));
    }

    @PostMapping("/stock-count")
    public ResponseEntity<Void> updateStockCount(@RequestBody List<StockAdjustmentRequest> adjustments) {
        ingredientService.updateStockCount(adjustments);
        return ResponseEntity.ok().build();
    }
}

package com.stockmeister.backend.controller;

import com.stockmeister.backend.dto.RecipeIngredientRequest;
import com.stockmeister.backend.model.Recipe;
import com.stockmeister.backend.model.RecipeIngredient;
import com.stockmeister.backend.service.RecipeIngredientService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/recipes/{recipeId}/ingredients")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "http://localhost:5173")
public class RecipeIngredientController {

    private final RecipeIngredientService recipeIngredientService;

    @GetMapping
    public ResponseEntity<List<RecipeIngredient>> getRecipeIngredients(@PathVariable Long recipeId) {
        log.info("GET /api/recipes/{}/ingredients", recipeId);
        List<RecipeIngredient> items = recipeIngredientService.getByRecipeId(recipeId);
        return ResponseEntity.ok(items);
    }

    @PostMapping
    public ResponseEntity<Recipe> updateRecipeIngredients(
            @PathVariable Long recipeId,
            @RequestBody List<RecipeIngredientRequest> items) {
        log.info("POST /api/recipes/{}/ingredients - updating {} items",
                recipeId, items != null ? items.size() : 0);
        Recipe updated = recipeIngredientService.updateRecipeIngredients(recipeId, items);
        return ResponseEntity.ok(updated);
    }
}

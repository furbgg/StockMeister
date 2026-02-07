package com.stockmeister.backend.service;

import com.stockmeister.backend.model.Ingredient;
import com.stockmeister.backend.model.Recipe;
import com.stockmeister.backend.model.RecipeIngredient;
import com.stockmeister.backend.repository.IngredientRepository;
import com.stockmeister.backend.repository.RecipeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class RecipeService {

    private final RecipeRepository recipeRepository;
    private final IngredientRepository ingredientRepository;

    private static final String UPLOAD_DIR = "uploads/recipes/";

    public List<Recipe> getAllRecipes() {
        log.info("Fetching all active recipes");
        return recipeRepository.findAllByIsActiveTrue();
    }

    public List<Recipe> getAllRecipesWithIngredients() {
        log.info("Fetching all recipes with ingredients");
        return recipeRepository.findAllWithIngredients();
    }

    public List<Recipe> searchRecipesByName(String name) {
        log.info("Searching recipes with name containing: {}", name);
        return recipeRepository.findByNameContainingIgnoreCase(name);
    }

    public Recipe getRecipeById(Long id) {
        log.info("Fetching recipe with id: {}", id);
        return recipeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Recipe not found with id: " + id));
    }

    public Recipe getRecipeByIdWithIngredients(Long id) {
        log.info("Fetching recipe with id and ingredients: {}", id);
        return recipeRepository.findByIdWithIngredients(id)
                .orElseThrow(() -> new RuntimeException("Recipe not found with id: " + id));
    }

    @Transactional
    public Recipe createRecipe(Recipe recipe, MultipartFile image) {
        log.info("Creating new recipe: {}", recipe.getName());

        if (image != null && !image.isEmpty()) {
            String imagePath = saveImage(image);
            recipe.setImagePath(imagePath);
            log.info("Image saved at: {}", imagePath);
        }

        if (recipe.getIngredients() != null) {
            recipe.getIngredients().forEach(ri -> ri.setRecipe(recipe));
        }

        Recipe savedRecipe = recipeRepository.save(recipe);
        log.info("Successfully created recipe with id: {}", savedRecipe.getId());
        return savedRecipe;
    }

    @Transactional
    public Recipe save(Recipe recipe, MultipartFile image) {
        return createRecipe(recipe, image);
    }

    @Transactional
    public Recipe updateRecipe(Long id, Recipe updatedRecipe, MultipartFile image) {
        log.info("Updating recipe with id: {}", id);

        Recipe existingRecipe = recipeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Recipe not found with id: " + id));

        if (updatedRecipe.getName() != null) {
            existingRecipe.setName(updatedRecipe.getName());
        }
        if (updatedRecipe.getDescription() != null) {
            existingRecipe.setDescription(updatedRecipe.getDescription());
        }
        if (updatedRecipe.getSellingPrice() != null) {
            existingRecipe.setSellingPrice(updatedRecipe.getSellingPrice());
        }

        if (updatedRecipe.getIngredients() != null) {
            existingRecipe.getIngredients().clear();
            updatedRecipe.getIngredients().forEach(existingRecipe::addIngredient);
        }

        if (image != null && !image.isEmpty()) {
            deleteOldImage(existingRecipe.getImagePath());
            String newImagePath = saveImage(image);
            existingRecipe.setImagePath(newImagePath);
            log.info("Image updated at: {}", newImagePath);
        } else if (updatedRecipe.getImagePath() == null && existingRecipe.getImagePath() != null) {
            log.info("Image removed for recipe: {}", existingRecipe.getName());
            deleteOldImage(existingRecipe.getImagePath());
            existingRecipe.setImagePath(null);
        }

        return recipeRepository.save(existingRecipe);
    }

    @Transactional
    public Recipe updateRecipe(Long id, Recipe updatedRecipe) {
        return updateRecipe(id, updatedRecipe, null);
    }

    @Transactional
    public void deleteRecipe(Long id) {
        log.info("Soft deleting recipe with id: {}", id);

        Recipe recipe = recipeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Recipe not found with id: " + id));

        recipe.setActive(false);
        recipe.setDeletedAt(java.time.LocalDateTime.now());
        recipeRepository.save(recipe);

        log.info("Recipe {} soft deleted successfully", recipe.getName());
    }

    public BigDecimal calculateCost(Long recipeId) {
        Recipe recipe = getRecipeByIdWithIngredients(recipeId);
        BigDecimal totalCost = BigDecimal.ZERO;

        for (RecipeIngredient ri : recipe.getIngredients()) {
            BigDecimal amount = ri.getAmount() != null ? ri.getAmount() : BigDecimal.ZERO;
            BigDecimal unitPrice = ri.getIngredient().getUnitPrice() != null
                    ? ri.getIngredient().getUnitPrice()
                    : BigDecimal.ZERO;
            totalCost = totalCost.add(amount.multiply(unitPrice));
        }
        return totalCost.setScale(2, RoundingMode.HALF_UP);
    }

    public BigDecimal calculateProfitMargin(Long recipeId) {
        BigDecimal cost = calculateCost(recipeId);
        Recipe recipe = getRecipeById(recipeId);
        BigDecimal sellingPrice = recipe.getSellingPrice() != null
                ? recipe.getSellingPrice()
                : BigDecimal.ZERO;
        return sellingPrice.subtract(cost).setScale(2, RoundingMode.HALF_UP);
    }

    @Transactional
    public void deductStockForRecipe(Long recipeId, int quantity) {
        log.info("Deducting stock for recipe {} (quantity: {})", recipeId, quantity);

        if (quantity <= 0) {
            throw new RuntimeException("Quantity must be positive");
        }

        Recipe recipe = getRecipeByIdWithIngredients(recipeId);

        if (recipe.getIngredients() == null || recipe.getIngredients().isEmpty()) {
            log.warn("Recipe {} has no ingredients defined", recipeId);
            return;
        }

        for (RecipeIngredient ri : recipe.getIngredients()) {
            Ingredient ingredient = ri.getIngredient();
            BigDecimal requiredAmount = ri.getAmount().multiply(BigDecimal.valueOf(quantity));
            BigDecimal currentStock = ingredient.getCurrentStock() != null
                    ? ingredient.getCurrentStock()
                    : BigDecimal.ZERO;

            if (currentStock.compareTo(requiredAmount) < 0) {
                throw new RuntimeException(String.format(
                        "Insufficient stock for ingredient '%s'. Required: %s, Available: %s",
                        ingredient.getName(),
                        requiredAmount.setScale(3, RoundingMode.HALF_UP),
                        currentStock.setScale(3, RoundingMode.HALF_UP)));
            }
        }

        for (RecipeIngredient ri : recipe.getIngredients()) {
            Ingredient ingredient = ri.getIngredient();
            BigDecimal requiredAmount = ri.getAmount().multiply(BigDecimal.valueOf(quantity));
            BigDecimal newStock = ingredient.getCurrentStock().subtract(requiredAmount);

            log.info("Deducting {} {} from ingredient '{}'. New stock: {}",
                    requiredAmount, ingredient.getUnit(), ingredient.getName(), newStock);

            ingredient.setCurrentStock(newStock);
            ingredientRepository.save(ingredient);
        }

        log.info("Successfully deducted stock for {} unit(s) of recipe '{}'",
                quantity, recipe.getName());
    }

    @Transactional
    public void sellRecipe(Long recipeId) {
        deductStockForRecipe(recipeId, 1);
    }

    @Transactional
    public void sellRecipe(Long recipeId, int quantity) {
        deductStockForRecipe(recipeId, quantity);
    }

    public boolean canSellRecipe(Long recipeId, int quantity) {
        Recipe recipe = getRecipeByIdWithIngredients(recipeId);

        if (recipe.getIngredients() == null || recipe.getIngredients().isEmpty()) {
            return true;
        }

        for (RecipeIngredient ri : recipe.getIngredients()) {
            Ingredient ingredient = ri.getIngredient();
            BigDecimal requiredAmount = ri.getAmount().multiply(BigDecimal.valueOf(quantity));
            BigDecimal currentStock = ingredient.getCurrentStock() != null
                    ? ingredient.getCurrentStock()
                    : BigDecimal.ZERO;

            if (currentStock.compareTo(requiredAmount) < 0) {
                return false;
            }
        }
        return true;
    }

    public int getMaxSellableQuantity(Long recipeId) {
        Recipe recipe = getRecipeByIdWithIngredients(recipeId);

        if (recipe.getIngredients() == null || recipe.getIngredients().isEmpty()) {
            return Integer.MAX_VALUE;
        }

        int maxQuantity = Integer.MAX_VALUE;

        for (RecipeIngredient ri : recipe.getIngredients()) {
            Ingredient ingredient = ri.getIngredient();
            BigDecimal currentStock = ingredient.getCurrentStock() != null
                    ? ingredient.getCurrentStock()
                    : BigDecimal.ZERO;
            BigDecimal amountPerUnit = ri.getAmount();

            if (amountPerUnit.compareTo(BigDecimal.ZERO) > 0) {
                int possibleUnits = currentStock.divide(amountPerUnit, 0, RoundingMode.DOWN).intValue();
                maxQuantity = Math.min(maxQuantity, possibleUnits);
            }
        }

        return maxQuantity == Integer.MAX_VALUE ? 0 : maxQuantity;
    }

    @Transactional
    public void recalculateCostsForIngredient(Long ingredientId) {
        log.info("Recalculating costs for recipes containing ingredient ID: {}", ingredientId);
    }

    private String saveImage(MultipartFile image) {
        try {
            Path uploadPath = Paths.get(UPLOAD_DIR);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
                log.info("Created upload directory: {}", uploadPath.toAbsolutePath());
            }

            String originalFilename = image.getOriginalFilename();
            if (originalFilename == null || originalFilename.isEmpty()) {
                originalFilename = "image";
            }

            String extension = "";
            int dotIndex = originalFilename.lastIndexOf('.');
            if (dotIndex > 0) {
                extension = originalFilename.substring(dotIndex);
                originalFilename = originalFilename.substring(0, dotIndex);
            }

            String uniqueFilename = originalFilename + "_" +
                    UUID.randomUUID().toString().substring(0, 8) + extension;

            Path filePath = uploadPath.resolve(uniqueFilename);
            Files.copy(image.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            log.info("Image saved successfully: {}", filePath.toAbsolutePath());
            return UPLOAD_DIR + uniqueFilename;

        } catch (IOException e) {
            log.error("Failed to save image: {}", e.getMessage());
            throw new RuntimeException("Failed to save image: " + e.getMessage());
        }
    }

    private void deleteOldImage(String imagePath) {
        if (imagePath == null || imagePath.isEmpty()) {
            return;
        }

        try {
            Path path = Paths.get(imagePath);
            if (Files.exists(path)) {
                Files.delete(path);
                log.info("Old image deleted: {}", imagePath);
            }
        } catch (IOException e) {
            log.warn("Failed to delete old image: {}", e.getMessage());
        }
    }
}

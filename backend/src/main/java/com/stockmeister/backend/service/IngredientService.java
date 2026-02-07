package com.stockmeister.backend.service;

import com.stockmeister.backend.model.Ingredient;
import com.stockmeister.backend.repository.IngredientRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import com.stockmeister.backend.dto.StockAdjustmentRequest;
import java.io.IOException;
import java.math.BigDecimal;
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
public class IngredientService {

    private final IngredientRepository ingredientRepository;

    private static final String UPLOAD_DIR = "uploads/ingredients/";

    private RecipeService recipeService;

    @Autowired
    public void setRecipeService(@Lazy RecipeService recipeService) {
        this.recipeService = recipeService;
    }

    public List<Ingredient> getAllIngredients() {
        log.info("Fetching all active ingredients");
        return ingredientRepository.findAllByIsActiveTrue();
    }

    public Ingredient getIngredientById(Long id) {
        log.info("Fetching ingredient with id: {}", id);
        return ingredientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ingredient not found with id: " + id));
    }

    public List<Ingredient> searchIngredientsByName(String name) {
        log.info("Searching ingredients with name containing: {}", name);
        return ingredientRepository.findByNameContainingIgnoreCase(name);
    }

    public List<Ingredient> getIngredientsByCategory(String category) {
        log.info("Fetching ingredients in category: {}", category);
        return ingredientRepository.findByCategory(category);
    }

    public List<Ingredient> getLowStockIngredients() {
        log.info("Fetching low stock ingredients");
        return ingredientRepository.findLowStockIngredients();
    }

    public List<Ingredient> getLowStockIngredients(BigDecimal multiplier) {
        if (multiplier == null || multiplier.compareTo(BigDecimal.ZERO) <= 0) {
            multiplier = BigDecimal.ONE;
        }
        log.info("Fetching low stock ingredients with multiplier: {}", multiplier);
        return ingredientRepository.findLowStockIngredientsWithMultiplier(multiplier);
    }

    public List<Ingredient> getOutOfStockIngredients() {
        log.info("Fetching out of stock ingredients");
        return ingredientRepository.findOutOfStockIngredients();
    }

    public List<Ingredient> getLowStockButNotEmpty() {
        log.info("Fetching low stock (but not empty) ingredients");
        return ingredientRepository.findLowStockButNotEmpty();
    }

    @Transactional
    public Ingredient createIngredient(Ingredient ingredient, MultipartFile image) {
        log.info("Creating new ingredient: {}", ingredient.getName());

        if (ingredientRepository.existsByNameIgnoreCase(ingredient.getName())) {
            throw new RuntimeException("Ingredient with name '" + ingredient.getName() + "' already exists");
        }

        if (ingredient.getCurrentStock() == null)
            ingredient.setCurrentStock(BigDecimal.ZERO);
        if (ingredient.getMinimumStock() == null)
            ingredient.setMinimumStock(BigDecimal.ZERO);

        if (image != null && !image.isEmpty()) {
            String imagePath = saveImage(image);
            ingredient.setImagePath(imagePath);
            log.info("Image saved at: {}", imagePath);
        }

        Ingredient savedIngredient = ingredientRepository.save(ingredient);
        log.info("Successfully created ingredient with id: {}", savedIngredient.getId());
        return savedIngredient;
    }

    @Transactional
    public Ingredient createIngredient(Ingredient ingredient) {
        return createIngredient(ingredient, null);
    }

    @Transactional
    public Ingredient updateIngredient(Long id, Ingredient updatedIngredient, MultipartFile image) {
        log.info("Updating ingredient with id: {}", id);

        Ingredient existingIngredient = ingredientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ingredient not found with id: " + id));

        if (updatedIngredient.getName() != null) {
            if (!existingIngredient.getName().equalsIgnoreCase(updatedIngredient.getName())
                    && ingredientRepository.existsByNameIgnoreCase(updatedIngredient.getName())) {
                throw new RuntimeException("Ingredient with name '" + updatedIngredient.getName() + "' already exists");
            }
            existingIngredient.setName(updatedIngredient.getName());
        }

        if (updatedIngredient.getCategory() != null)
            existingIngredient.setCategory(updatedIngredient.getCategory());
        if (updatedIngredient.getUnit() != null)
            existingIngredient.setUnit(updatedIngredient.getUnit());
        if (updatedIngredient.getCurrentStock() != null)
            existingIngredient.setCurrentStock(updatedIngredient.getCurrentStock());
        if (updatedIngredient.getMinimumStock() != null)
            existingIngredient.setMinimumStock(updatedIngredient.getMinimumStock());

        if (updatedIngredient.getUnitPrice() != null) {
            BigDecimal oldPrice = existingIngredient.getUnitPrice() != null ? existingIngredient.getUnitPrice()
                    : BigDecimal.ZERO;
            BigDecimal newPrice = updatedIngredient.getUnitPrice();

            if (oldPrice.compareTo(newPrice) != 0) {
                log.warn("ENFLASYON TESPİT EDİLDİ: '{}' fiyatı değişti: {} -> {}",
                        existingIngredient.getName(), oldPrice, newPrice);

                existingIngredient.setUnitPrice(newPrice);

                Ingredient savedIngredient = ingredientRepository.save(existingIngredient);

                if (recipeService != null) {
                    recipeService.recalculateCostsForIngredient(id);
                } else {
                    log.warn("RecipeService henüz hazır değil, maliyetler güncellenemedi.");
                }

                if (image != null && !image.isEmpty()) {
                    deleteOldImage(existingIngredient.getImagePath());
                    String newImagePath = saveImage(image);
                    savedIngredient.setImagePath(newImagePath);
                    savedIngredient = ingredientRepository.save(savedIngredient);
                    log.info("Image updated at: {}", newImagePath);
                }

                return savedIngredient;
            }
            existingIngredient.setUnitPrice(newPrice);
        }

        if (updatedIngredient.getSupplier() != null)
            existingIngredient.setSupplier(updatedIngredient.getSupplier());
        if (updatedIngredient.getNutritionInfo() != null)
            existingIngredient.setNutritionInfo(updatedIngredient.getNutritionInfo());

        if (image != null && !image.isEmpty()) {
            deleteOldImage(existingIngredient.getImagePath());
            String newImagePath = saveImage(image);
            existingIngredient.setImagePath(newImagePath);
            log.info("Image updated at: {}", newImagePath);
        } else if (updatedIngredient.getImagePath() == null && existingIngredient.getImagePath() != null) {
            log.info("Image removed for ingredient: {}", existingIngredient.getName());
            deleteOldImage(existingIngredient.getImagePath());
            existingIngredient.setImagePath(null);
        }

        return ingredientRepository.save(existingIngredient);
    }

    @Transactional
    public Ingredient updateIngredient(Long id, Ingredient updatedIngredient) {
        return updateIngredient(id, updatedIngredient, null);
    }

    @Transactional
    public void deleteIngredient(Long id) {
        log.info("Soft deleting ingredient with id: {}", id);

        Ingredient ingredient = ingredientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ingredient not found with id: " + id));

        ingredient.setActive(false);
        ingredient.setDeletedAt(java.time.LocalDateTime.now());
        ingredientRepository.save(ingredient);

        log.info("Ingredient {} soft deleted successfully", ingredient.getName());
    }

    @Transactional
    public Ingredient updateStock(Long id, BigDecimal newStock) {
        log.info("Quick stock update for ingredient id: {} -> new stock: {}", id, newStock);

        Ingredient ingredient = ingredientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ingredient not found with id: " + id));

        if (newStock != null && newStock.compareTo(BigDecimal.ZERO) < 0) {
            throw new RuntimeException("Stock cannot be negative");
        }

        BigDecimal oldStock = ingredient.getCurrentStock();
        ingredient.setCurrentStock(newStock != null ? newStock : BigDecimal.ZERO);

        Ingredient savedIngredient = ingredientRepository.save(ingredient);
        log.info("Stock updated for '{}': {} -> {}", ingredient.getName(), oldStock, newStock);

        return savedIngredient;
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

            String uniqueFilename = originalFilename + "_" + UUID.randomUUID().toString().substring(0, 8) + extension;

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

    @Transactional
    public void updateStockCount(List<StockAdjustmentRequest> adjustments) {
        adjustments.forEach(adjustment -> {
            Ingredient ingredient = ingredientRepository.findById(adjustment.getIngredientId())
                    .orElseThrow(() -> new RuntimeException(
                            "Ingredient not found with id: " + adjustment.getIngredientId()));

            ingredient.setCurrentStock(adjustment.getPhysicalCount());
            ingredientRepository.save(ingredient);
        });
    }
}

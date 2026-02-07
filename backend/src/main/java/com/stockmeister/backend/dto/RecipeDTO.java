package com.stockmeister.backend.dto;

import com.stockmeister.backend.model.Recipe;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecipeDTO {

    private Long id;
    private String name;
    private String description;
    private BigDecimal sellingPrice;
    private String imagePath;
    private String category;
    private boolean sendToKitchen;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Builder.Default
    private List<RecipeIngredientDTO> ingredients = new ArrayList<>();

    private BigDecimal totalCost;
    private BigDecimal profitMargin;
    private BigDecimal profitPercentage;

    public static RecipeDTO fromEntity(Recipe entity) {
        if (entity == null)
            return null;

        return RecipeDTO.builder()
                .id(entity.getId())
                .name(entity.getName())
                .description(entity.getDescription())
                .sellingPrice(entity.getSellingPrice())
                .imagePath(entity.getImagePath())
                .category(entity.getCategory())
                .sendToKitchen(entity.isSendToKitchen())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .ingredients(new ArrayList<>())
                .build();
    }

    public static RecipeDTO fromEntityWithIngredients(Recipe entity) {
        if (entity == null)
            return null;

        List<RecipeIngredientDTO> ingredientDTOs = new ArrayList<>();
        BigDecimal totalCost = BigDecimal.ZERO;

        if (entity.getIngredients() != null) {
            ingredientDTOs = entity.getIngredients().stream()
                    .map(RecipeIngredientDTO::fromEntity)
                    .collect(Collectors.toList());

            totalCost = entity.calculateTotalCost();
        }

        BigDecimal sellingPrice = entity.getSellingPrice() != null
                ? entity.getSellingPrice()
                : BigDecimal.ZERO;

        BigDecimal profitMargin = sellingPrice.subtract(totalCost);
        BigDecimal profitPercentage = BigDecimal.ZERO;

        if (sellingPrice.compareTo(BigDecimal.ZERO) > 0) {
            profitPercentage = profitMargin
                    .divide(sellingPrice, 4, java.math.RoundingMode.HALF_UP)
                    .multiply(new BigDecimal("100"))
                    .setScale(2, java.math.RoundingMode.HALF_UP);
        }

        return RecipeDTO.builder()
                .id(entity.getId())
                .name(entity.getName())
                .description(entity.getDescription())
                .sellingPrice(entity.getSellingPrice())
                .imagePath(entity.getImagePath())
                .category(entity.getCategory())
                .sendToKitchen(entity.isSendToKitchen())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .ingredients(ingredientDTOs)
                .totalCost(totalCost)
                .profitMargin(profitMargin)
                .profitPercentage(profitPercentage)
                .build();
    }
}

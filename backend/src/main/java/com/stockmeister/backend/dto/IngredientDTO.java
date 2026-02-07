package com.stockmeister.backend.dto;

import com.fasterxml.jackson.databind.JsonNode;
import com.stockmeister.backend.model.Ingredient;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IngredientDTO {

    private Long id;
    private String name;
    private String category;
    private String unit;
    private BigDecimal currentStock;
    private BigDecimal minimumStock;
    private BigDecimal unitPrice;
    private String supplier;
    private JsonNode nutritionInfo;
    private String imagePath;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static IngredientDTO fromEntity(Ingredient entity) {
        if (entity == null)
            return null;

        return IngredientDTO.builder()
                .id(entity.getId())
                .name(entity.getName())
                .category(entity.getCategory())
                .unit(entity.getUnit())
                .currentStock(entity.getCurrentStock())
                .minimumStock(entity.getMinimumStock())
                .unitPrice(entity.getUnitPrice())
                .supplier(entity.getSupplier())
                .nutritionInfo(entity.getNutritionInfo())
                .imagePath(entity.getImagePath())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}

package com.stockmeister.backend.dto;

import com.stockmeister.backend.model.RecipeIngredient;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecipeIngredientDTO {

    private Long id;
    private BigDecimal amount;

    private Long ingredientId;
    private String ingredientName;
    private String ingredientUnit;
    private BigDecimal ingredientUnitPrice;
    private BigDecimal ingredientCurrentStock;
    private String ingredientImagePath;

    private BigDecimal lineCost;

    public static RecipeIngredientDTO fromEntity(RecipeIngredient entity) {
        if (entity == null)
            return null;

        var ingredient = entity.getIngredient();

        return RecipeIngredientDTO.builder()
                .id(entity.getId())
                .amount(entity.getAmount())
                .ingredientId(ingredient != null ? ingredient.getId() : null)
                .ingredientName(ingredient != null ? ingredient.getName() : null)
                .ingredientUnit(ingredient != null ? ingredient.getUnit() : null)
                .ingredientUnitPrice(ingredient != null ? ingredient.getUnitPrice() : null)
                .ingredientCurrentStock(ingredient != null ? ingredient.getCurrentStock() : null)
                .ingredientImagePath(ingredient != null ? ingredient.getImagePath() : null)
                .lineCost(entity.calculateCost())
                .build();
    }
}

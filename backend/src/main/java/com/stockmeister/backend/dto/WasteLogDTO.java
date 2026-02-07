package com.stockmeister.backend.dto;

import com.stockmeister.backend.model.WasteLog;
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
public class WasteLogDTO {

    private Long id;
    private BigDecimal quantity;
    private String reason;
    private LocalDateTime date;
    private LocalDateTime createdAt;

    private Long ingredientId;
    private String ingredientName;
    private String ingredientUnit;
    private String ingredientCategory;
    private BigDecimal ingredientUnitPrice;
    private String ingredientImagePath;

    private BigDecimal wasteCost;

    public static WasteLogDTO fromEntity(WasteLog entity) {
        if (entity == null)
            return null;

        var ingredient = entity.getIngredient();
        BigDecimal wasteCost = BigDecimal.ZERO;

        if (ingredient != null && entity.getQuantity() != null && ingredient.getUnitPrice() != null) {
            wasteCost = entity.getQuantity().multiply(ingredient.getUnitPrice());
        }

        return WasteLogDTO.builder()
                .id(entity.getId())
                .quantity(entity.getQuantity())
                .reason(entity.getReason())
                .date(entity.getDate())
                .createdAt(entity.getCreatedAt())
                .ingredientId(ingredient != null ? ingredient.getId() : null)
                .ingredientName(ingredient != null ? ingredient.getName() : null)

                .ingredientUnit(ingredient != null ? ingredient.getUnit() : null)
                .ingredientCategory(ingredient != null ? ingredient.getCategory() : null)
                .ingredientUnitPrice(ingredient != null ? ingredient.getUnitPrice() : null)
                .ingredientImagePath(ingredient != null ? ingredient.getImagePath() : null)
                .wasteCost(wasteCost)
                .build();
    }
}

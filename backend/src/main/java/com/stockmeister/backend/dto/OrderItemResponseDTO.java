package com.stockmeister.backend.dto;

import com.stockmeister.backend.model.OrderItem;
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
public class OrderItemResponseDTO {

    private Long id;
    private Long recipeId;
    private String recipeName;
    private String recipeImagePath;
    private boolean sendToKitchen;
    private Integer quantity;
    private BigDecimal unitPrice;
    private BigDecimal itemTotal;
    private String itemNotes;
    private LocalDateTime createdAt;

    public static OrderItemResponseDTO fromEntity(OrderItem entity) {
        if (entity == null)
            return null;

        String imagePath = null;
        Long recipeId = null;
        boolean sendToKitchen = true;

        if (entity.getRecipe() != null) {
            imagePath = entity.getRecipe().getImagePath();
            recipeId = entity.getRecipe().getId();
            sendToKitchen = entity.getRecipe().isSendToKitchen();
        }

        return OrderItemResponseDTO.builder()
                .id(entity.getId())
                .recipeId(recipeId)
                .recipeName(entity.getRecipeName())
                .recipeImagePath(imagePath)
                .sendToKitchen(sendToKitchen)
                .quantity(entity.getQuantity())
                .unitPrice(entity.getUnitPrice())
                .itemTotal(entity.calculateItemTotal())
                .itemNotes(entity.getItemNotes())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}

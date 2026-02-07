package com.stockmeister.backend.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.math.BigDecimal;

@Entity
@Table(name = "order_items")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = { "order", "recipe" })
@EqualsAndHashCode(callSuper = true, exclude = { "order", "recipe" })
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
public class OrderItem extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler", "orderItems" })
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipe_id", nullable = false)
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler", "ingredients" })
    private Recipe recipe;

    @NotNull(message = "Recipe name is required")
    @Column(name = "recipe_name", nullable = false, length = 100)
    private String recipeName;

    @NotNull(message = "Quantity is required")
    @Positive(message = "Quantity must be positive")
    @Column(nullable = false)
    private Integer quantity;

    @NotNull(message = "Unit price is required")
    @Positive(message = "Unit price must be positive")
    @Column(name = "unit_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal unitPrice;

    @Column(name = "item_notes", length = 255)
    private String itemNotes;

    public BigDecimal calculateItemTotal() {
        if (unitPrice == null || quantity == null) {
            return BigDecimal.ZERO;
        }
        return unitPrice.multiply(BigDecimal.valueOf(quantity));
    }

    public static OrderItem fromRecipe(Recipe recipe, Integer quantity) {
        return OrderItem.builder()
                .recipe(recipe)
                .recipeName(recipe.getName())
                .quantity(quantity)
                .unitPrice(recipe.getSellingPrice())
                .build();
    }

    public static OrderItem fromRecipe(Recipe recipe, Integer quantity, String notes) {
        return OrderItem.builder()
                .recipe(recipe)
                .recipeName(recipe.getName())
                .quantity(quantity)
                .unitPrice(recipe.getSellingPrice())
                .itemNotes(notes)
                .build();
    }
}

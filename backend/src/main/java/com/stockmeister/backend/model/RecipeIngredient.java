package com.stockmeister.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "recipe_ingredients", uniqueConstraints = @UniqueConstraint(name = "uk_recipe_ingredient", columnNames = {
        "recipe_id", "ingredient_id" }))
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = { "recipe", "ingredient" })
@EqualsAndHashCode(callSuper = false, exclude = { "recipe", "ingredient" })
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
public class RecipeIngredient extends BaseEntity {

    @NotNull(message = "Ingredient amount is required")
    @Positive(message = "Ingredient amount must be positive")
    @Column(nullable = false, precision = 10, scale = 3)
    private BigDecimal amount;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "recipe_id", nullable = false, foreignKey = @ForeignKey(name = "fk_recipe_ingredient_recipe"))
    private Recipe recipe;

    @NotNull(message = "Ingredient is required")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ingredient_id", nullable = false, foreignKey = @ForeignKey(name = "fk_recipe_ingredient_ingredient"))
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler", "nutritionInfo" })
    private Ingredient ingredient;

    public BigDecimal calculateCost() {
        if (amount == null || ingredient == null) {
            return BigDecimal.ZERO;
        }
        BigDecimal unitPrice = ingredient.getUnitPrice() != null
                ? ingredient.getUnitPrice()
                : BigDecimal.ZERO;
        return amount.multiply(unitPrice);
    }

    public Long getIngredientId() {
        return ingredient != null ? ingredient.getId() : null;
    }

    public Long getRecipeId() {
        return recipe != null ? recipe.getId() : null;
    }
}

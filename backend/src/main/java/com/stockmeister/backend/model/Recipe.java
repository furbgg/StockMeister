package com.stockmeister.backend.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "recipes")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = "ingredients")
@EqualsAndHashCode(callSuper = true, exclude = "ingredients")
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
public class Recipe extends BaseEntity {

    @NotBlank(message = "Recipe name is required")
    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 500)
    private String description;

    @NotNull(message = "Selling price is required")
    @Positive(message = "Selling price must be positive")
    @Column(name = "selling_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal sellingPrice;

    @Column(name = "image_path", length = 500)
    private String imagePath;

    @Column(length = 50)
    @Builder.Default
    private String category = "General";

    @Column(name = "send_to_kitchen", nullable = false)
    @Builder.Default
    private boolean sendToKitchen = true;

    @OneToMany(mappedBy = "recipe", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler", "recipe" })
    private List<RecipeIngredient> ingredients = new ArrayList<>();

    @Transient
    private BigDecimal totalCost;

    public void addIngredient(RecipeIngredient recipeIngredient) {
        if (recipeIngredient != null) {
            ingredients.add(recipeIngredient);
            recipeIngredient.setRecipe(this);
        }
    }

    public void removeIngredient(RecipeIngredient recipeIngredient) {
        if (recipeIngredient != null) {
            ingredients.remove(recipeIngredient);
            recipeIngredient.setRecipe(null);
        }
    }

    public void clearIngredients() {
        List<RecipeIngredient> copy = new ArrayList<>(ingredients);
        copy.forEach(this::removeIngredient);
    }

    public BigDecimal calculateTotalCost() {
        if (ingredients == null || ingredients.isEmpty()) {
            return BigDecimal.ZERO;
        }
        return ingredients.stream()
                .map(RecipeIngredient::calculateCost)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean isActive = true;

    @Column(name = "deleted_at")
    private java.time.LocalDateTime deletedAt;
}

package com.stockmeister.backend.repository;

import com.stockmeister.backend.model.Ingredient;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class IngredientRepositoryTest {

    @Autowired
    private IngredientRepository ingredientRepository;

    @Test
    @DisplayName("Alle aktiven Zutaten finden")
    void shouldFindAllActiveIngredients() {

        List<Ingredient> result = ingredientRepository.findAllByIsActiveTrue();
        assertFalse(result.isEmpty(), "Es sollten aktive Zutaten vorhanden sein");
    }

    @Test
    @DisplayName("Zutat nach Name suchen (case-insensitive)")
    void shouldFindByNameIgnoreCase() {

        Ingredient test = Ingredient.builder()
                .name("TestTomato")
                .category("Vegetables")
                .unit("kg")
                .currentStock(new BigDecimal("10.000"))
                .minimumStock(new BigDecimal("2.000"))
                .unitPrice(new BigDecimal("2.50"))
                .isActive(true)
                .build();
        ingredientRepository.save(test);

        List<Ingredient> result = ingredientRepository.findByNameContainingIgnoreCase("testtomato");
        assertEquals(1, result.size());
        assertEquals("TestTomato", result.get(0).getName());
    }

    @Test
    @DisplayName("Zutaten nach Kategorie filtern")
    void shouldFindByCategory() {
        Ingredient test = Ingredient.builder()
                .name("TestVeggie")
                .category("TestCategory")
                .unit("kg")
                .currentStock(new BigDecimal("5.000"))
                .minimumStock(new BigDecimal("1.000"))
                .unitPrice(new BigDecimal("3.00"))
                .isActive(true)
                .build();
        ingredientRepository.save(test);

        List<Ingredient> result = ingredientRepository.findByCategory("TestCategory");
        assertEquals(1, result.size());
    }

    @Test
    @DisplayName("Pruefen ob Name existiert (case-insensitive)")
    void shouldCheckIfNameExists() {
        Ingredient test = Ingredient.builder()
                .name("UniqueTestItem")
                .category("Test")
                .unit("kg")
                .currentStock(BigDecimal.ZERO)
                .minimumStock(BigDecimal.ZERO)
                .unitPrice(new BigDecimal("1.00"))
                .isActive(true)
                .build();
        ingredientRepository.save(test);

        assertTrue(ingredientRepository.existsByNameIgnoreCase("UniqueTestItem"));
        assertTrue(ingredientRepository.existsByNameIgnoreCase("UNIQUETESTITEM"));
        assertFalse(ingredientRepository.existsByNameIgnoreCase("NonExistent"));
    }

    @Test
    @DisplayName("Zutat speichern - ID wird automatisch generiert")
    void shouldSaveAndGenerateId() {
        Ingredient milk = Ingredient.builder()
                .name("TestMilk")
                .category("Dairy")
                .unit("liter")
                .currentStock(new BigDecimal("30.000"))
                .minimumStock(new BigDecimal("15.000"))
                .unitPrice(new BigDecimal("0.89"))
                .isActive(true)
                .build();

        Ingredient saved = ingredientRepository.save(milk);

        assertNotNull(saved.getId());
        assertEquals("TestMilk", saved.getName());
        assertEquals(new BigDecimal("0.89"), saved.getUnitPrice());
    }

    @Test
    @DisplayName("Zutat aktualisieren - Bestand aendern")
    void shouldUpdateStock() {
        Ingredient test = Ingredient.builder()
                .name("StockUpdateTest")
                .category("Test")
                .unit("kg")
                .currentStock(new BigDecimal("10.000"))
                .minimumStock(new BigDecimal("5.000"))
                .unitPrice(new BigDecimal("1.00"))
                .isActive(true)
                .build();
        Ingredient saved = ingredientRepository.save(test);

        saved.setCurrentStock(new BigDecimal("50.000"));
        ingredientRepository.save(saved);

        Ingredient updated = ingredientRepository.findById(saved.getId()).orElseThrow();
        assertEquals(new BigDecimal("50.000"), updated.getCurrentStock());
    }

    @Test
    @DisplayName("Ausverkaufte Zutaten finden (Bestand = 0)")
    void shouldFindOutOfStockIngredients() {
        Ingredient empty = Ingredient.builder()
                .name("EmptyTestItem")
                .category("Test")
                .unit("kg")
                .currentStock(BigDecimal.ZERO)
                .minimumStock(new BigDecimal("5.000"))
                .unitPrice(new BigDecimal("1.00"))
                .isActive(true)
                .build();
        ingredientRepository.save(empty);

        List<Ingredient> result = ingredientRepository.findOutOfStockIngredients();
        assertTrue(result.stream().anyMatch(i -> i.getName().equals("EmptyTestItem")));
    }
}

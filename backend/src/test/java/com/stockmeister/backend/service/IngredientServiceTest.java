package com.stockmeister.backend.service;

import com.stockmeister.backend.model.Ingredient;
import com.stockmeister.backend.repository.IngredientRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class IngredientServiceTest {

    @Mock
    private IngredientRepository ingredientRepository;

    @InjectMocks
    private IngredientService ingredientService;

    private Ingredient testIngredient;

    @BeforeEach
    void setUp() {

        testIngredient = Ingredient.builder()
                .name("Tomato")
                .category("Vegetables")
                .unit("kg")
                .currentStock(new BigDecimal("25.000"))
                .minimumStock(new BigDecimal("5.000"))
                .unitPrice(new BigDecimal("2.50"))
                .supplier("Bio Farm Wagner")
                .build();
        testIngredient.setId(1L);
    }

    @Test
    @DisplayName("Alle Zutaten abrufen - Erfolg")
    void shouldReturnAllActiveIngredients() {

        Ingredient tomato = Ingredient.builder().name("Tomato").unit("kg")
                .unitPrice(new BigDecimal("2.50")).build();
        Ingredient flour = Ingredient.builder().name("Flour").unit("kg")
                .unitPrice(new BigDecimal("1.20")).build();

        when(ingredientRepository.findAllByIsActiveTrue())
                .thenReturn(Arrays.asList(tomato, flour));

        List<Ingredient> result = ingredientService.getAllIngredients();

        assertEquals(2, result.size());
        assertEquals("Tomato", result.get(0).getName());
        assertEquals("Flour", result.get(1).getName());

        verify(ingredientRepository, times(1)).findAllByIsActiveTrue();
    }

    @Test
    @DisplayName("Zutat nach ID abrufen - Erfolg")
    void shouldReturnIngredientById() {

        when(ingredientRepository.findById(1L))
                .thenReturn(Optional.of(testIngredient));

        Ingredient result = ingredientService.getIngredientById(1L);

        assertNotNull(result);
        assertEquals("Tomato", result.getName());
        assertEquals(new BigDecimal("2.50"), result.getUnitPrice());
    }

    @Test
    @DisplayName("Neue Zutat erstellen - Erfolg")
    void shouldCreateIngredient() {

        when(ingredientRepository.existsByNameIgnoreCase("Tomato")).thenReturn(false);
        when(ingredientRepository.save(any(Ingredient.class))).thenReturn(testIngredient);

        Ingredient result = ingredientService.createIngredient(testIngredient);

        assertNotNull(result);
        assertEquals("Tomato", result.getName());
        verify(ingredientRepository).save(any(Ingredient.class));
    }

    @Test
    @DisplayName("Bestand aktualisieren - Erfolg")
    void shouldUpdateStock() {

        when(ingredientRepository.findById(1L)).thenReturn(Optional.of(testIngredient));
        when(ingredientRepository.save(any(Ingredient.class))).thenReturn(testIngredient);

        BigDecimal newStock = new BigDecimal("50.000");
        Ingredient result = ingredientService.updateStock(1L, newStock);

        assertEquals(newStock, result.getCurrentStock());
        verify(ingredientRepository).save(any(Ingredient.class));
    }

    @Test
    @DisplayName("Zutat loeschen (Soft Delete) - Erfolg")
    void shouldSoftDeleteIngredient() {

        when(ingredientRepository.findById(1L)).thenReturn(Optional.of(testIngredient));

        ingredientService.deleteIngredient(1L);

        assertFalse(testIngredient.isActive());
        assertNotNull(testIngredient.getDeletedAt());
        verify(ingredientRepository).save(testIngredient);
    }

    @Test
    @DisplayName("Zutat nicht gefunden - Exception")
    void shouldThrowWhenIngredientNotFound() {

        when(ingredientRepository.findById(999L)).thenReturn(Optional.empty());

        RuntimeException exception = assertThrows(
                RuntimeException.class,
                () -> ingredientService.getIngredientById(999L));

        assertTrue(exception.getMessage().contains("not found"));
    }

    @Test
    @DisplayName("Doppelter Name - Exception")
    void shouldThrowWhenDuplicateName() {

        when(ingredientRepository.existsByNameIgnoreCase("Tomato")).thenReturn(true);

        RuntimeException exception = assertThrows(
                RuntimeException.class,
                () -> ingredientService.createIngredient(testIngredient));

        assertTrue(exception.getMessage().contains("already exists"));

        verify(ingredientRepository, never()).save(any());
    }

    @Test
    @DisplayName("Negativer Bestand - Exception")
    void shouldThrowWhenNegativeStock() {

        when(ingredientRepository.findById(1L)).thenReturn(Optional.of(testIngredient));

        RuntimeException exception = assertThrows(
                RuntimeException.class,
                () -> ingredientService.updateStock(1L, new BigDecimal("-5")));

        assertTrue(exception.getMessage().contains("negative"));
    }
}

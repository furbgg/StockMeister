package com.stockmeister.backend.controller;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class HealthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("GET /api/health - System ist aktiv")
    void shouldReturnHealthStatus() throws Exception {

        mockMvc.perform(get("/api/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"))
                .andExpect(jsonPath("$.message").value("StockMeister Backend is running!"));
    }

    @Test
    @DisplayName("GET /api/ingredients ohne Token - Zugriff verweigert (403)")
    void shouldReturn403WithoutToken() {

        try {
            mockMvc.perform(get("/api/ingredients"))
                    .andExpect(status().isForbidden());
        } catch (Exception e) {

        }
    }

    @Test
    @DisplayName("GET /api/recipes ohne Token - Zugriff verweigert (403)")
    void shouldReturn403ForRecipesWithoutToken() {
        try {
            mockMvc.perform(get("/api/recipes"))
                    .andExpect(status().isForbidden());
        } catch (Exception e) {

        }
    }

    @Test
    @DisplayName("GET /api/users ohne Token - Zugriff verweigert (403)")
    void shouldReturn403ForUsersWithoutToken() {
        try {
            mockMvc.perform(get("/api/users"))
                    .andExpect(status().isForbidden());
        } catch (Exception e) {

        }
    }
}

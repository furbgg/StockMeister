package com.stockmeister.backend.controller;

import com.stockmeister.backend.model.RestaurantSettings;
import com.stockmeister.backend.service.RestaurantSettingsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/settings")
@RequiredArgsConstructor
@Slf4j
public class SettingsController {

    private final RestaurantSettingsService settingsService;

    @GetMapping
    public ResponseEntity<RestaurantSettings> getSettings() {
        log.info("GET /api/settings");
        return ResponseEntity.ok(settingsService.getSettings());
    }

    @PutMapping
    public ResponseEntity<RestaurantSettings> updateSettings(@RequestBody RestaurantSettings settings) {
        log.info("PUT /api/settings");
        return ResponseEntity.ok(settingsService.updateSettings(settings));
    }
}

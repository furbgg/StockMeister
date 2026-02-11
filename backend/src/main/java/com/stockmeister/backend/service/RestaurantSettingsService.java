package com.stockmeister.backend.service;

import com.stockmeister.backend.model.RestaurantSettings;
import com.stockmeister.backend.repository.RestaurantSettingsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class RestaurantSettingsService {

    private final RestaurantSettingsRepository settingsRepository;

    public RestaurantSettings getSettings() {
        return settingsRepository.findAll().stream()
                .findFirst()
                .orElseGet(this::createDefaultSettings);
    }

    @Transactional
    public RestaurantSettings updateSettings(RestaurantSettings updated) {
        RestaurantSettings existing = getSettings();

        if (updated.getName() != null) existing.setName(updated.getName());
        if (updated.getAddress() != null) existing.setAddress(updated.getAddress());
        if (updated.getPhone() != null) existing.setPhone(updated.getPhone());
        if (updated.getEmail() != null) existing.setEmail(updated.getEmail());
        if (updated.getCurrency() != null) existing.setCurrency(updated.getCurrency());
        if (updated.getTimezone() != null) existing.setTimezone(updated.getTimezone());

        return settingsRepository.save(existing);
    }

    private RestaurantSettings createDefaultSettings() {
        log.info("Creating default restaurant settings");
        RestaurantSettings defaults = RestaurantSettings.builder()
                .name("StockMeister Restaurant")
                .address("Musterstraße 1, 1010 Wien")
                .phone("+43 1 512 0000")
                .email("info@stockmeister.com")
                .currency("EUR")
                .timezone("Europe/Vienna")
                .build();
        return settingsRepository.save(defaults);
    }
}

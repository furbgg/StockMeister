package com.stockmeister.backend.service;

import com.stockmeister.backend.dto.WasteLogRequest;
import com.stockmeister.backend.model.Ingredient;
import com.stockmeister.backend.model.WasteLog;
import com.stockmeister.backend.repository.IngredientRepository;
import com.stockmeister.backend.repository.WasteLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class WasteLogService {

    private final WasteLogRepository wasteLogRepository;
    private final IngredientRepository ingredientRepository;

    public List<WasteLog> getAllWasteLogs() {
        log.info("Fetching all waste logs");
        return wasteLogRepository.findAll();
    }

    @Transactional
    public WasteLog createWasteLog(WasteLogRequest request) {
        if (request == null) {
            throw new RuntimeException("WasteLogRequest cannot be null");
        }

        if (request.getIngredientId() == null) {
            throw new RuntimeException("ingredientId is required");
        }

        BigDecimal wasteQty = request.getQuantity() != null ? request.getQuantity() : BigDecimal.ZERO;
        if (wasteQty.compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Waste quantity must be greater than zero");
        }

        Ingredient ingredient = ingredientRepository.findById(request.getIngredientId())
                .orElseThrow(() -> new RuntimeException("Ingredient not found with id: " + request.getIngredientId()));

        BigDecimal currentStock = ingredient.getCurrentStock() != null ? ingredient.getCurrentStock() : BigDecimal.ZERO;

        if (currentStock.compareTo(wasteQty) < 0) {
            throw new RuntimeException("Insufficient stock for waste operation. Ingredient '" +
                    ingredient.getName() + "' currentStock=" + currentStock + ", requestedWaste=" + wasteQty);
        }

        BigDecimal newStock = currentStock.subtract(wasteQty);
        ingredient.setCurrentStock(newStock);
        ingredientRepository.save(ingredient);

        WasteLog wasteLog = WasteLog.builder()
                .ingredient(ingredient)
                .quantity(wasteQty)
                .reason(request.getReason())
                .date(LocalDateTime.now())
                .build();

        WasteLog saved = wasteLogRepository.save(wasteLog);

        log.info("Waste log created (id={}) for ingredient '{}' -> stock {} -> {}, reason='{}'",
                saved.getId(), ingredient.getName(), currentStock, newStock, request.getReason());

        return saved;
    }

    @Transactional
    public void deleteWasteLog(Long id) {
        WasteLog log = wasteLogRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Waste record not found"));

        Ingredient ingredient = log.getIngredient();
        BigDecimal currentStock = ingredient.getCurrentStock() != null ? ingredient.getCurrentStock() : BigDecimal.ZERO;

        ingredient.setCurrentStock(currentStock.add(log.getQuantity()));
        ingredientRepository.save(ingredient);

        wasteLogRepository.delete(log);
    }
}

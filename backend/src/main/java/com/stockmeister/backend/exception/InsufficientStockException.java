package com.stockmeister.backend.exception;

import lombok.Getter;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Getter
public class InsufficientStockException extends RuntimeException {

    private final List<StockShortage> shortages;

    public InsufficientStockException(String message) {
        super(message);
        this.shortages = new ArrayList<>();
    }

    public InsufficientStockException(String message, List<StockShortage> shortages) {
        super(message);
        this.shortages = shortages != null ? shortages : new ArrayList<>();
    }

    public InsufficientStockException(StockShortage shortage) {
        super(buildMessage(List.of(shortage)));
        this.shortages = List.of(shortage);
    }

    public InsufficientStockException(List<StockShortage> shortages) {
        super(buildMessage(shortages));
        this.shortages = shortages != null ? shortages : new ArrayList<>();
    }

    private static String buildMessage(List<StockShortage> shortages) {
        if (shortages == null || shortages.isEmpty()) {
            return "Insufficient stock to complete order";
        }

        StringBuilder sb = new StringBuilder("Insufficient stock for ingredients: ");
        for (int i = 0; i < shortages.size(); i++) {
            StockShortage s = shortages.get(i);
            sb.append(String.format("%s (need: %.2f %s, have: %.2f %s)",
                    s.getIngredientName(),
                    s.getRequired().doubleValue(),
                    s.getUnit(),
                    s.getAvailable().doubleValue(),
                    s.getUnit()));
            if (i < shortages.size() - 1) {
                sb.append("; ");
            }
        }
        return sb.toString();
    }

    @Getter
    public static class StockShortage {
        private final Long ingredientId;
        private final String ingredientName;
        private final String unit;
        private final BigDecimal required;
        private final BigDecimal available;
        private final BigDecimal shortfall;

        public StockShortage(Long ingredientId, String ingredientName, String unit,
                BigDecimal required, BigDecimal available) {
            this.ingredientId = ingredientId;
            this.ingredientName = ingredientName;
            this.unit = unit;
            this.required = required;
            this.available = available;
            this.shortfall = required.subtract(available);
        }
    }
}

package com.stockmeister.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WasteLogRequest {

    private Long ingredientId;
    private BigDecimal quantity;
    private String reason;
}

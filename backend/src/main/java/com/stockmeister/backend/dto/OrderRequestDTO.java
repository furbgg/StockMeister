package com.stockmeister.backend.dto;

import com.stockmeister.backend.model.PaymentMethod;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderRequestDTO {

    @NotBlank(message = "Table number is required")
    private String tableNumber;

    private String customerName;

    @NotEmpty(message = "Order must have at least one item")
    @Valid
    private List<OrderItemRequestDTO> items;

    private PaymentMethod paymentMethod;

    @PositiveOrZero(message = "Tip must be zero or positive")
    private BigDecimal tip;

    @PositiveOrZero(message = "Amount received must be zero or positive")
    private BigDecimal amountReceived;

    private String notes;
}

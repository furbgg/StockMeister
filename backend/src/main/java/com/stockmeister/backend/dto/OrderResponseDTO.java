package com.stockmeister.backend.dto;

import com.stockmeister.backend.model.Order;
import com.stockmeister.backend.model.OrderStatus;
import com.stockmeister.backend.model.PaymentMethod;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderResponseDTO {

    private Long id;
    private String tableNumber;
    private String customerName;
    private OrderStatus status;

    private BigDecimal subtotal;
    private BigDecimal taxRate;
    private BigDecimal taxAmount;
    private BigDecimal tip;
    private BigDecimal totalAmount;

    private PaymentMethod paymentMethod;
    private BigDecimal amountReceived;
    private BigDecimal changeAmount;

    private Long waiterId;
    private String waiterName;

    @Builder.Default
    private List<OrderItemResponseDTO> items = new ArrayList<>();

    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static OrderResponseDTO fromEntity(Order entity) {
        if (entity == null)
            return null;

        Long waiterId = null;
        String waiterName = null;

        if (entity.getWaiter() != null) {
            waiterId = entity.getWaiter().getId();
            waiterName = entity.getWaiter().getUsername();
        }

        return OrderResponseDTO.builder()
                .id(entity.getId())
                .tableNumber(entity.getTableNumber())
                .customerName(entity.getCustomerName())
                .status(entity.getStatus())
                .subtotal(entity.getSubtotal())
                .taxRate(entity.getTaxRate())
                .taxAmount(entity.getTaxAmount())
                .tip(entity.getTip())
                .totalAmount(entity.getTotalAmount())
                .paymentMethod(entity.getPaymentMethod())
                .amountReceived(entity.getAmountReceived())
                .changeAmount(entity.getChangeAmount())
                .waiterId(waiterId)
                .waiterName(waiterName)
                .items(new ArrayList<>())
                .notes(entity.getNotes())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    public static OrderResponseDTO fromEntityWithItems(Order entity) {
        if (entity == null)
            return null;

        OrderResponseDTO dto = fromEntity(entity);

        if (entity.getOrderItems() != null) {
            dto.setItems(
                    entity.getOrderItems().stream()
                            .map(OrderItemResponseDTO::fromEntity)
                            .collect(Collectors.toList()));
        }

        return dto;
    }
}

package com.stockmeister.backend.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orders")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = "orderItems")
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
public class Order extends BaseEntity {

    @NotNull(message = "Table number is required")
    @Column(name = "table_number", nullable = false, length = 20)
    private String tableNumber;

    @Column(name = "customer_name", length = 100)
    private String customerName;

    @NotNull(message = "Order status is required")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private OrderStatus status = OrderStatus.PENDING;

    @NotNull(message = "Subtotal is required")
    @PositiveOrZero(message = "Subtotal must be zero or positive")
    @Column(nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal subtotal = BigDecimal.ZERO;

    @NotNull(message = "Tax rate is required")
    @PositiveOrZero(message = "Tax rate must be zero or positive")
    @Column(name = "tax_rate", nullable = false, precision = 5, scale = 4)
    @Builder.Default
    private BigDecimal taxRate = new BigDecimal("0.05");

    @NotNull(message = "Tax amount is required")
    @PositiveOrZero(message = "Tax amount must be zero or positive")
    @Column(name = "tax_amount", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal taxAmount = BigDecimal.ZERO;

    @PositiveOrZero(message = "Tip must be zero or positive")
    @Column(precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal tip = BigDecimal.ZERO;

    @NotNull(message = "Total amount is required")
    @PositiveOrZero(message = "Total amount must be zero or positive")
    @Column(name = "total_amount", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal totalAmount = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", length = 20)
    @Builder.Default
    private PaymentMethod paymentMethod = PaymentMethod.UNPAID;

    @PositiveOrZero(message = "Amount received must be zero or positive")
    @Column(name = "amount_received", precision = 12, scale = 2)
    private BigDecimal amountReceived;

    @PositiveOrZero(message = "Change must be zero or positive")
    @Column(name = "change_amount", precision = 12, scale = 2)
    private BigDecimal changeAmount;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "waiter_id", nullable = false)
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler", "password" })
    private User waiter;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler", "order" })
    private List<OrderItem> orderItems = new ArrayList<>();

    @Column(length = 500)
    private String notes;

    public void addOrderItem(OrderItem orderItem) {
        if (orderItem != null) {
            orderItems.add(orderItem);
            orderItem.setOrder(this);
        }
    }

    public void removeOrderItem(OrderItem orderItem) {
        if (orderItem != null) {
            orderItems.remove(orderItem);
            orderItem.setOrder(null);
        }
    }

    public void clearOrderItems() {
        List<OrderItem> copy = new ArrayList<>(orderItems);
        copy.forEach(this::removeOrderItem);
    }

    public BigDecimal calculateSubtotal() {
        if (orderItems == null || orderItems.isEmpty()) {
            return BigDecimal.ZERO;
        }
        return orderItems.stream()
                .map(OrderItem::calculateItemTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public void calculateTotals() {
        this.subtotal = calculateSubtotal();
        this.taxAmount = this.subtotal.multiply(this.taxRate);
        this.totalAmount = this.subtotal.add(this.taxAmount).add(this.tip != null ? this.tip : BigDecimal.ZERO);
    }

    public void calculateChange() {
        if (this.amountReceived != null && this.totalAmount != null) {
            this.changeAmount = this.amountReceived.subtract(this.totalAmount);
            if (this.changeAmount.compareTo(BigDecimal.ZERO) < 0) {
                this.changeAmount = BigDecimal.ZERO;
            }
        }
    }
}

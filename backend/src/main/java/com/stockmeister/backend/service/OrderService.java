package com.stockmeister.backend.service;

import com.stockmeister.backend.dto.OrderItemRequestDTO;
import com.stockmeister.backend.dto.OrderRequestDTO;
import com.stockmeister.backend.dto.OrderResponseDTO;
import com.stockmeister.backend.exception.InsufficientStockException;
import com.stockmeister.backend.exception.InsufficientStockException.StockShortage;
import com.stockmeister.backend.model.*;
import com.stockmeister.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class OrderService {

    private final OrderRepository orderRepository;

    private final RecipeRepository recipeRepository;
    private final IngredientRepository ingredientRepository;
    private final UserRepository userRepository;

    private static final String DEFAULT_WAITER_USERNAME = "DemoWaiter";
    private static final BigDecimal DEFAULT_TAX_RATE = new BigDecimal("0.05");

    @Transactional(isolation = Isolation.SERIALIZABLE)
    public OrderResponseDTO placeOrder(OrderRequestDTO orderRequest) {
        log.info("Placing order for table: {}", orderRequest.getTableNumber());

        User waiter = getOrCreateWaiter();
        log.info("Order assigned to waiter: {}", waiter.getUsername());

        Map<Long, Recipe> recipeMap = new HashMap<>();
        for (OrderItemRequestDTO item : orderRequest.getItems()) {
            Recipe recipe = recipeRepository.findByIdWithIngredients(item.getRecipeId())
                    .orElseThrow(() -> new RuntimeException(
                            "Recipe not found with id: " + item.getRecipeId()));
            recipeMap.put(item.getRecipeId(), recipe);
        }

        validateStockForOrder(orderRequest.getItems(), recipeMap);
        log.info("Stock validation passed for {} item(s)", orderRequest.getItems().size());

        Order order = Order.builder()
                .tableNumber(orderRequest.getTableNumber())
                .customerName(orderRequest.getCustomerName())
                .status(OrderStatus.PENDING)
                .waiter(waiter)
                .taxRate(DEFAULT_TAX_RATE)
                .tip(orderRequest.getTip() != null ? orderRequest.getTip() : BigDecimal.ZERO)
                .notes(orderRequest.getNotes())
                .paymentMethod(orderRequest.getPaymentMethod() != null
                        ? orderRequest.getPaymentMethod()
                        : PaymentMethod.UNPAID)
                .build();

        for (OrderItemRequestDTO itemRequest : orderRequest.getItems()) {
            Recipe recipe = recipeMap.get(itemRequest.getRecipeId());
            OrderItem orderItem = OrderItem.fromRecipe(
                    recipe,
                    itemRequest.getQuantity(),
                    itemRequest.getNotes());
            order.addOrderItem(orderItem);
        }

        order.calculateTotals();
        log.info("Order totals calculated - Subtotal: {}, Tax: {}, Total: {}",
                order.getSubtotal(), order.getTaxAmount(), order.getTotalAmount());

        if (orderRequest.getAmountReceived() != null) {
            order.setAmountReceived(orderRequest.getAmountReceived());
            order.calculateChange();
        }

        deductStockForOrder(orderRequest.getItems(), recipeMap);
        log.info("Stock deducted for all order items");

        Order savedOrder = orderRepository.save(order);
        log.info("Order {} created successfully for table {}",
                savedOrder.getId(), savedOrder.getTableNumber());

        return OrderResponseDTO.fromEntityWithItems(savedOrder);
    }

    private void validateStockForOrder(List<OrderItemRequestDTO> items, Map<Long, Recipe> recipeMap) {
        Map<Long, BigDecimal> requiredAmounts = new HashMap<>();
        Map<Long, Ingredient> ingredientMap = new HashMap<>();

        for (OrderItemRequestDTO item : items) {
            Recipe recipe = recipeMap.get(item.getRecipeId());
            if (recipe.getIngredients() == null)
                continue;

            for (RecipeIngredient ri : recipe.getIngredients()) {
                Ingredient ingredient = ri.getIngredient();
                Long ingredientId = ingredient.getId();

                BigDecimal amountForItem = ri.getAmount()
                        .multiply(BigDecimal.valueOf(item.getQuantity()));

                requiredAmounts.merge(ingredientId, amountForItem, BigDecimal::add);
                ingredientMap.put(ingredientId, ingredient);
            }
        }

        List<StockShortage> shortages = new ArrayList<>();

        for (Map.Entry<Long, BigDecimal> entry : requiredAmounts.entrySet()) {
            Long ingredientId = entry.getKey();
            BigDecimal required = entry.getValue();
            Ingredient ingredient = ingredientMap.get(ingredientId);

            BigDecimal available = ingredient.getCurrentStock() != null
                    ? ingredient.getCurrentStock()
                    : BigDecimal.ZERO;

            if (available.compareTo(required) < 0) {
                shortages.add(new StockShortage(
                        ingredientId,
                        ingredient.getName(),
                        ingredient.getUnit(),
                        required.setScale(3, RoundingMode.HALF_UP),
                        available.setScale(3, RoundingMode.HALF_UP)));
            }
        }

        if (!shortages.isEmpty()) {
            log.warn("Stock validation failed: {} ingredient(s) have insufficient stock",
                    shortages.size());
            throw new InsufficientStockException(shortages);
        }
    }

    private void deductStockForOrder(List<OrderItemRequestDTO> items, Map<Long, Recipe> recipeMap) {
        Map<Long, BigDecimal> deductAmounts = new HashMap<>();
        Map<Long, Ingredient> ingredientMap = new HashMap<>();

        for (OrderItemRequestDTO item : items) {
            Recipe recipe = recipeMap.get(item.getRecipeId());
            if (recipe.getIngredients() == null)
                continue;

            for (RecipeIngredient ri : recipe.getIngredients()) {
                Ingredient ingredient = ri.getIngredient();
                Long ingredientId = ingredient.getId();

                BigDecimal amountForItem = ri.getAmount()
                        .multiply(BigDecimal.valueOf(item.getQuantity()));

                deductAmounts.merge(ingredientId, amountForItem, BigDecimal::add);
                ingredientMap.put(ingredientId, ingredient);
            }
        }

        for (Map.Entry<Long, BigDecimal> entry : deductAmounts.entrySet()) {
            Long ingredientId = entry.getKey();
            BigDecimal deductAmount = entry.getValue();
            Ingredient ingredient = ingredientMap.get(ingredientId);

            BigDecimal newStock = ingredient.getCurrentStock().subtract(deductAmount);
            ingredient.setCurrentStock(newStock);
            ingredientRepository.save(ingredient);

            log.debug("Deducted {} {} from '{}'. New stock: {}",
                    deductAmount, ingredient.getUnit(), ingredient.getName(), newStock);
        }
    }

    private User getOrCreateWaiter() {
        return userRepository.findByUsername(DEFAULT_WAITER_USERNAME)
                .orElseThrow(() -> {
                    log.error("Default waiter '{}' not found. Please run DataSeeder.", DEFAULT_WAITER_USERNAME);
                    return new RuntimeException("Default waiter not found: " + DEFAULT_WAITER_USERNAME);
                });
    }

    public List<OrderResponseDTO> getAllOrders() {
        log.info("Fetching all orders");
        return orderRepository.findAllWithItems().stream()
                .map(OrderResponseDTO::fromEntityWithItems)
                .collect(Collectors.toList());
    }

    public OrderResponseDTO getOrderById(Long id) {
        log.info("Fetching order with id: {}", id);
        Order order = orderRepository.findByIdWithItems(id)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + id));
        return OrderResponseDTO.fromEntityWithItems(order);
    }

    public List<OrderResponseDTO> getOrdersByStatus(OrderStatus status) {
        log.info("Fetching orders with status: {}", status);
        return orderRepository.findByStatusWithItems(status).stream()
                .map(OrderResponseDTO::fromEntityWithItems)
                .collect(Collectors.toList());
    }

    public List<OrderResponseDTO> getActiveOrders() {
        log.info("Fetching active orders");
        return orderRepository.findActiveOrdersWithItems().stream()
                .map(OrderResponseDTO::fromEntityWithItems)
                .collect(Collectors.toList());
    }

    @Transactional
    public OrderResponseDTO updateOrderStatus(Long id, OrderStatus newStatus) {
        log.info("Updating order {} status to {}", id, newStatus);

        Order order = orderRepository.findByIdWithItems(id)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + id));

        order.setStatus(newStatus);
        Order savedOrder = orderRepository.save(order);

        return OrderResponseDTO.fromEntityWithItems(savedOrder);
    }

    @Transactional
    public OrderResponseDTO completePayment(Long id, PaymentMethod paymentMethod,
            BigDecimal amountReceived, BigDecimal tip) {
        log.info("Completing payment for order {}", id);

        Order order = orderRepository.findByIdWithItems(id)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + id));

        order.setPaymentMethod(paymentMethod);

        if (tip != null && tip.compareTo(BigDecimal.ZERO) > 0) {
            order.setTip(tip);
            order.calculateTotals();
        }

        if (amountReceived != null) {
            order.setAmountReceived(amountReceived);
            order.calculateChange();
        }

        order.setStatus(OrderStatus.COMPLETED);
        Order savedOrder = orderRepository.save(order);

        log.info("Payment completed for order {}. Total: {}, Received: {}, Change: {}",
                id, savedOrder.getTotalAmount(), savedOrder.getAmountReceived(),
                savedOrder.getChangeAmount());

        return OrderResponseDTO.fromEntityWithItems(savedOrder);
    }

    @Transactional(isolation = Isolation.SERIALIZABLE)
    public OrderResponseDTO cancelOrder(Long id) {
        log.info("Cancelling order {}", id);

        Order order = orderRepository.findByIdWithItems(id)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + id));

        if (order.getStatus() == OrderStatus.COMPLETED) {
            throw new RuntimeException("Cannot cancel a completed order");
        }

        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new RuntimeException("Order is already cancelled");
        }

        restoreStockForOrder(order);

        order.setStatus(OrderStatus.CANCELLED);
        Order savedOrder = orderRepository.save(order);

        log.info("Order {} cancelled and stock restored", id);

        return OrderResponseDTO.fromEntityWithItems(savedOrder);
    }

    private void restoreStockForOrder(Order order) {
        for (OrderItem item : order.getOrderItems()) {
            Recipe recipe = recipeRepository.findByIdWithIngredients(item.getRecipe().getId())
                    .orElse(null);

            if (recipe == null || recipe.getIngredients() == null)
                continue;

            for (RecipeIngredient ri : recipe.getIngredients()) {
                Ingredient ingredient = ri.getIngredient();
                BigDecimal restoreAmount = ri.getAmount()
                        .multiply(BigDecimal.valueOf(item.getQuantity()));

                BigDecimal newStock = ingredient.getCurrentStock().add(restoreAmount);
                ingredient.setCurrentStock(newStock);
                ingredientRepository.save(ingredient);

                log.debug("Restored {} {} to '{}'. New stock: {}",
                        restoreAmount, ingredient.getUnit(), ingredient.getName(), newStock);
            }
        }
    }

    @Transactional
    public void deleteOrder(Long id) {
        log.info("Deleting order {}", id);

        if (!orderRepository.existsById(id)) {
            throw new RuntimeException("Order not found with id: " + id);
        }

        orderRepository.deleteById(id);
        log.info("Order {} deleted", id);
    }
}

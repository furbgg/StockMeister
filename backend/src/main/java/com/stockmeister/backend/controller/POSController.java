package com.stockmeister.backend.controller;

import com.stockmeister.backend.dto.OrderRequestDTO;
import com.stockmeister.backend.dto.OrderResponseDTO;
import com.stockmeister.backend.dto.RecipeDTO;
import com.stockmeister.backend.model.OrderStatus;
import com.stockmeister.backend.model.PaymentMethod;
import com.stockmeister.backend.model.Recipe;
import com.stockmeister.backend.service.OrderService;
import com.stockmeister.backend.service.RecipeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/pos")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "http://localhost:5173")
public class POSController {

    private final OrderService orderService;
    private final RecipeService recipeService;

    @PostMapping("/orders")
    public ResponseEntity<OrderResponseDTO> createOrder(
            @Valid @RequestBody OrderRequestDTO orderRequest) {
        log.info("POST /api/pos/orders - Creating order for table: {}",
                orderRequest.getTableNumber());

        OrderResponseDTO order = orderService.placeOrder(orderRequest);

        log.info("Order {} created successfully", order.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(order);
    }

    @GetMapping("/orders")
    public ResponseEntity<List<OrderResponseDTO>> getAllOrders() {
        log.info("GET /api/pos/orders - Fetching all orders");
        List<OrderResponseDTO> orders = orderService.getAllOrders();
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/orders/{id}")
    public ResponseEntity<OrderResponseDTO> getOrderById(@PathVariable Long id) {
        log.info("GET /api/pos/orders/{} - Fetching order", id);
        OrderResponseDTO order = orderService.getOrderById(id);
        return ResponseEntity.ok(order);
    }

    @GetMapping("/orders/active")
    public ResponseEntity<List<OrderResponseDTO>> getActiveOrders() {
        log.info("GET /api/pos/orders/active - Fetching active orders");
        List<OrderResponseDTO> orders = orderService.getActiveOrders();
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/orders/status/{status}")
    public ResponseEntity<List<OrderResponseDTO>> getOrdersByStatus(
            @PathVariable OrderStatus status) {
        log.info("GET /api/pos/orders/status/{} - Fetching orders by status", status);
        List<OrderResponseDTO> orders = orderService.getOrdersByStatus(status);
        return ResponseEntity.ok(orders);
    }

    @PatchMapping("/orders/{id}/status")
    public ResponseEntity<OrderResponseDTO> updateOrderStatus(
            @PathVariable Long id,
            @RequestParam OrderStatus status) {
        log.info("PATCH /api/pos/orders/{}/status - Updating status to {}", id, status);
        OrderResponseDTO order = orderService.updateOrderStatus(id, status);
        return ResponseEntity.ok(order);
    }

    @PostMapping("/orders/{id}/pay")
    public ResponseEntity<OrderResponseDTO> completePayment(
            @PathVariable Long id,
            @RequestParam PaymentMethod paymentMethod,
            @RequestParam(required = false) BigDecimal amountReceived,
            @RequestParam(required = false) BigDecimal tip) {
        log.info("POST /api/pos/orders/{}/pay - Completing payment via {}",
                id, paymentMethod);
        OrderResponseDTO order = orderService.completePayment(
                id, paymentMethod, amountReceived, tip);
        return ResponseEntity.ok(order);
    }

    @PostMapping("/orders/{id}/cancel")
    public ResponseEntity<OrderResponseDTO> cancelOrder(@PathVariable Long id) {
        log.info("POST /api/pos/orders/{}/cancel - Cancelling order", id);
        OrderResponseDTO order = orderService.cancelOrder(id);
        return ResponseEntity.ok(order);
    }

    @DeleteMapping("/orders/{id}")
    public ResponseEntity<Void> deleteOrder(@PathVariable Long id) {
        log.info("DELETE /api/pos/orders/{} - Deleting order", id);
        orderService.deleteOrder(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/products")
    public ResponseEntity<List<RecipeDTO>> getMenuProducts() {
        log.info("GET /api/pos/products - Fetching menu products");

        List<Recipe> recipes = recipeService.getAllRecipesWithIngredients();

        List<RecipeDTO> products = recipes.stream()
                .map(RecipeDTO::fromEntityWithIngredients)
                .collect(Collectors.toList());

        return ResponseEntity.ok(products);
    }

    @GetMapping("/products/{id}")
    public ResponseEntity<RecipeDTO> getProductById(@PathVariable Long id) {
        log.info("GET /api/pos/products/{} - Fetching product", id);

        Recipe recipe = recipeService.getRecipeByIdWithIngredients(id);
        RecipeDTO product = RecipeDTO.fromEntityWithIngredients(recipe);

        return ResponseEntity.ok(product);
    }

    @GetMapping("/products/{id}/can-sell")
    public ResponseEntity<Boolean> canSellProduct(
            @PathVariable Long id,
            @RequestParam(defaultValue = "1") int quantity) {
        log.info("GET /api/pos/products/{}/can-sell?quantity={} - Checking availability",
                id, quantity);

        boolean canSell = recipeService.canSellRecipe(id, quantity);
        return ResponseEntity.ok(canSell);
    }

    @GetMapping("/products/{id}/max-quantity")
    public ResponseEntity<Integer> getMaxSellableQuantity(@PathVariable Long id) {
        log.info("GET /api/pos/products/{}/max-quantity - Getting max sellable", id);

        int maxQuantity = recipeService.getMaxSellableQuantity(id);
        return ResponseEntity.ok(maxQuantity);
    }
}

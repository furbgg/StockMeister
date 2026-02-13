package com.stockmeister.backend.config;

import com.stockmeister.backend.model.*;
import com.stockmeister.backend.repository.IngredientRepository;
import com.stockmeister.backend.repository.RecipeRepository;
import com.stockmeister.backend.repository.UserRepository;
import com.stockmeister.backend.repository.WasteLogRepository;
import jakarta.persistence.EntityManager;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Component
public class DataSeeder implements CommandLineRunner {

        private final UserRepository userRepository;
        private final IngredientRepository ingredientRepository;
        private final RecipeRepository recipeRepository;
        private final com.stockmeister.backend.repository.OrderRepository orderRepository;
        private final WasteLogRepository wasteLogRepository;
        private final PasswordEncoder passwordEncoder;
        private final EntityManager entityManager;

        @Value("${app.seed.password:changeme}")
        private String seedPassword;

        private final Map<String, Ingredient> ingredientMap = new HashMap<>();

        public DataSeeder(UserRepository userRepository, IngredientRepository ingredientRepository,
                        RecipeRepository recipeRepository,
                        com.stockmeister.backend.repository.OrderRepository orderRepository,
                        WasteLogRepository wasteLogRepository, PasswordEncoder passwordEncoder,
                        EntityManager entityManager) {
                this.userRepository = userRepository;
                this.ingredientRepository = ingredientRepository;
                this.recipeRepository = recipeRepository;
                this.orderRepository = orderRepository;
                this.wasteLogRepository = wasteLogRepository;
                this.passwordEncoder = passwordEncoder;
                this.entityManager = entityManager;
        }

        @Override
        @Transactional
        public void run(String... args) throws Exception {
                if (userRepository.count() > 0) {
                        return;
                }

                try {
                        deleteAllDataNative();

                        seedUsers();
                        seedIngredients();
                        seedRecipes();
                        seedWasteLogs();

                        seedOrders();

                } catch (Exception e) {
                        throw e;
                }
        }

        private void seedOrders() {
                User waiter = userRepository.findByUsername("DemoWaiter").orElseThrow();
                LocalDateTime now = LocalDateTime.now();

                createHistoricalOrder(waiter, now.minusDays(1), "Wiener Schnitzel", 2, "Coca Cola", 2);
                createHistoricalOrder(waiter, now.minusDays(2), "Tafelspitz", 1, "Mineralwasser", 1);
                createHistoricalOrder(waiter, now.minusDays(3), "Käsespätzle", 3, null, 0);
                createHistoricalOrder(waiter, now.minusDays(5), "Backhendl", 2, "Backhendlsalat", 1);

                createHistoricalOrder(waiter, now.minusDays(35), "Schweinsbraten", 4, "Coca Cola", 4);
                createHistoricalOrder(waiter, now.minusDays(38), "Wiener Schnitzel", 3, "Tafelspitz", 2);
                createHistoricalOrder(waiter, now.minusDays(40), "Gulasch", 5, "Semmelbrösel", 0);
                createHistoricalOrder(waiter, now.minusDays(42), "Topfenknödel", 2, null, 0);

                createHistoricalOrder(waiter, now.minusDays(95), "Frankfurter mit Senf", 10, "Coca Cola", 10);
                createHistoricalOrder(waiter, now.minusDays(98), "Backhendlsalat", 5, "Mineralwasser", 5);
                createHistoricalOrder(waiter, now.minusDays(100), "Käsespätzle", 4, null, 0);
        }

        private void createHistoricalOrder(User waiter, LocalDateTime date,
                        String recipeHb, int qtyHb,
                        String recipeDrink, int qtyDrink) {

                Order order = Order.builder()
                                .tableNumber("10")
                                .status(OrderStatus.COMPLETED)
                                .waiter(waiter)
                                .paymentMethod(PaymentMethod.CASH)
                                .taxRate(new BigDecimal("0.10"))
                                .build();

                if (recipeHb != null) {
                        recipeRepository.findAll().stream()
                                        .filter(r -> r.getName().equals(recipeHb))
                                        .findFirst()
                                        .ifPresent(recipe -> {
                                                OrderItem item = OrderItem.fromRecipe(recipe, qtyHb, null);
                                                order.addOrderItem(item);
                                        });
                }

                if (recipeDrink != null) {
                        recipeRepository.findAll().stream()
                                        .filter(r -> r.getName().equals(recipeDrink))
                                        .findFirst()
                                        .ifPresent(recipe -> {
                                                OrderItem item = OrderItem.fromRecipe(recipe, qtyDrink, null);
                                                order.addOrderItem(item);
                                        });
                }

                order.calculateTotals();
                order.setAmountReceived(order.getTotalAmount());
                order.setChangeAmount(BigDecimal.ZERO);

                Order savedOrder = orderRepository.save(order);

                entityManager.createNativeQuery("UPDATE orders SET created_at = :date WHERE id = :id")
                                .setParameter("date", date)
                                .setParameter("id", savedOrder.getId())
                                .executeUpdate();

                entityManager.createNativeQuery("UPDATE order_items SET created_at = :date WHERE order_id = :id")
                                .setParameter("date", date)
                                .setParameter("id", savedOrder.getId())
                                .executeUpdate();
        }

        private void deleteAllDataNative() {
                entityManager.createNativeQuery("DELETE FROM order_items").executeUpdate();
                entityManager.createNativeQuery("DELETE FROM orders").executeUpdate();

                entityManager.createNativeQuery("DELETE FROM waste_logs").executeUpdate();
                entityManager.createNativeQuery("DELETE FROM recipe_ingredients").executeUpdate();
                entityManager.createNativeQuery("DELETE FROM recipes").executeUpdate();
                entityManager.createNativeQuery("DELETE FROM ingredients").executeUpdate();
                entityManager.createNativeQuery("DELETE FROM users").executeUpdate();

                entityManager.flush();
                entityManager.clear();
        }

        private void seedUsers() {
                User admin = User.builder()
                                .username("admin")
                                .password(passwordEncoder.encode(seedPassword))
                                .email("admin@example.com")
                                .role(Role.ADMIN)
                                .isActive(true)
                                .phone("+43 1 512 0000")
                                .salary(new BigDecimal("5500.00"))
                                .timings("Flexible")
                                .address("Musterstraße 1, 1010 Wien")
                                .build();
                userRepository.save(admin);

                User chef = User.builder()
                                .username("DemoChef")
                                .password(passwordEncoder.encode(seedPassword))
                                .email("chef@example.com")
                                .role(Role.CHEF)
                                .isActive(true)
                                .phone("+43 1 512 0001")
                                .salary(new BigDecimal("3800.00"))
                                .timings("6:00 - 15:00")
                                .address("Musterstraße 2, 1060 Wien")
                                .build();
                userRepository.save(chef);

                User inventory = User.builder()
                                .username("DemoManager")
                                .password(passwordEncoder.encode(seedPassword))
                                .email("manager@example.com")
                                .role(Role.INVENTORY_MANAGER)
                                .isActive(true)
                                .phone("+43 1 512 0002")
                                .salary(new BigDecimal("2900.00"))
                                .timings("7:00 - 16:00")
                                .address("Musterstraße 3, 1020 Wien")
                                .build();
                userRepository.save(inventory);

                User waiter = User.builder()
                                .username("DemoWaiter")
                                .password(passwordEncoder.encode(seedPassword))
                                .email("waiter@example.com")
                                .role(Role.WAITER)
                                .isActive(true)
                                .phone("+43 1 512 0003")
                                .salary(new BigDecimal("2400.00"))
                                .timings("11:00 - 20:00")
                                .address("Musterstraße 4, 1030 Wien")
                                .build();
                userRepository.save(waiter);

                User demoAdmin = User.builder()
                                .username("demoAdmin")
                                .password(passwordEncoder.encode(seedPassword))
                                .email("demoadmin@example.com")
                                .role(Role.ADMIN)
                                .isActive(true)
                                .phone("+43 1 512 0005")
                                .salary(new BigDecimal("5500.00"))
                                .timings("Flexible")
                                .address("Musterstraße 5, 1010 Wien")
                                .build();
                userRepository.save(demoAdmin);
        }

        private void seedIngredients() {
                createIngredient("Kalbfleisch", "Fleisch", "kg", 28.50, 15.0, 5.0, "Fleischerei Radatz",
                                "/uploads/ingredients/kalbfleisch.png");
                createIngredient("Schweinefleisch", "Fleisch", "kg", 12.90, 25.0, 8.0, "Fleischerei Radatz",
                                "/uploads/ingredients/schweinefleisch.png");
                createIngredient("Rindfleisch", "Fleisch", "kg", 24.00, 18.0, 6.0, "Fleischerei Radatz",
                                "/uploads/ingredients/rindfleisch.png");
                createIngredient("Hühnerbrust", "Fleisch", "kg", 14.50, 12.0, 4.0, "Fleischerei Radatz",
                                "/uploads/ingredients/huehnerbrust.png");
                createIngredient("Speck", "Fleisch", "kg", 18.00, 8.0, 2.5, "Tiroler Speck GmbH",
                                "/uploads/ingredients/speck.png");
                createIngredient("Frankfurter Würstchen", "Fleisch", "kg", 9.80, 10.0, 3.0, "Fleischerei Radatz",
                                "/uploads/ingredients/frankfurter_wuerstchen.png");

                createIngredient("Butter", "Milchprodukte", "kg", 8.50, 10.0, 3.0, "NÖM AG",
                                "/uploads/ingredients/butter.png");
                createIngredient("Sauerrahm", "Milchprodukte", "lt", 4.20, 8.0, 2.0, "NÖM AG",
                                "/uploads/ingredients/sauerrahm.png");
                createIngredient("Schlagobers", "Milchprodukte", "lt", 5.80, 6.0, 2.0, "NÖM AG",
                                "/uploads/ingredients/schlagobers.png");
                createIngredient("Emmentaler Käse", "Milchprodukte", "kg", 16.90, 5.0, 1.5, "Berglandmilch",
                                "/uploads/ingredients/emmentaler.png");
                createIngredient("Topfen", "Milchprodukte", "kg", 6.40, 4.0, 1.0, "NÖM AG",
                                "/uploads/ingredients/topfen.png");
                createIngredient("Eier", "Milchprodukte", "Stück", 0.35, 120.0, 30.0, "Österreichische Eierproduzenten",
                                "/uploads/ingredients/eier.png");

                createIngredient("Kartoffeln", "Gemüse", "kg", 1.80, 50.0, 15.0, "Marchfelder Gemüsebau",
                                "/uploads/ingredients/kartoffeln.png");
                createIngredient("Zwiebeln", "Gemüse", "kg", 1.50, 20.0, 5.0, "Marchfelder Gemüsebau",
                                "/uploads/ingredients/zwiebeln.png");
                createIngredient("Knoblauch", "Gemüse", "kg", 8.90, 3.0, 0.5, "Marchfelder Gemüsebau",
                                "/uploads/ingredients/knoblauch.png");
                createIngredient("Sauerkraut", "Gemüse", "kg", 3.20, 15.0, 4.0, "Staud's Wien",
                                "/uploads/ingredients/sauerkraut.png");
                createIngredient("Gurken (Essiggurken)", "Gemüse", "kg", 4.50, 8.0, 2.0, "Staud's Wien",
                                "/uploads/ingredients/gurken.png");
                createIngredient("Karotten", "Gemüse", "kg", 2.10, 12.0, 3.0, "Marchfelder Gemüsebau",
                                "/uploads/ingredients/karotten.png");
                createIngredient("Petersilie", "Gemüse", "Bund", 0.80, 15.0, 5.0, "Wiener Kräutergarten",
                                "/uploads/ingredients/petersilie.png");
                createIngredient("Schnittlauch", "Gemüse", "Bund", 0.90, 12.0, 4.0, "Wiener Kräutergarten",
                                "/uploads/ingredients/schnittlauch.png");

                createIngredient("Weizenmehl (glatt)", "Mehl & Teig", "kg", 1.20, 25.0, 8.0, "Farina Mühle",
                                "/uploads/ingredients/weizenmehl.png");
                createIngredient("Semmelbrösel", "Mehl & Teig", "kg", 3.50, 10.0, 3.0, "Ankerbrot",
                                "/uploads/ingredients/semmelbroesel.png");
                createIngredient("Spätzle (frisch)", "Mehl & Teig", "kg", 5.80, 8.0, 2.0, "Wolf Nudelmanufaktur",
                                "/uploads/ingredients/spaetzle.png");
                createIngredient("Knödelbrot", "Mehl & Teig", "kg", 2.80, 6.0, 2.0, "Ankerbrot",
                                "/uploads/ingredients/knoedelbrot.png");

                createIngredient("Sonnenblumenöl", "Öle", "lt", 3.20, 15.0, 4.0, "VFI Oils",
                                "/uploads/ingredients/sonnenblumenoel.png");
                createIngredient("Schweineschmalz", "Öle", "kg", 4.80, 5.0, 1.5, "Fleischerei Radatz",
                                "/uploads/ingredients/schweineschmalz.png");
                createIngredient("Kümmel", "Gewürze", "kg", 18.50, 1.0, 0.3, "Kotányi",
                                "/uploads/ingredients/kuemmel.png");
                createIngredient("Paprikapulver (edelsüß)", "Gewürze", "kg", 22.00, 0.8, 0.2, "Kotányi",
                                "/uploads/ingredients/paprika.png");

                createIngredient("Cola Dose", "Getränke", "Stück", 0.80, 100.0, 20.0, "Coca-Cola Austria",
                                "/uploads/ingredients/cola_dose.png");
                createIngredient("Mineralwasser Flasche", "Getränke", "Stück", 0.60, 80.0, 15.0, "Vöslauer",
                                "/uploads/ingredients/mineralwasser_flasche.png");
        }

        private void createIngredient(String name, String category, String unit,
                        double unitPrice, double currentStock, double minStock,
                        String supplier, String imagePath) {
                Ingredient ingredient = Ingredient.builder()
                                .name(name)
                                .category(category)
                                .unit(unit)
                                .unitPrice(new BigDecimal(String.valueOf(unitPrice)))
                                .currentStock(new BigDecimal(String.valueOf(currentStock)))
                                .minimumStock(new BigDecimal(String.valueOf(minStock)))
                                .supplier(supplier)
                                .imagePath(imagePath)
                                .build();

                ingredient = ingredientRepository.save(ingredient);
                ingredientMap.put(name, ingredient);
        }

        private void seedRecipes() {
                Recipe schnitzel = createRecipe(
                                "Wiener Schnitzel",
                                "Dünn geklopftes Kalbfleisch, paniert und goldbraun gebacken. Serviert mit Petersilkartoffeln und Preiselbeeren.",
                                new BigDecimal("24.90"),
                                "/uploads/products/wiener_schnitzel.png",
                                "Hauptspeise", true);
                addRecipeIngredient(schnitzel, "Kalbfleisch", 0.200);
                addRecipeIngredient(schnitzel, "Weizenmehl (glatt)", 0.050);
                addRecipeIngredient(schnitzel, "Eier", 2.0);
                addRecipeIngredient(schnitzel, "Semmelbrösel", 0.080);
                addRecipeIngredient(schnitzel, "Schweineschmalz", 0.150);
                addRecipeIngredient(schnitzel, "Kartoffeln", 0.250);
                addRecipeIngredient(schnitzel, "Butter", 0.030);
                addRecipeIngredient(schnitzel, "Petersilie", 0.5);
                recipeRepository.save(schnitzel);

                Recipe tafelspitz = createRecipe(
                                "Tafelspitz",
                                "Zart gekochtes Rindfleisch mit Schnittlauchsauce, Apfelkren und Rösti. Ein Wiener Klassiker.",
                                new BigDecimal("28.50"),
                                "/uploads/products/tafelspitz.png",
                                "Hauptspeise", true);
                addRecipeIngredient(tafelspitz, "Rindfleisch", 0.300);
                addRecipeIngredient(tafelspitz, "Karotten", 0.100);
                addRecipeIngredient(tafelspitz, "Kartoffeln", 0.200);
                addRecipeIngredient(tafelspitz, "Zwiebeln", 0.080);
                addRecipeIngredient(tafelspitz, "Schnittlauch", 1.0);
                addRecipeIngredient(tafelspitz, "Sauerrahm", 0.100);
                addRecipeIngredient(tafelspitz, "Butter", 0.040);
                recipeRepository.save(tafelspitz);

                Recipe schweinsbraten = createRecipe(
                                "Schweinsbraten",
                                "Knuspriger Schweinsbraten mit Semmelknödel und Sauerkraut. Hausgemacht nach Omas Rezept.",
                                new BigDecimal("19.90"),
                                "/uploads/products/schweinsbraten.png",
                                "Hauptspeise", true);
                addRecipeIngredient(schweinsbraten, "Schweinefleisch", 0.350);
                addRecipeIngredient(schweinsbraten, "Zwiebeln", 0.100);
                addRecipeIngredient(schweinsbraten, "Knoblauch", 0.015);
                addRecipeIngredient(schweinsbraten, "Kümmel", 0.005);
                addRecipeIngredient(schweinsbraten, "Knödelbrot", 0.150);
                addRecipeIngredient(schweinsbraten, "Eier", 1.0);
                addRecipeIngredient(schweinsbraten, "Sauerkraut", 0.200);
                recipeRepository.save(schweinsbraten);

                Recipe kaesespaetzle = createRecipe(
                                "Käsespätzle",
                                "Hausgemachte Spätzle überbacken mit Emmentaler und knusprigen Röstzwiebeln.",
                                new BigDecimal("15.90"),
                                "/uploads/products/kaesespaetzle.png",
                                "Hauptspeise", true);
                addRecipeIngredient(kaesespaetzle, "Spätzle (frisch)", 0.300);
                addRecipeIngredient(kaesespaetzle, "Emmentaler Käse", 0.120);
                addRecipeIngredient(kaesespaetzle, "Zwiebeln", 0.080);
                addRecipeIngredient(kaesespaetzle, "Butter", 0.050);
                addRecipeIngredient(kaesespaetzle, "Schnittlauch", 0.5);
                recipeRepository.save(kaesespaetzle);

                Recipe backhendl = createRecipe(
                                "Backhendl",
                                "Knusprig paniertes Hühnchen nach Wiener Art mit Kartoffelsalat und Zitrone.",
                                new BigDecimal("18.90"),
                                "/uploads/products/backhendl.png",
                                "Hauptspeise", true);
                addRecipeIngredient(backhendl, "Hühnerbrust", 0.250);
                addRecipeIngredient(backhendl, "Weizenmehl (glatt)", 0.040);
                addRecipeIngredient(backhendl, "Eier", 2.0);
                addRecipeIngredient(backhendl, "Semmelbrösel", 0.060);
                addRecipeIngredient(backhendl, "Sonnenblumenöl", 0.200);
                addRecipeIngredient(backhendl, "Kartoffeln", 0.200);
                recipeRepository.save(backhendl);

                Recipe gulasch = createRecipe(
                                "Wiener Saftgulasch",
                                "Zartes Rindsgulasch mit viel Saft, serviert mit Semmelknödel. Paprika macht's!",
                                new BigDecimal("17.90"),
                                "/uploads/products/gulasch.png",
                                "Hauptspeise", true);
                addRecipeIngredient(gulasch, "Rindfleisch", 0.250);
                addRecipeIngredient(gulasch, "Zwiebeln", 0.200);
                addRecipeIngredient(gulasch, "Paprikapulver (edelsüß)", 0.015);
                addRecipeIngredient(gulasch, "Knoblauch", 0.010);
                addRecipeIngredient(gulasch, "Kümmel", 0.003);
                addRecipeIngredient(gulasch, "Knödelbrot", 0.150);
                addRecipeIngredient(gulasch, "Eier", 1.0);
                recipeRepository.save(gulasch);

                Recipe frankfurter = createRecipe(
                                "Frankfurter mit Senf",
                                "Zwei Paar original Wiener Frankfurter mit scharfem Senf und frischem Gebäck.",
                                new BigDecimal("9.90"),
                                "/uploads/products/frankfurter.png",
                                "Hauptspeise", true);
                addRecipeIngredient(frankfurter, "Frankfurter Würstchen", 0.160);
                recipeRepository.save(frankfurter);

                Recipe topfenknoedel = createRecipe(
                                "Topfenknödel",
                                "Flaumige Topfenknödel mit Butterbröseln und Zwetschgenröster. Süßer Klassiker!",
                                new BigDecimal("12.90"),
                                "/uploads/products/topfenknoedel.png",
                                "Nachspeise", true);
                addRecipeIngredient(topfenknoedel, "Topfen", 0.250);
                addRecipeIngredient(topfenknoedel, "Eier", 2.0);
                addRecipeIngredient(topfenknoedel, "Weizenmehl (glatt)", 0.080);
                addRecipeIngredient(topfenknoedel, "Butter", 0.080);
                addRecipeIngredient(topfenknoedel, "Semmelbrösel", 0.050);
                recipeRepository.save(topfenknoedel);

                Recipe cocaCola = createRecipe(
                                "Coca Cola",
                                "Eisgekühlte Coca Cola Dose. Erfrischend serviert.",
                                new BigDecimal("3.50"),
                                "/uploads/products/coca_cola.png",
                                "Getränke", false);
                addRecipeIngredient(cocaCola, "Cola Dose", 1.0);
                recipeRepository.save(cocaCola);

                Recipe mineralwasser = createRecipe(
                                "Mineralwasser",
                                "Prickelnd frisches Mineralwasser aus den Alpen.",
                                new BigDecimal("2.90"),
                                "/uploads/products/mineralwasser.png",
                                "Getränke", false);
                addRecipeIngredient(mineralwasser, "Mineralwasser Flasche", 1.0);
                recipeRepository.save(mineralwasser);

                Recipe backhendlsalat = createRecipe(
                                "Backhendlsalat",
                                "Knuspriges paniertes Hühnchen auf frischem Blattsalat mit Kürbiskernöl-Dressing.",
                                new BigDecimal("14.90"),
                                "/uploads/products/backhendlsalat.png",
                                "Salat", true);
                addRecipeIngredient(backhendlsalat, "Hühnerbrust", 0.150);
                addRecipeIngredient(backhendlsalat, "Weizenmehl (glatt)", 0.030);
                addRecipeIngredient(backhendlsalat, "Eier", 1.0);
                addRecipeIngredient(backhendlsalat, "Semmelbrösel", 0.040);
                addRecipeIngredient(backhendlsalat, "Sonnenblumenöl", 0.100);
                recipeRepository.save(backhendlsalat);
        }

        private Recipe createRecipe(String name, String description, BigDecimal price,
                        String imagePath, String category, boolean sendToKitchen) {
                return Recipe.builder()
                                .name(name)
                                .description(description)
                                .sellingPrice(price)
                                .imagePath(imagePath)
                                .category(category)
                                .sendToKitchen(sendToKitchen)
                                .build();
        }

        private void addRecipeIngredient(Recipe recipe, String ingredientName, double amount) {
                Ingredient ingredient = ingredientMap.get(ingredientName);
                if (ingredient == null) {
                        return;
                }

                RecipeIngredient ri = RecipeIngredient.builder()
                                .recipe(recipe)
                                .ingredient(ingredient)
                                .amount(new BigDecimal(String.valueOf(amount)))
                                .build();

                recipe.addIngredient(ri);
        }

        private void seedWasteLogs() {
                LocalDateTime now = LocalDateTime.now();

                createWasteLog("Schlagobers", 1.5, "Abgelaufen (MHD überschritten)", now.minusDays(6));
                createWasteLog("Sauerrahm", 0.8, "Abgelaufen (MHD überschritten)", now.minusDays(5));
                createWasteLog("Eier", 6.0, "Beschädigt beim Transport", now.minusDays(4));
                createWasteLog("Kartoffeln", 2.0, "Gekeimt und ungenießbar", now.minusDays(3));
                createWasteLog("Butter", 0.5, "Auf Boden gefallen", now.minusDays(2));
                createWasteLog("Kalbfleisch", 0.3, "Überkocht/verbrannt", now.minusDays(2));
                createWasteLog("Petersilie", 2.0, "Welk geworden", now.minusDays(1));
                createWasteLog("Zwiebeln", 1.0, "Schimmelbefall entdeckt", now.minusDays(1));
        }

        private void createWasteLog(String ingredientName, double quantity, String reason, LocalDateTime date) {
                Ingredient ingredient = ingredientMap.get(ingredientName);
                if (ingredient == null) {
                        return;
                }

                WasteLog wasteLog = WasteLog.builder()
                                .ingredient(ingredient)
                                .quantity(new BigDecimal(String.valueOf(quantity)))
                                .reason(reason)
                                .date(date)
                                .build();

                wasteLogRepository.save(wasteLog);
        }
}
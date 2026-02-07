package com.stockmeister.backend.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.Statement;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class DatabaseMigrationRunner {

    private final DataSource dataSource;

    @Bean
    @Order(1) // Run before DataSeeder
    public ApplicationRunner runMigrations() {
        return args -> {
            log.info("🔧 Running database migrations...");

            try (Connection conn = dataSource.getConnection();
                    Statement stmt = conn.createStatement()) {

                executeIfColumnNotExists(stmt, "ingredients", "is_active",
                        "ALTER TABLE ingredients ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true");

                executeIfColumnNotExists(stmt, "ingredients", "deleted_at",
                        "ALTER TABLE ingredients ADD COLUMN deleted_at TIMESTAMP");

                executeIfColumnNotExists(stmt, "recipes", "is_active",
                        "ALTER TABLE recipes ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true");

                executeIfColumnNotExists(stmt, "recipes", "deleted_at",
                        "ALTER TABLE recipes ADD COLUMN deleted_at TIMESTAMP");

                log.info("✅ Database migrations completed successfully!");

            } catch (Exception e) {
                log.warn("⚠️ Migration warning (might be first run): {}", e.getMessage());
            }
        };
    }

    private void executeIfColumnNotExists(Statement stmt, String table, String column, String alterSql) {
        try {

            String checkSql = String.format(
                    "SELECT column_name FROM information_schema.columns WHERE table_name = '%s' AND column_name = '%s'",
                    table, column);

            var rs = stmt.executeQuery(checkSql);
            if (!rs.next()) {

                stmt.execute(alterSql);
                log.info("  ✓ Added column {}.{}", table, column);
            } else {
                log.debug("  → Column {}.{} already exists", table, column);
            }
            rs.close();
        } catch (Exception e) {
            log.debug("  → Could not check/add column {}.{}: {}", table, column, e.getMessage());
        }
    }
}

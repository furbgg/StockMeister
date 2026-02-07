DROP TABLE IF EXISTS ingredients CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE users (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN', 'MANAGER', 'STAFF')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);

CREATE TABLE ingredients (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    unit VARCHAR(20) NOT NULL,
    current_stock NUMERIC(10, 3) DEFAULT 0 CHECK (current_stock >= 0),
    minimum_stock NUMERIC(10, 3) DEFAULT 0,
    unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
    supplier VARCHAR(100),
    nutrition_info JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ingredients_name ON ingredients(name);
CREATE INDEX idx_ingredients_category ON ingredients(category);
CREATE INDEX idx_ingredients_nutrition_info ON ingredients USING GIN (nutrition_info);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_ingredients_updated_at BEFORE UPDATE ON ingredients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

INSERT INTO users (username, email, password_hash, role) VALUES
('admin', 'admin@gastroanalyst.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhCy', 'ADMIN');

INSERT INTO ingredients (name, category, unit, current_stock, minimum_stock, unit_price, supplier, nutrition_info) VALUES
('Flour', 'Bakery', 'kg', 50.000, 10.000, 1.20, 'Schmidt Mill', '{"calories": 364, "protein": 10, "carbs": 76, "allergens": ["gluten"]}'),
('Whole Milk', 'Dairy', 'liter', 30.000, 15.000, 0.89, 'Mueller Dairy', '{"calories": 64, "protein": 3.4, "fat": 3.5, "allergens": ["lactose"]}'),
('Tomatoes', 'Vegetables', 'kg', 25.000, 5.000, 2.50, 'Bio Farm Wagner', '{"calories": 18, "protein": 0.9, "carbs": 3.9, "fiber": 1.2}'),
('Olive Oil', 'Oils', 'liter', 10.000, 3.000, 8.50, 'Mediterranean Imports', '{"calories": 884, "fat": 100, "saturated_fat": 14}');
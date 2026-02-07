-- ============================================
-- GastroAnalyst Veritabanı Şeması (PostgreSQL 16)
-- Faz 1: Temel Tablolar (users + ingredients)
-- ============================================

-- UUID extension'ı etkinleştir
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- TABLO: users (Şema İngilizce kalıyor)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN', 'MANAGER', 'STAFF')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ============================================
-- TABLO: ingredients (Şema İngilizce kalıyor)
-- ============================================
CREATE TABLE IF NOT EXISTS ingredients (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50), 
    unit VARCHAR(20) NOT NULL, 
    current_stock NUMERIC(10, 3) DEFAULT 0 CHECK (current_stock >= 0),
    minimum_stock NUMERIC(10, 3) DEFAULT 0,
    unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
    supplier VARCHAR(100),
    
    -- JSONB: Teknik anahtarlar (calories vb.) genelde İngilizce kalır, standarttır.
    nutrition_info JSONB, 
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ingredients_name ON ingredients(name);
CREATE INDEX IF NOT EXISTS idx_ingredients_category ON ingredients(category);
CREATE INDEX IF NOT EXISTS idx_ingredients_nutrition_info ON ingredients USING GIN (nutrition_info);

-- ============================================
-- TRIGGER: Tarihleri Güncelleme
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_users_updated_at ON users;
CREATE TRIGGER trigger_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_ingredients_updated_at ON ingredients;
CREATE TRIGGER trigger_ingredients_updated_at
    BEFORE UPDATE ON ingredients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- BAŞLANGIÇ VERİLERİ (ALMANCA İÇERİK) 🇩🇪
-- ============================================

-- Admin Kullanıcısı
INSERT INTO users (username, email, password_hash, role)
SELECT 'admin', 'admin@gastroanalyst.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhCy', 'ADMIN'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin');

-- Malzemeler (Artık Almanca!)
-- name, category, unit, supplier -> ALMANCA
INSERT INTO ingredients (name, category, unit, current_stock, minimum_stock, unit_price, supplier, nutrition_info)
SELECT 
    'Mehl',               -- Un -> Mehl
    'Backwaren',          -- Fırın Ürünleri -> Backwaren
    'kg', 
    50.000, 10.000, 1.20, 
    'Mühle Schmidt',      -- Değirmen -> Mühle
    '{"calories": 364, "protein": 10, "carbs": 76, "allergens": ["gluten"]}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM ingredients WHERE name = 'Mehl')

UNION ALL

SELECT 
    'Vollmilch',          -- Tam Yağlı Süt -> Vollmilch
    'Milchprodukte',      -- Süt Ürünleri -> Milchprodukte
    'Liter',              -- Litre -> Liter
    30.000, 15.000, 0.89, 
    'Molkerei Müller',    -- Mandıra -> Molkerei
    '{"calories": 64, "protein": 3.4, "fat": 3.5, "allergens": ["lactose"]}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM ingredients WHERE name = 'Vollmilch')

UNION ALL

SELECT 
    'Tomaten',            -- Domates -> Tomaten
    'Gemüse',             -- Sebzeler -> Gemüse
    'kg', 
    25.000, 5.000, 2.50, 
    'Bio-Hof Wagner',     -- Çiftlik -> Hof
    '{"calories": 18, "protein": 0.9, "carbs": 3.9, "fiber": 1.2}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM ingredients WHERE name = 'Tomaten')

UNION ALL

SELECT 
    'Olivenöl',           -- Zeytinyağı -> Olivenöl
    'Öle & Fette',        -- Yağlar -> Öle & Fette
    'Liter', 
    10.000, 3.000, 8.50, 
    'Mittelmeer Import', 
    '{"calories": 884, "fat": 100, "saturated_fat": 14}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM ingredients WHERE name = 'Olivenöl');
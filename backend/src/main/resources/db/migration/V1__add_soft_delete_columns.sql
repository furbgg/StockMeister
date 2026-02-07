-- Soft Delete Migration: Add is_active and deleted_at columns

-- Ingredients table
ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- Recipes table
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

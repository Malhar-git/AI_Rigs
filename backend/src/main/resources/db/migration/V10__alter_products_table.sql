-- Align products table with full catalog schema

ALTER TABLE products
    ALTER COLUMN id SET DEFAULT gen_random_uuid(),
    ALTER COLUMN category TYPE VARCHAR(50),
    ALTER COLUMN category SET NOT NULL,
    ALTER COLUMN name SET NOT NULL,
    ALTER COLUMN price_inr TYPE NUMERIC(12, 2),
    ALTER COLUMN price_inr SET NOT NULL;

UPDATE products
SET price_inr = 0
WHERE price_inr IS NULL;

ALTER TABLE products
    ADD COLUMN IF NOT EXISTS brand VARCHAR(100),
    ADD COLUMN IF NOT EXISTS vram_gb INT,
    ADD COLUMN IF NOT EXISTS in_stock BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT now(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT now();

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'uq_products_name'
    ) THEN
        ALTER TABLE products
            ADD CONSTRAINT uq_products_name UNIQUE (name);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_products_category
    ON products (category);

CREATE INDEX IF NOT EXISTS idx_products_category_price
    ON products (category, price_inr ASC);

CREATE INDEX IF NOT EXISTS idx_products_category_vram
    ON products (category, vram_gb DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_products_brand
    ON products (brand);

CREATE INDEX IF NOT EXISTS idx_products_in_stock
    ON products (in_stock);

CREATE INDEX IF NOT EXISTS idx_products_specs_gin
    ON products USING GIN (specs);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'trg_products_updated_at'
    ) THEN
        CREATE TRIGGER trg_products_updated_at
            BEFORE UPDATE ON products
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

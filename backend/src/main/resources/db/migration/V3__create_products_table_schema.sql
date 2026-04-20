CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY,
    category VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    price_inr NUMERIC(10, 2),
    specs JSONB
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products (category);
CREATE INDEX IF NOT EXISTS idx_products_name ON products (name);


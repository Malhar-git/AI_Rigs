-- V12__alter_build_tables_add_columns.sql
-- Safely add columns and indexes required by Build and BuildItem entities
-- Uses IF NOT EXISTS so it is safe to run against databases where some columns
-- are already present (development environments).

-- Add/ensure build columns
ALTER TABLE IF EXISTS builds
    ADD COLUMN IF NOT EXISTS session_id        VARCHAR(255),
    ADD COLUMN IF NOT EXISTS user_id           UUID,
    ADD COLUMN IF NOT EXISTS answers           JSONB,
    ADD COLUMN IF NOT EXISTS ai_raw_response   JSONB,
    ADD COLUMN IF NOT EXISTS build_name        VARCHAR(255),
    ADD COLUMN IF NOT EXISTS total_price_inr   NUMERIC(12,2),
    ADD COLUMN IF NOT EXISTS summary_reasoning TEXT,
    ADD COLUMN IF NOT EXISTS zoom_level        VARCHAR(20),
    ADD COLUMN IF NOT EXISTS dim_others        BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS vram_floor_gb     INT,
    ADD COLUMN IF NOT EXISTS task              VARCHAR(50),
    ADD COLUMN IF NOT EXISTS model_name        VARCHAR(255),
    ADD COLUMN IF NOT EXISTS budget_tier       VARCHAR(50),
    ADD COLUMN IF NOT EXISTS created_at        TIMESTAMP DEFAULT now();

-- Add/ensure build_items columns
ALTER TABLE IF EXISTS build_items
    ADD COLUMN IF NOT EXISTS product_id    UUID,
    ADD COLUMN IF NOT EXISTS category      VARCHAR(50),
    ADD COLUMN IF NOT EXISTS product_name  VARCHAR(255),
    ADD COLUMN IF NOT EXISTS brand         VARCHAR(100),
    ADD COLUMN IF NOT EXISTS price_inr     NUMERIC(12,2),
    ADD COLUMN IF NOT EXISTS vram_gb       INT,
    ADD COLUMN IF NOT EXISTS is_primary    BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS ai_reason     TEXT,
    ADD COLUMN IF NOT EXISTS sku           VARCHAR(100);

-- Ensure NOT NULL constraints where entity expects them. Only add constraint if
-- the column exists and no conflicting constraint is present.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name='build_items' AND column_name='category') AND
       NOT EXISTS (SELECT 1 FROM pg_constraint c
                   JOIN pg_class t ON c.conrelid = t.oid
                   WHERE t.relname = 'build_items' AND c.conname = 'chk_build_items_category_not_null') THEN
        -- Adding a named check constraint to simulate NOT NULL safely when existing rows may be NULL
        -- We do not set NOT NULL directly to avoid failures on existing data; consider backfilling then altering.
        BEGIN
            ALTER TABLE build_items ALTER COLUMN category SET DEFAULT 'unknown';
            UPDATE build_items SET category = 'unknown' WHERE category IS NULL;
            ALTER TABLE build_items ALTER COLUMN category SET NOT NULL;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not enforce NOT NULL on build_items.category right now: %', SQLERRM;
        END;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name='build_items' AND column_name='product_name') THEN
        BEGIN
            ALTER TABLE build_items ALTER COLUMN product_name SET DEFAULT '';
            UPDATE build_items SET product_name = '' WHERE product_name IS NULL;
            ALTER TABLE build_items ALTER COLUMN product_name SET NOT NULL;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not enforce NOT NULL on build_items.product_name right now: %', SQLERRM;
        END;
    END IF;
END$$;

-- Indexes: create if not exists
CREATE INDEX IF NOT EXISTS idx_builds_session_id   ON builds (session_id);
CREATE INDEX IF NOT EXISTS idx_builds_user_id      ON builds (user_id);
CREATE INDEX IF NOT EXISTS idx_builds_task         ON builds (task);
CREATE INDEX IF NOT EXISTS idx_builds_created_at   ON builds (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_build_items_build   ON build_items (build_id);
CREATE INDEX IF NOT EXISTS idx_build_items_product ON build_items (product_id);

-- Optional: create GIN indexes for JSONB if heavy queries expected (commented)
-- CREATE INDEX IF NOT EXISTS idx_builds_answers_gin ON builds USING GIN (answers);
-- CREATE INDEX IF NOT EXISTS idx_builds_ai_raw_response_gin ON builds USING GIN (ai_raw_response);


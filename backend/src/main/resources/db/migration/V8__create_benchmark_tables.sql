-- Ensure gen_random_uuid() is available for UUID defaults.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Evolve model_benchmarks from FK-based model reference to denormalized benchmark metadata.
-- Note: id remains the primary key; we only add a default UUID generator for new inserts.
ALTER TABLE model_benchmarks
    ALTER COLUMN id SET DEFAULT gen_random_uuid(),
    ADD COLUMN IF NOT EXISTS model_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS confidence_interval INT,
    ADD COLUMN IF NOT EXISTS license VARCHAR(100),
    ADD COLUMN IF NOT EXISTS price_raw VARCHAR(100),
    ADD COLUMN IF NOT EXISTS context_raw VARCHAR(50),
    ADD COLUMN IF NOT EXISTS category VARCHAR(100),
    ADD COLUMN IF NOT EXISTS source VARCHAR(100);

-- Backfill required columns before enforcing NOT NULL constraints.
UPDATE model_benchmarks
SET model_name = COALESCE(model_name, 'unknown_model'),
    category = COALESCE(category, 'general'),
    source = COALESCE(source, 'manual')
WHERE model_name IS NULL
   OR category IS NULL
   OR source IS NULL;

-- Enforce required fields used by the new ingestion contract.
ALTER TABLE model_benchmarks
    ALTER COLUMN model_name SET NOT NULL,
    ALTER COLUMN category SET NOT NULL,
    ALTER COLUMN source SET NOT NULL;

-- Remove old relation to ai_model now that benchmarks are keyed by model_name + category.
ALTER TABLE model_benchmarks DROP CONSTRAINT IF EXISTS fk_model_benchmarks_model;
ALTER TABLE model_benchmarks DROP COLUMN IF EXISTS model_id;

-- Add uniqueness guard for category-specific model rows.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'uq_model_category'
    ) THEN
        ALTER TABLE model_benchmarks
            ADD CONSTRAINT uq_model_category UNIQUE (model_name, category);
    END IF;
END $$;

-- Relax sync_log to match new payload shape and UUID default behavior.
ALTER TABLE sync_log
    ALTER COLUMN id SET DEFAULT gen_random_uuid(),
    ALTER COLUMN status TYPE VARCHAR(255),
    ALTER COLUMN rows_upserted DROP NOT NULL;

-- Replace obsolete index and add query-focused indexes for benchmark and sync reporting.
DROP INDEX IF EXISTS idx_model_benchmarks_model_id;
CREATE INDEX IF NOT EXISTS idx_model_benchmarks_category
    ON model_benchmarks (category);
CREATE INDEX IF NOT EXISTS idx_model_benchmarks_category_rank
    ON model_benchmarks (category, arena_rank ASC);
CREATE INDEX IF NOT EXISTS idx_sync_log_source_ran
    ON sync_log (source, ran_at DESC);
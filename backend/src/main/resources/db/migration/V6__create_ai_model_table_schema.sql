CREATE TABLE IF NOT EXISTS ai_model (
    id UUID PRIMARY KEY,
    model_name VARCHAR(255) NOT NULL,
    model_family VARCHAR(255) NOT NULL,
    vram_min_gb INTEGER NOT NULL,
    precision_variants JSONB,
    skip_precision BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_ai_model_model_name ON ai_model (model_name);
CREATE INDEX IF NOT EXISTS idx_ai_model_model_family ON ai_model (model_family);

-- Stores application user identities and basic profile/role data.
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    role VARCHAR(100) NOT NULL
);

-- Stores each generated build session and the AI input/output payloads.
CREATE TABLE IF NOT EXISTS builds (
    id UUID PRIMARY KEY,
    user_id UUID,
    session_id VARCHAR(255) NOT NULL,
    answers JSONB,
    ai_response JSONB,
    total_price_inr NUMERIC(10, 2),
    created_at TIMESTAMP NOT NULL,
    CONSTRAINT fk_builds_user FOREIGN KEY (user_id) REFERENCES users (id)
);

-- Stores component-level product selections that belong to a build.
CREATE TABLE IF NOT EXISTS build_items (
    id UUID PRIMARY KEY,
    build_id UUID NOT NULL,
    product_id UUID NOT NULL,
    category VARCHAR(255) NOT NULL,
    ai_reason TEXT,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_build_items_build FOREIGN KEY (build_id) REFERENCES builds (id),
    CONSTRAINT fk_build_items_product FOREIGN KEY (product_id) REFERENCES products (id)
);

-- Stores hardware benchmark metrics for accelerators/GPUs.
CREATE TABLE IF NOT EXISTS gpu_benchmarks (
    id UUID PRIMARY KEY,
    accelerator VARCHAR(255) NOT NULL,
    vram_gb INTEGER,
    gen_tps NUMERIC(10, 2),
    prompt_tps NUMERIC(10, 2),
    localscore INTEGER
);

-- Stores model leaderboard metrics linked to a catalog AI model.
CREATE TABLE IF NOT EXISTS model_benchmarks (
    id UUID PRIMARY KEY,
    model_id UUID NOT NULL,
    arena_rank INTEGER,
    elo_score INTEGER,
    votes INTEGER,
    synced_at TIMESTAMP NOT NULL,
    CONSTRAINT fk_model_benchmarks_model FOREIGN KEY (model_id) REFERENCES ai_model (id)
);

-- Stores ingestion/synchronization run audit records.
CREATE TABLE IF NOT EXISTS sync_log (
    id UUID PRIMARY KEY,
    source VARCHAR(100) NOT NULL,
    status VARCHAR(100) NOT NULL,
    rows_upserted INTEGER NOT NULL,
    ran_at TIMESTAMP NOT NULL
);

-- Performance indexes for common lookup and join columns.
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_builds_user_id ON builds (user_id);
CREATE INDEX IF NOT EXISTS idx_builds_session_id ON builds (session_id);
CREATE INDEX IF NOT EXISTS idx_build_items_build_id ON build_items (build_id);
CREATE INDEX IF NOT EXISTS idx_build_items_product_id ON build_items (product_id);
CREATE INDEX IF NOT EXISTS idx_gpu_benchmarks_accelerator ON gpu_benchmarks (accelerator);
CREATE INDEX IF NOT EXISTS idx_model_benchmarks_model_id ON model_benchmarks (model_id);
CREATE INDEX IF NOT EXISTS idx_sync_log_source ON sync_log (source);


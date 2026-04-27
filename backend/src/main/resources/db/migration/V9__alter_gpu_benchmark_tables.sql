-- Ensure gen_random_uuid() is available for UUID defaults.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Recreate GPU benchmark tables in a normalized shape used by the sync flow.
DROP TABLE IF EXISTS gpu_benchmark_details;
DROP TABLE IF EXISTS gpu_benchmark_results;

CREATE TABLE gpu_benchmark_results (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    localscore_test_id  INT          NOT NULL UNIQUE,
    tested_at           TIMESTAMP    NOT NULL,
    accelerator_name    VARCHAR(255) NOT NULL,
    accelerator_type    VARCHAR(255) NOT NULL,
    accelerator_vram_gb NUMERIC(6, 1),
    localscore_accel_id INT,
    model_name          VARCHAR(255) NOT NULL,
    model_quantization  VARCHAR(50),
    model_params_b      NUMERIC(6, 2),
    generation_tps      NUMERIC(8, 2),
    prompt_tps          NUMERIC(10, 2),
    ttft_ms             NUMERIC(10, 2),
    localscore          INT,
    cpu_name            VARCHAR(255),
    system_ram_gb       NUMERIC(6, 1),
    os_name             VARCHAR(50),
    runtime_name        VARCHAR(50),
    runtime_version     VARCHAR(20),
    synced_at           TIMESTAMP    NOT NULL
);

CREATE TABLE gpu_benchmark_details (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    benchmark_result_id UUID        NOT NULL REFERENCES gpu_benchmark_results(id) ON DELETE CASCADE,
    test_name           VARCHAR(50) NOT NULL,
    prompt_tps          NUMERIC(10, 2),
    generation_tps      NUMERIC(8, 2),
    ttft_ms             NUMERIC(10, 2)
);

CREATE INDEX idx_gbr_accelerator_name
    ON gpu_benchmark_results (accelerator_name);

CREATE INDEX idx_gbr_model_name
    ON gpu_benchmark_results (model_name);

CREATE INDEX idx_gbr_tested_at
    ON gpu_benchmark_results (tested_at DESC);

CREATE INDEX idx_gbr_localscore
    ON gpu_benchmark_results (localscore DESC);

CREATE INDEX idx_gbd_result_id
    ON gpu_benchmark_details (benchmark_result_id);
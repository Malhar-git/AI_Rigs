ALTER TABLE ai_model
    ADD COLUMN IF NOT EXISTS task_types JSONB;

CREATE INDEX IF NOT EXISTS idx_ai_model_task_types ON ai_model USING GIN (task_types);
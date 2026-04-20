ALTER TABLE event_publication
    ADD COLUMN IF NOT EXISTS completion_attempts INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS status VARCHAR(255) NOT NULL DEFAULT 'PROCESSING',
    ADD COLUMN IF NOT EXISTS last_resubmission_date TIMESTAMPTZ;

-- Ensure existing rows satisfy non-null constraints when upgrading from earlier local schemas.
UPDATE event_publication
SET completion_attempts = COALESCE(completion_attempts, 0),
    status = COALESCE(status, CASE WHEN completion_date IS NULL THEN 'PROCESSING' ELSE 'COMPLETED' END);

ALTER TABLE completed_event_publication
    ADD COLUMN IF NOT EXISTS completion_attempts INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS status VARCHAR(255) NOT NULL DEFAULT 'COMPLETED',
    ADD COLUMN IF NOT EXISTS last_resubmission_date TIMESTAMPTZ;

UPDATE completed_event_publication
SET completion_attempts = COALESCE(completion_attempts, 0),
    status = COALESCE(status, 'COMPLETED');


ALTER TABLE users
    ADD COLUMN IF NOT EXISTS pending_deletion     BOOLEAN    DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS deletion_scheduled_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_users_pending_deletion
    ON users(deletion_scheduled_at)
    WHERE pending_deletion = TRUE;


CREATE TABLE IF NOT EXISTS poll_votes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    option_id text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (message_id, user_id, option_id)
);

CREATE INDEX IF NOT EXISTS poll_votes_message_id_idx ON poll_votes(message_id);

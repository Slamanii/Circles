create table follows (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id uuid references auth.user(id),
    following_id uuid references auth.user(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
)
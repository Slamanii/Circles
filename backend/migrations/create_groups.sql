create table groups (
    id uuid primary key default gen_random_uuid(),
    groupName text not null,
    groupImage text not null,
    createdBy text references user(userName),
    isEventGroup boolean default true,
    is_locked boolean default false,
    createdAt timestamptz DEFAULT now(),
)

CREATE TABLE group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,

    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    role TEXT NOT NULL CHECK (role IN ('admin', 'member')),

    muted BOOLEAN DEFAULT false,

    joined_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (group_id, user_id),

    last_read_at TIMESTAMPTZ,
);

CREATE INDEX idx_group_members_user_id ON group_members(user_id); 
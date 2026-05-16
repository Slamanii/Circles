create table messages (
    id uuid primary key default gen_random_uuid(),
    group_id uuid not null references groups(id) on delete cascade,
    sender_id uuid references user(id),
    senderName text not null,
    content text not null,
    type text not null
        check (type in ("text", "image", "video", "system")),
    status text not null
        check (status in("sending", "sent", "delivered", "read")),
    media jsonb default text,
    file_url default text,
    deleted boolean default false,
    deleted_for uuid[] default '{}',
    is_pinned boolean default false,
    edited_at TIMESTAMPTZ,
    created_at timestamptz default now(),
);

CREATE INDEX idx_messages_group_id ON messages(group_id);
CREATE INDEX idx_group_members_user_id ON group_members(user_id);
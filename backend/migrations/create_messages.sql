CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
    senderName TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('text', 'image', 'video', 'system')),
    status TEXT NOT NULL CHECK (status IN ('sending', 'sent', 'delivered', 'read')),
    media JSONB,
    file_url TEXT,
    deleted BOOLEAN DEFAULT FALSE,
    deleted_for UUID[] DEFAULT '{}',
    is_pinned BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_group_id ON messages(group_id);

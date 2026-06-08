-- Widen the type constraint to cover all notification types now in use
ALTER TABLE notifications
    DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications
    ADD CONSTRAINT notifications_type_check
    CHECK (type IN ('chat', 'event', 'collectible', 'wallet', 'mention', 'like', 'follow'));

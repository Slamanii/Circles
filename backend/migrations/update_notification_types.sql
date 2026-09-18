-- Replace the generic type bucket with granular, per-action types so every
-- notification can be titled and routed without ambiguity.
ALTER TABLE notifications
    DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications
    ADD CONSTRAINT notifications_type_check
    CHECK (type IN (
        'chat_message', 'chat_mention', 'chat_removed_from_group', 'chat_member_left',
        'chat_made_admin', 'chat_group_deleted', 'follow_new', 'event_liked', 'event_mint_complete',
        'event_mint_failed', 'story_liked', 'collectible_received', 'collectible_purchase_confirmed',
        'wallet_reservation_refunded'
    ));

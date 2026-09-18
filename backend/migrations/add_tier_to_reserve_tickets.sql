-- reserve_tickets gains a tier_id param — reservation now scans within a
-- specific tier's pending pool instead of the whole event's. Supersedes the
-- 3-arg version from add_reservation_timeout.sql.

DROP FUNCTION IF EXISTS reserve_tickets(UUID, INTEGER, UUID);

CREATE OR REPLACE FUNCTION reserve_tickets(
    p_event_id UUID,
    p_quantity INTEGER,
    p_user_id  UUID,
    p_tier_id  UUID
) RETURNS TABLE(id UUID, asset_id TEXT)
LANGUAGE plpgsql AS $$
BEGIN
    -- Stale-reservation sweep stays event-scoped (not tier-scoped) — releasing
    -- a lapsed reservation doesn't need to know which tier it belonged to,
    -- tier_id stays on the row and flows back into the pending pool correctly.
    UPDATE collectibles
    SET status = 'pending', owner_id = NULL, reserved_at = NULL
    WHERE event_id = p_event_id AND status = 'reserved'
      AND reserved_at < now() - interval '5 minutes';

    RETURN QUERY
    UPDATE collectibles
    SET status = 'reserved', owner_id = p_user_id, reserved_at = now()
    WHERE collectibles.id IN (
        SELECT c.id FROM collectibles c
        WHERE c.event_id = p_event_id AND c.tier_id = p_tier_id
          AND c.custodian = 'treasury' AND c.status = 'pending'
        ORDER BY c.serial_number
        LIMIT p_quantity
        FOR UPDATE SKIP LOCKED
    )
    RETURNING collectibles.id, collectibles.asset_id;
END;
$$;

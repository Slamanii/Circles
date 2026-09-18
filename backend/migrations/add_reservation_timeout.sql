-- Reserve-before-payment: reserve_tickets now tags reservations with the
-- reserving user and a timestamp, and self-heals stale reservations (a user
-- who quoted but never paid within the window) back to 'pending' before
-- reserving more — no cron needed, the sweep runs inline on every call.
-- The sweep is scoped to a single event's rows (bounded by that event's
-- ticket supply, not the whole table) and normally matches zero rows, so it
-- runs unconditionally on every call rather than being gated on low supply.

alter table collectibles add column if not exists reserved_at timestamptz;

create index if not exists idx_collectibles_event_status on collectibles (event_id, status);

-- Postgres overloads functions by argument list, not just name — the old
-- 2-arg reserve_tickets(UUID, INTEGER) would otherwise linger alongside this
-- new 3-arg version instead of being replaced by it.
drop function if exists reserve_tickets(UUID, INTEGER);

create or replace function reserve_tickets(
    p_event_id UUID,
    p_quantity INTEGER,
    p_user_id  UUID
) RETURNS TABLE(id UUID, asset_id TEXT)
LANGUAGE plpgsql AS $$
BEGIN
    -- Release this event's abandoned reservations (older than 5 minutes —
    -- comfortably longer than a normal Solana confirmation) back to the pool.
    -- Not scoped to p_user_id: it needs to reclaim anyone's abandoned
    -- reservation, not just the calling user's own.
    UPDATE collectibles
    SET status = 'pending', owner_id = NULL, reserved_at = NULL
    WHERE event_id  = p_event_id
      AND status    = 'reserved'
      AND reserved_at < now() - interval '5 minutes';

    RETURN QUERY
    UPDATE collectibles
    SET status = 'reserved', owner_id = p_user_id, reserved_at = now()
    WHERE collectibles.id IN (
        SELECT c.id
        FROM collectibles c
        WHERE c.event_id  = p_event_id
          AND c.custodian = 'treasury'
          AND c.status    = 'pending'
        ORDER BY c.serial_number
        LIMIT p_quantity
        FOR UPDATE SKIP LOCKED
    )
    RETURNING collectibles.id, collectibles.asset_id;
END;
$$;

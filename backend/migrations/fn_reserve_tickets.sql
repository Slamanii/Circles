-- Atomically reserves up to p_quantity pending tickets for an event.
-- FOR UPDATE SKIP LOCKED ensures concurrent calls never claim the same row.
CREATE OR REPLACE FUNCTION reserve_tickets(
    p_event_id UUID,
    p_quantity  INTEGER
) RETURNS TABLE(id UUID, asset_id TEXT)
LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    UPDATE collectibles
    SET status = 'reserved'
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

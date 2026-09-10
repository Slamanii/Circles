-- Tracks the state of an event's background ticket-minting job so it can be
-- detached from the create-event HTTP request and safely resumed after a crash.
-- eventAccount.minted (on-chain) remains the source of truth for *how many*
-- tickets are minted — these columns only track job status and the claim lock.
ALTER TABLE events
    ADD COLUMN mint_status TEXT NOT NULL DEFAULT 'pending'
        CHECK (mint_status IN ('pending', 'in_progress', 'completed', 'failed')),
    ADD COLUMN mint_lock_owner TEXT,
    ADD COLUMN mint_lock_acquired_at TIMESTAMPTZ,
    ADD COLUMN mint_attempts INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN mint_last_error TEXT,
    ADD COLUMN mint_completed_at TIMESTAMPTZ;

CREATE INDEX idx_events_mint_status ON events (mint_status, mint_lock_acquired_at);

-- Defense in depth: the atomic claim below is what actually prevents two mint
-- runs from overlapping. This constraint just turns any bypass of that lock
-- (a bug, a manual RPC call, a future script) into a loud insert error
-- instead of a silent duplicate ticket.
ALTER TABLE collectibles
    ADD CONSTRAINT collectibles_event_serial_unique UNIQUE (event_id, serial_number);

-- Atomically claims the right to run (or resume) an event's mint job.
-- Succeeds when the job is pending/failed, or when a previous claim has gone
-- stale (its owner crashed without releasing the lock). A plain single-row
-- UPDATE ... WHERE is already atomic under Postgres MVCC — no FOR UPDATE
-- needed, unlike reserve_tickets() which selects from a set of rows.
CREATE OR REPLACE FUNCTION claim_event_mint(
    p_event_id UUID,
    p_worker_id TEXT,
    p_stale_minutes INTEGER DEFAULT 15
) RETURNS BOOLEAN
LANGUAGE plpgsql AS $$
DECLARE
    affected_rows INTEGER;
BEGIN
    UPDATE events
    SET mint_status = 'in_progress',
        mint_lock_owner = p_worker_id,
        mint_lock_acquired_at = now(),
        mint_attempts = mint_attempts + 1
    WHERE events.id = p_event_id
      AND (
          events.mint_status IN ('pending', 'failed')
          OR (
              events.mint_status = 'in_progress'
              AND events.mint_lock_acquired_at < now() - (p_stale_minutes || ' minutes')::interval
          )
      );

    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    RETURN affected_rows > 0;
END;
$$;

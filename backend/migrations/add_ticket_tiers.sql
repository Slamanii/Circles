-- Multi-tier ticket pricing: every event becomes tier-based under the hood.
-- Existing events get a synthetic "General Admission" tier backfilled from
-- their current flat ticket_price/ticket_supply so no legacy no-tier code
-- path is needed anywhere downstream (reservation, purchase, minting, display).

CREATE TABLE ticket_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price INTEGER NOT NULL,
    supply INTEGER NOT NULL,
    info TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE collectibles ADD COLUMN IF NOT EXISTS tier_id UUID REFERENCES ticket_tiers(id);

CREATE INDEX idx_collectibles_event_tier_status ON collectibles (event_id, tier_id, status);

-- Backfill: one "General Admission" tier per existing event, then point its
-- existing collectibles at that tier.
INSERT INTO ticket_tiers (event_id, name, price, supply, sort_order)
SELECT id, 'General Admission', ticket_price, ticket_supply, 0
FROM events;

UPDATE collectibles c
SET tier_id = t.id
FROM ticket_tiers t
WHERE t.event_id = c.event_id AND c.tier_id IS NULL;

ALTER TABLE collectibles ALTER COLUMN tier_id SET NOT NULL;

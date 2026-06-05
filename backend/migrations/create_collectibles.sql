CREATE TABLE collectibles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES users(id),
    event_id UUID NOT NULL REFERENCES events(id),
    asset_id TEXT UNIQUE NOT NULL,
    tree_address TEXT NOT NULL,
    leaf_index INTEGER NOT NULL,
    serial_number INTEGER NOT NULL,
    custodian TEXT NOT NULL DEFAULT 'treasury',
    qr_uri TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('active', 'reserved', 'inActive', 'expired', 'pending')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

create table tx_history (
    id uuid primary key default gen_random_uuid(),
    wallet_role text,
    tx_signature text,
    asset_id text,
    action text,
    to_wallet text,
    created_at timestamptz default now()
);
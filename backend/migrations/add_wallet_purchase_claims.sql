-- Atomically claims a txSignature for a single wallet-purchase confirmation, so the
-- same on-chain payment can never be redeemed for tickets twice (replay protection).
-- The INSERT itself is the atomic claim: a second attempt with the same signature
-- hits the primary key and fails, even under two concurrent requests.
create table wallet_purchase_claims (
    tx_signature text primary key,
    event_id uuid not null references events(id),
    user_id uuid not null references users(id),
    created_at timestamptz not null default now()
);

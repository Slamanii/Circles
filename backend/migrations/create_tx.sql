create table txHistory (
    id uuid primary key default gen_random_uuid(),
    wallet_id uuid references wallets(id) on delete cascade,
    type text not null
        check (type in ("send", "receive", "swap", "buy")),
    token_symbol text not null,
    amount numeric(38, 18) not null 
        check (amount > 0),
    from_address text not null,
    to_address text not null,
    status text not null,
        check(status in ("pending", "confirmed", "failed")),
    txHash text,
    mint text not null,
    createdAt timestamptz not null DEFAULT now(),
);

CREATE INDEX idx_tx_wallet_id ON tx_history(wallet_id);
CREATE INDEX idx_tx_created_at ON tx_history(created_at DESC);
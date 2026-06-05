create table wallets (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id),
    address text not null,
    created_at timestamptz default now(),
)

create table walletHoldings (
    id uuid primary key default gen_random_uuid(),
    wallet_id uuid references wallets(id) on delete cascade,
    mint_address text not null,
    ata_address text not null,
    token_type text not null
        check (token_type in ('solana', 'usdt', 'ethereum', 'cngn')),
    balance numeric(38, 18)  not null 
        check (balance >= 0),
)

create table MintTransfer (
    id,
    mint_address,
    from_treasury,
    to_user_wallet,
    event_id,
    tx_signature,
    created_at,
)



create table users (
    id uuid primary key default gen_random_uuid(),
    email text unique,
    password_hash text,                         -- null for wallet-only accounts
    username text not null unique,
    display_name text not null,
    avatar text,
    wallet_id uuid unique default gen_random_uuid(),
    address text unique,
    verified boolean not null default false,
    private boolean not null default false,
    followers integer not null default 0,
    following integer not null default 0,
    likes integer not null default 0,
    created_at timestamptz default now()
);

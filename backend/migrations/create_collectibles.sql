create table collectibles (
    id uuid primary key default gen_random_uuid(),
    owner_id uuid references users(id),
    event_id uuid not null references events(id),
    asset_id text unique not null,
    tree_address text not null,
    leaf_index integer not null, ---already existing transferred to treasury directly after minting by the program
    serial_number integer not null,
    NFTMetadata text not null,
    custodian text not null default 'treasury',
    venue text not null,
    price integer not null default 0,
    time text not null,
    qrUri text not null,
    active boolean default true,
    status text not null
        check (status in ("active", "reserved", "inActive", "expired", "pending")),
    created_at timestamptz default now(),
 )

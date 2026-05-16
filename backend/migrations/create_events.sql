create table events (
    id uuid primary key default gen_random_uuid(),
    group_id uuid references groups(id) on delete set null,
    flyer_card text,
    title text not null,
    description text not null,
    event_date timestamptz not null,
    time text,
    venue text not null,
    ticket_price integer not null default 0,
    ticket_supply integer not null,
    creator_id uuid references users(id) on delete set null,
    status text not null default 'active'
        check (status in ('active', 'expired', 'cancelled')),
    created_at timestamptz default now()
);

-- Index for expiry job and fetchEvents ordering
create index on events (event_date);
create index on events (status);

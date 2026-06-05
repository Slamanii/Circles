alter table users
    add column if not exists bio      text,
    add column if not exists link_1   text,
    add column if not exists link_2   text,
    add column if not exists location text;

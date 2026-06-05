alter table users
    add column if not exists encrypted_private_key text;

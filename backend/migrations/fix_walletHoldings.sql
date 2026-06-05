-- Fix token_type CHECK (double-quoted string literals are invalid in Postgres)
ALTER TABLE wallet_holdings
    DROP CONSTRAINT IF EXISTS wallet_holdings_token_type_check;

ALTER TABLE wallet_holdings
    ADD CONSTRAINT wallet_holdings_token_type_check
        CHECK (token_type IN ('solana', 'usdt', 'ethereum', 'cngn'));

-- Add last_synced for cache freshness tracking
ALTER TABLE wallet_holdings
    ADD COLUMN IF NOT EXISTS last_synced TIMESTAMPTZ DEFAULT NOW();

-- Prevent duplicate holdings rows for the same wallet+mint
ALTER TABLE wallet_holdings
    DROP CONSTRAINT IF EXISTS wallet_holdings_wallet_mint_unique;
ALTER TABLE wallet_holdings
    ADD CONSTRAINT wallet_holdings_wallet_mint_unique
        UNIQUE (wallet_id, mint_address);

-- Add missing columns
ALTER TABLE collectibles
    ADD COLUMN IF NOT EXISTS metadata_uri   text,
    ADD COLUMN IF NOT EXISTS tx_signature   text,
    ADD COLUMN IF NOT EXISTS owner_address  text;

-- qr_uri is not generated at mint time — make nullable
ALTER TABLE collectibles ALTER COLUMN qr_uri DROP NOT NULL;

-- asset_id must be set at mint — keep NOT NULL but allow migration without breaking existing rows
-- owner_id stays nullable (set when a real app user claims/purchases the ticket)

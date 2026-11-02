ALTER TABLE events ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'other'
    CHECK (category IN ('movie', 'professional', 'concert', 'birthday', 'sports', 'educational', 'private', 'other'));
ALTER TABLE events ADD COLUMN IF NOT EXISTS custom_category TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS invite_token TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS video_url TEXT;

-- flyer_card was a single URL; convert to an array so an event can carry multiple flyer images.
ALTER TABLE events ALTER COLUMN flyer_card DROP DEFAULT;
ALTER TABLE events ALTER COLUMN flyer_card TYPE TEXT[] USING
    CASE WHEN flyer_card IS NULL THEN '{}'::text[] ELSE ARRAY[flyer_card] END;
ALTER TABLE events ALTER COLUMN flyer_card SET DEFAULT '{}';
ALTER TABLE events ALTER COLUMN flyer_card SET NOT NULL;

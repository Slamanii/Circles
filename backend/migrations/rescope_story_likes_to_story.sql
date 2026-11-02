-- Likes were scoped per sub-story segment; a single post that spans several
-- segments should carry one consistent like count, so re-scope to the parent
-- story. The table is currently empty in production, so no data migration
-- is needed — dropping story_item_id also drops its unique constraint.
ALTER TABLE story_likes DROP COLUMN story_item_id;
ALTER TABLE story_likes ADD COLUMN story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE;
ALTER TABLE story_likes ADD CONSTRAINT story_likes_story_id_user_id_key UNIQUE (story_id, user_id);

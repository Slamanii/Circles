CREATE TABLE storyItems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
    duration INTEGER NOT NULL DEFAULT 15,
    media_url TEXT NOT NULL,
    media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
    position INTEGER NOT NULL,
    caption TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE storyViews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_item_id UUID REFERENCES storyItems(id) ON DELETE CASCADE,
    viewer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    viewed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (story_item_id, viewer_id)
);

CREATE TABLE storyLikes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_item_id UUID REFERENCES storyItems(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (story_item_id, user_id)
);

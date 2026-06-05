CREATE TABLE videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID REFERENCES users(id) ON DELETE SET NULL,
    media_url TEXT NOT NULL,
    thumbnail_url TEXT,
    caption TEXT,
    duration INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE audios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT,
    audio_url TEXT NOT NULL,
    creator_id UUID REFERENCES users(id) ON DELETE SET NULL,
    source_type TEXT,
    duration INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE video_audio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
    audio_id UUID REFERENCES audios(id) ON DELETE CASCADE,
    start_time INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE audio_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audio_id UUID REFERENCES audios(id) ON DELETE CASCADE,
    video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
    used_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

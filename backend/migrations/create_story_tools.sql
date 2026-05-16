CREATE TABLE audios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  title TEXT,
  audio_url TEXT NOT NULL,

  creator_id UUID REFERENCES users(id),

  source_type TEXT, 
  -- values: 'user_video', 'public_domain', 'external'

  duration INTEGER,

  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE video_audio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  video_id UUID REFERENCES videos(id),
  audio_id UUID REFERENCES audios(id),

  start_time INTEGER DEFAULT 0,

  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE audio_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  audio_id UUID REFERENCES audios(id),
  video_id UUID REFERENCES videos(id),

  used_by UUID REFERENCES users(id),

  created_at TIMESTAMP DEFAULT now()
);
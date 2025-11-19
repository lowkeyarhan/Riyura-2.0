-- Watch History Table Schema
-- Tracks movies and TV shows that users have watched

CREATE TABLE IF NOT EXISTS watch_history (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tmdb_id BIGINT NOT NULL,
  title TEXT NOT NULL,
  media_type TEXT CHECK (media_type IN ('movie', 'tv')) NOT NULL,
  poster_path TEXT,
  release_date DATE,
  duration_sec INT,
  watched_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups by user
CREATE INDEX IF NOT EXISTS idx_watch_history_user_id ON watch_history(user_id);

-- Index for recently watched items
CREATE INDEX IF NOT EXISTS idx_watch_history_watched_at 
  ON watch_history(user_id, watched_at DESC);

-- Enable Row Level Security
ALTER TABLE watch_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own watch history
CREATE POLICY "Users can view own watch history"
  ON watch_history
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add to own watch history"
  ON watch_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own watch history"
  ON watch_history
  FOR DELETE
  USING (auth.uid() = user_id);

-- Comments
COMMENT ON TABLE watch_history IS 'Movies and TV shows users have watched';
COMMENT ON COLUMN watch_history.tmdb_id IS 'TMDB movie or TV show ID';
COMMENT ON COLUMN watch_history.duration_sec IS 'Movie/episode duration in seconds';

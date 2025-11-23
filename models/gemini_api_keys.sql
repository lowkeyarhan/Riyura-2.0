-- Gemini API Keys Table Schema
-- Stores encrypted Gemini API keys for AI-powered recommendations
-- Security: AES-256-GCM encryption with unique IVs and authentication tags

CREATE TABLE IF NOT EXISTS gemini_api_keys (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  encrypted_key TEXT NOT NULL,
  iv TEXT NOT NULL,
  auth_tag TEXT NOT NULL,
  key_preview TEXT NOT NULL,
  key_version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique constraint: one API key per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_gemini_api_keys_user_id 
  ON gemini_api_keys(user_id);

-- Index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_gemini_api_keys_updated_at 
  ON gemini_api_keys(updated_at DESC);

-- Enable Row Level Security
ALTER TABLE gemini_api_keys ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own API keys
CREATE POLICY "Users can view own API key"
  ON gemini_api_keys
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own API key"
  ON gemini_api_keys
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own API key"
  ON gemini_api_keys
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own API key"
  ON gemini_api_keys
  FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_gemini_api_keys_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_gemini_api_keys_updated_at
  BEFORE UPDATE ON gemini_api_keys
  FOR EACH ROW
  EXECUTE FUNCTION update_gemini_api_keys_updated_at();

-- Comments
COMMENT ON TABLE gemini_api_keys IS 'Encrypted Gemini API keys for AI recommendations';
COMMENT ON COLUMN gemini_api_keys.user_id IS 'User ID from Supabase Auth';
COMMENT ON COLUMN gemini_api_keys.encrypted_key IS 'AES-256-GCM encrypted API key (base64)';
COMMENT ON COLUMN gemini_api_keys.iv IS 'Initialization vector (base64)';
COMMENT ON COLUMN gemini_api_keys.auth_tag IS 'Authentication tag for GCM mode (base64)';
COMMENT ON COLUMN gemini_api_keys.key_preview IS 'First 4 characters for display (e.g., AIza***)';
COMMENT ON COLUMN gemini_api_keys.key_version IS 'Version for key rotation support';

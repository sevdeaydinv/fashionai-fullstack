-- ============================================================
-- FashionAI — Row Level Security Policies
-- ============================================================
-- Rule: auth.uid() must match the user_id column on every table.
-- No user can read or write another user's data.
-- ============================================================

-- ============================================================
-- profiles
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles: users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles: users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Insert is handled by the handle_new_user trigger (SECURITY DEFINER)
-- so we do NOT need an INSERT policy for end-users.

-- ============================================================
-- body_measurements
-- ============================================================

ALTER TABLE body_measurements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "body_measurements: select own"
  ON body_measurements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "body_measurements: insert own"
  ON body_measurements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "body_measurements: update own"
  ON body_measurements FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "body_measurements: delete own"
  ON body_measurements FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- avatars
-- ============================================================

ALTER TABLE avatars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "avatars: select own"
  ON avatars FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "avatars: insert own"
  ON avatars FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "avatars: update own"
  ON avatars FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "avatars: delete own"
  ON avatars FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- wardrobes
-- ============================================================

ALTER TABLE wardrobes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wardrobes: select own"
  ON wardrobes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "wardrobes: insert own"
  ON wardrobes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "wardrobes: update own"
  ON wardrobes FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "wardrobes: delete own"
  ON wardrobes FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- clothes
-- ============================================================

ALTER TABLE clothes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clothes: select own"
  ON clothes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "clothes: insert own"
  ON clothes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "clothes: update own"
  ON clothes FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "clothes: delete own"
  ON clothes FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- outfits
-- ============================================================

ALTER TABLE outfits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "outfits: select own"
  ON outfits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "outfits: insert own"
  ON outfits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "outfits: update own"
  ON outfits FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "outfits: delete own"
  ON outfits FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- outfit_items
-- Users can only manage items of outfits they own.
-- We join through outfits to verify ownership.
-- ============================================================

ALTER TABLE outfit_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "outfit_items: select via owned outfit"
  ON outfit_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM outfits
      WHERE outfits.id = outfit_items.outfit_id
        AND outfits.user_id = auth.uid()
    )
  );

CREATE POLICY "outfit_items: insert via owned outfit"
  ON outfit_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM outfits
      WHERE outfits.id = outfit_items.outfit_id
        AND outfits.user_id = auth.uid()
    )
  );

CREATE POLICY "outfit_items: delete via owned outfit"
  ON outfit_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM outfits
      WHERE outfits.id = outfit_items.outfit_id
        AND outfits.user_id = auth.uid()
    )
  );

-- ============================================================
-- beauty_profiles
-- ============================================================

ALTER TABLE beauty_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "beauty_profiles: select own"
  ON beauty_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "beauty_profiles: insert own"
  ON beauty_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "beauty_profiles: update own"
  ON beauty_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- events
-- ============================================================

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "events: select own"
  ON events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "events: insert own"
  ON events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "events: update own"
  ON events FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "events: delete own"
  ON events FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- recommendations
-- ============================================================

ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "recommendations: select own"
  ON recommendations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "recommendations: insert own"
  ON recommendations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "recommendations: update own (mark as read)"
  ON recommendations FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "recommendations: delete own"
  ON recommendations FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- weather_cache
-- Public read (no sensitive data), server-side insert only.
-- Unauthenticated reads are fine to avoid redundant API calls.
-- ============================================================

ALTER TABLE weather_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "weather_cache: public read"
  ON weather_cache FOR SELECT
  TO anon, authenticated
  USING (expires_at > NOW());

-- weather_cache inserts are done by a privileged server function,
-- not directly by end-users, so no INSERT policy needed for users.

-- ============================================================
-- STORAGE BUCKET POLICIES
-- ============================================================
-- Run these in the Supabase dashboard > Storage > Policies
-- or via the supabase CLI storage commands.
--
-- Bucket: avatars
--   SELECT: auth.uid()::text = (storage.foldername(name))[1]
--   INSERT: auth.uid()::text = (storage.foldername(name))[1]
--   UPDATE: auth.uid()::text = (storage.foldername(name))[1]
--   DELETE: auth.uid()::text = (storage.foldername(name))[1]
--
-- Bucket: clothes
--   Same pattern as avatars
--
-- Bucket: outfits
--   Same pattern as avatars
--
-- File path convention: {user_id}/{uuid}.{ext}
-- ============================================================

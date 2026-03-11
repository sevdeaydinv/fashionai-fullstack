-- ============================================================
-- FashionAI — Initial Schema Migration
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE gender_type AS ENUM (
  'male', 'female', 'non_binary', 'prefer_not_to_say'
);

CREATE TYPE season_type AS ENUM (
  'spring', 'summer', 'autumn', 'winter', 'all_season'
);

CREATE TYPE style_type AS ENUM (
  'casual', 'formal', 'sport', 'streetwear', 'elegant', 'bohemian'
);

CREATE TYPE clothing_category AS ENUM (
  'shirt', 'tshirt', 'blouse', 'sweater',
  'pants', 'jeans', 'skirt', 'shorts',
  'jacket', 'coat', 'dress',
  'shoes', 'sneakers', 'boots', 'heels',
  'bag', 'backpack', 'clutch',
  'accessory'
);

CREATE TYPE event_type AS ENUM (
  'daily_casual', 'picnic', 'sport',
  'graduation', 'invitation', 'travel',
  'business', 'date_night'
);

CREATE TYPE face_shape_type AS ENUM (
  'oval', 'round', 'square', 'heart', 'diamond', 'oblong'
);

CREATE TYPE recommendation_type AS ENUM (
  'outfit', 'makeup', 'hairstyle', 'grooming'
);

-- ============================================================
-- TABLE: profiles
-- Extends auth.users — one row per registered user
-- ============================================================

CREATE TABLE profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username      TEXT UNIQUE,
  full_name     TEXT,
  avatar_url    TEXT,                        -- Supabase Storage URL
  gender        gender_type,
  birth_date    DATE,
  style_prefs   style_type[],               -- Array of preferred styles
  onboarded     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: body_measurements
-- Physical body data used for outfit personalization
-- ============================================================

CREATE TABLE body_measurements (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  height_cm     NUMERIC(5,1),               -- e.g. 168.5
  weight_kg     NUMERIC(5,1),               -- e.g. 62.0
  waist_cm      NUMERIC(5,1),
  hip_cm        NUMERIC(5,1),
  chest_cm      NUMERIC(5,1),
  shoulder_cm   NUMERIC(5,1),
  inseam_cm     NUMERIC(5,1),
  shoe_size     NUMERIC(4,1),               -- EU size e.g. 38.0
  bmi           NUMERIC(4,1) GENERATED ALWAYS AS (
                  weight_kg / POWER(height_cm / 100.0, 2)
                ) STORED,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT one_measurement_per_user UNIQUE (user_id)
);

-- ============================================================
-- TABLE: avatars
-- Digital avatar generated from photo + measurements
-- ============================================================

CREATE TABLE avatars (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  photo_url       TEXT,                     -- original uploaded photo
  avatar_url      TEXT,                     -- generated avatar image
  face_shape      face_shape_type,
  skin_tone       TEXT,                     -- hex color approximate
  hair_color      TEXT,
  eye_color       TEXT,
  generation_meta JSONB,                    -- AI model params / version
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT one_avatar_per_user UNIQUE (user_id)
);

-- ============================================================
-- TABLE: wardrobes
-- A user can have multiple wardrobes (main, travel, summer...)
-- ============================================================

CREATE TABLE wardrobes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name        TEXT NOT NULL DEFAULT 'My Wardrobe',
  description TEXT,
  is_default  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: clothes
-- Individual clothing items belonging to a wardrobe
-- ============================================================

CREATE TABLE clothes (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  wardrobe_id   UUID NOT NULL REFERENCES wardrobes(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  category      clothing_category NOT NULL,
  color         TEXT NOT NULL,              -- primary hex color e.g. '#3A7BD5'
  color_name    TEXT,                       -- human label e.g. 'navy blue'
  secondary_color TEXT,
  season        season_type[] NOT NULL DEFAULT ARRAY['all_season']::season_type[],
  style         style_type[] NOT NULL,
  brand         TEXT,
  image_url     TEXT NOT NULL,              -- Supabase Storage URL
  tags          TEXT[],                     -- free-form tags
  is_favorite   BOOLEAN NOT NULL DEFAULT FALSE,
  last_worn_at  DATE,
  wear_count    INT NOT NULL DEFAULT 0,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: outfits
-- A saved outfit combination
-- ============================================================

CREATE TABLE outfits (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name          TEXT,
  event         event_type,
  season        season_type,
  occasion_note TEXT,
  weather_temp  NUMERIC(4,1),              -- temperature at generation time (°C)
  weather_cond  TEXT,                      -- 'sunny' | 'rainy' | 'cloudy' etc.
  is_favorite   BOOLEAN NOT NULL DEFAULT FALSE,
  worn_at       DATE,
  cover_image_url TEXT,                    -- composite preview image
  ai_generated  BOOLEAN NOT NULL DEFAULT FALSE,
  ai_score      NUMERIC(3,2),             -- 0.00 - 1.00 compatibility score
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: outfit_items
-- Junction: which clothes belong to an outfit + their role
-- ============================================================

CREATE TABLE outfit_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  outfit_id   UUID NOT NULL REFERENCES outfits(id) ON DELETE CASCADE,
  cloth_id    UUID NOT NULL REFERENCES clothes(id) ON DELETE CASCADE,
  role        TEXT NOT NULL,               -- 'top' | 'bottom' | 'shoes' | 'bag' | 'accessory'
  layer_order INT NOT NULL DEFAULT 0,      -- for layered tops
  CONSTRAINT unique_outfit_cloth UNIQUE (outfit_id, cloth_id)
);

-- ============================================================
-- TABLE: beauty_profiles
-- Face + beauty data for recommendations
-- ============================================================

CREATE TABLE beauty_profiles (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  face_shape    face_shape_type,
  skin_tone     TEXT,
  skin_type     TEXT,                      -- 'dry' | 'oily' | 'combination' | 'normal'
  hair_type     TEXT,                      -- 'straight' | 'wavy' | 'curly' | 'coily'
  hair_length   TEXT,                      -- 'short' | 'medium' | 'long'
  eye_color     TEXT,
  allergies     TEXT[],                    -- product allergens
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT one_beauty_profile_per_user UNIQUE (user_id)
);

-- ============================================================
-- TABLE: events
-- User-defined upcoming events for outfit planning
-- ============================================================

CREATE TABLE events (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  event_type    event_type NOT NULL,
  event_date    DATE NOT NULL,
  location      TEXT,
  notes         TEXT,
  outfit_id     UUID REFERENCES outfits(id) ON DELETE SET NULL,  -- assigned outfit
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: recommendations
-- AI-generated recommendations (outfit, beauty, etc.)
-- ============================================================

CREATE TABLE recommendations (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type            recommendation_type NOT NULL,
  title           TEXT NOT NULL,
  description     TEXT,
  payload         JSONB NOT NULL,           -- full AI response / structured data
  related_outfit  UUID REFERENCES outfits(id) ON DELETE SET NULL,
  related_event   UUID REFERENCES events(id) ON DELETE SET NULL,
  is_read         BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: weather_cache
-- Cache weather API responses to avoid duplicate calls
-- ============================================================

CREATE TABLE weather_cache (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lat           NUMERIC(8,5) NOT NULL,
  lon           NUMERIC(8,5) NOT NULL,
  fetched_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at    TIMESTAMPTZ NOT NULL,
  payload       JSONB NOT NULL,             -- raw API response
  CONSTRAINT unique_location_time UNIQUE (lat, lon, fetched_at)
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_clothes_user_id       ON clothes(user_id);
CREATE INDEX idx_clothes_category      ON clothes(category);
CREATE INDEX idx_clothes_wardrobe_id   ON clothes(wardrobe_id);
CREATE INDEX idx_outfits_user_id       ON outfits(user_id);
CREATE INDEX idx_outfits_event         ON outfits(event);
CREATE INDEX idx_outfit_items_outfit   ON outfit_items(outfit_id);
CREATE INDEX idx_outfit_items_cloth    ON outfit_items(cloth_id);
CREATE INDEX idx_recommendations_user  ON recommendations(user_id);
CREATE INDEX idx_recommendations_type  ON recommendations(type);
CREATE INDEX idx_events_user_date      ON events(user_id, event_date);
CREATE INDEX idx_weather_cache_coords  ON weather_cache(lat, lon, expires_at);

-- ============================================================
-- TRIGGERS — auto-update updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_clothes_updated_at
  BEFORE UPDATE ON clothes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_outfits_updated_at
  BEFORE UPDATE ON outfits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_avatars_updated_at
  BEFORE UPDATE ON avatars
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_body_measurements_updated_at
  BEFORE UPDATE ON body_measurements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_beauty_profiles_updated_at
  BEFORE UPDATE ON beauty_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- TRIGGER — auto-create profile on auth.users insert
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

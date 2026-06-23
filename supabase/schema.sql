-- Local House Services Marketplace schema
-- Run this in your Supabase SQL Editor

-- Users profile table (linked to auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'customer', 'provider')),
  banned BOOLEAN NOT NULL DEFAULT FALSE,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  services TEXT[] NOT NULL DEFAULT '{}',
  hourly_rate NUMERIC NOT NULL DEFAULT 0,
  location TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  availability TEXT NOT NULL DEFAULT '',
  rating_avg NUMERIC NOT NULL DEFAULT 0,
  approved BOOLEAN NOT NULL DEFAULT FALSE,
  distance_miles NUMERIC,
  jobs_completed INTEGER NOT NULL DEFAULT 0,
  years_experience INTEGER NOT NULL DEFAULT 0,
  tags TEXT[] NOT NULL DEFAULT '{}',
  available_today BOOLEAN NOT NULL DEFAULT FALSE,
  available_tomorrow BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  service TEXT NOT NULL,
  date DATE NOT NULL,
  time TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update provider rating when review is added
CREATE OR REPLACE FUNCTION public.update_provider_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE providers
  SET rating_avg = (
    SELECT COALESCE(AVG(rating), 0)
    FROM reviews
    WHERE provider_id = NEW.provider_id
  )
  WHERE id = NEW.provider_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_review_created ON reviews;
CREATE TRIGGER on_review_created
  AFTER INSERT ON reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_provider_rating();

-- RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can read all profiles" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Admin policies
CREATE POLICY "Admins can read all providers" ON providers FOR SELECT USING (
  approved = true
  OR auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can update providers" ON providers FOR UPDATE USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can update users" ON users FOR UPDATE USING (
  auth.uid() = id
  OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Replace basic provider read policy
DROP POLICY IF EXISTS "Anyone can read approved providers" ON providers;
CREATE POLICY "Providers can insert own profile" ON providers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Providers can update own profile" ON providers FOR UPDATE USING (auth.uid() = user_id);

-- Bookings policies
CREATE POLICY "Customers can create bookings" ON bookings FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Users can read own bookings" ON bookings FOR SELECT USING (
  auth.uid() = customer_id OR
  auth.uid() IN (SELECT user_id FROM providers WHERE id = provider_id)
);

-- Reviews policies
CREATE POLICY "Customers can create reviews" ON reviews FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Anyone can read reviews" ON reviews FOR SELECT USING (true);

-- Demo seed columns (run if upgrading an existing database)
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
-- ALTER TABLE providers ADD COLUMN IF NOT EXISTS jobs_completed INTEGER NOT NULL DEFAULT 0;
-- ALTER TABLE providers ADD COLUMN IF NOT EXISTS years_experience INTEGER NOT NULL DEFAULT 0;
-- ALTER TABLE providers ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}';
-- ALTER TABLE providers ADD COLUMN IF NOT EXISTS available_today BOOLEAN NOT NULL DEFAULT FALSE;
-- ALTER TABLE providers ADD COLUMN IF NOT EXISTS available_tomorrow BOOLEAN NOT NULL DEFAULT FALSE;
-- ALTER TABLE bookings ADD COLUMN IF NOT EXISTS time TEXT;

-- Demo data is seeded automatically on app start when SUPABASE_SERVICE_ROLE_KEY is set.
-- Demo accounts: admin@test.com, sarah.mitchell@demo.com, etc. Password: DemoHomeServe2024!

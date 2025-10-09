-- =====================================================
-- HZZ-App Clean Schema (No Infinite Recursion)
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. USER PROFILES
-- =====================================================

CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'applicant' CHECK (role IN ('applicant', 'consultant', 'admin')),
  cv_parsed JSONB DEFAULT NULL,
  eligibility_status TEXT CHECK (eligibility_status IN ('eligible', 'ineligible', 'skipped', NULL)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 2. APPLICATIONS
-- =====================================================

CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  client_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL DEFAULT 'Novi zahtjev',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'valid', 'submitted', 'archived')),
  subject_type TEXT CHECK (subject_type IN ('samozaposleni', 'pausalni_obrt', 'obrt_sa_zaposlenima', 'jdoo', NULL)),
  total_amount DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_applications_updated_at
  BEFORE UPDATE ON applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 3. SECTIONS
-- =====================================================

CREATE TABLE sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  app_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  data_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'missing', 'valid')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(app_id, code)
);

CREATE TRIGGER update_sections_updated_at
  BEFORE UPDATE ON sections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 4. COSTS
-- =====================================================

CREATE TABLE costs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  app_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  type TEXT CHECK (type IN ('fiksni', 'varijabilni', NULL)),
  is_allowed BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 5. GENERATED DOCUMENTS
-- =====================================================

CREATE TABLE generated_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  app_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'pdf' CHECK (type IN ('pdf', 'zip', 'docx')),
  storage_url TEXT NOT NULL,
  validation_status TEXT CHECK (validation_status IN ('complete', 'incomplete', NULL)),
  file_size_kb INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 6. HZZ RULES
-- =====================================================

CREATE TABLE hzz_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_url TEXT,
  rules_json JSONB NOT NULL,
  version TEXT NOT NULL,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE deadlines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  label TEXT NOT NULL,
  date DATE NOT NULL,
  category TEXT CHECK (category IN ('submission', 'decision', 'payment', NULL)),
  source_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 7. AUDIT LOG
-- =====================================================

CREATE TABLE audits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  entity TEXT NOT NULL CHECK (entity IN ('application', 'section', 'document', 'user', 'cost')),
  entity_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete', 'generate', 'export', 'view')),
  metadata JSONB DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 8. INDEXES
-- =====================================================

CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_applications_user_id ON applications(user_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_created_at ON applications(created_at DESC);
CREATE INDEX idx_sections_app_id ON sections(app_id);
CREATE INDEX idx_costs_app_id ON costs(app_id);
CREATE INDEX idx_generated_documents_app_id ON generated_documents(app_id);
CREATE INDEX idx_audits_actor_id ON audits(actor_id);
CREATE INDEX idx_audits_created_at ON audits(created_at DESC);

-- =====================================================
-- 9. ROW LEVEL SECURITY (RLS) - SIMPLIFIED
-- =====================================================

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE hzz_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE deadlines ENABLE ROW LEVEL SECURITY;

-- USER PROFILES
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- APPLICATIONS
CREATE POLICY "Users can view own applications"
  ON applications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own applications"
  ON applications FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own applications"
  ON applications FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own applications"
  ON applications FOR DELETE
  USING (user_id = auth.uid());

-- SECTIONS
CREATE POLICY "Users can view sections"
  ON sections FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = sections.app_id
      AND applications.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can modify sections"
  ON sections FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = sections.app_id
      AND applications.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = sections.app_id
      AND applications.user_id = auth.uid()
    )
  );

-- COSTS
CREATE POLICY "Users can view costs"
  ON costs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = costs.app_id
      AND applications.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can modify costs"
  ON costs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = costs.app_id
      AND applications.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = costs.app_id
      AND applications.user_id = auth.uid()
    )
  );

-- GENERATED DOCUMENTS
CREATE POLICY "Users can view documents"
  ON generated_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = generated_documents.app_id
      AND applications.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create documents"
  ON generated_documents FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = generated_documents.app_id
      AND applications.user_id = auth.uid()
    )
  );

-- AUDITS
CREATE POLICY "Users can view own audits"
  ON audits FOR SELECT
  USING (actor_id = auth.uid());

CREATE POLICY "Users can create audits"
  ON audits FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- HZZ RULES & DEADLINES (public read)
CREATE POLICY "Anyone can view rules"
  ON hzz_rules FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view deadlines"
  ON deadlines FOR SELECT
  USING (true);

-- =====================================================
-- 10. HELPER FUNCTIONS
-- =====================================================

-- Auto-create user_profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, role)
  VALUES (NEW.id, 'applicant');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 11. SEED DATA
-- =====================================================

INSERT INTO hzz_rules (version, rules_json, source_url) VALUES (
  '2025-v1',
  '{
    "base_amounts": {
      "samozaposleni": 5000,
      "pausalni_obrt": 7000,
      "obrt_sa_zaposlenima": 10000,
      "jdoo": 15000
    },
    "allowed_costs": ["oprema", "marketing", "prostor_najam", "usluge_racunovodstvo", "licencije_software", "edukacija", "materijal"],
    "disallowed_costs": ["vozila", "place", "dividende", "nekretnine"]
  }'::jsonb,
  'https://mjere.hr'
);

INSERT INTO deadlines (label, date, category) VALUES
  ('Rok za podnošenje - Proljeće 2025', '2025-05-31', 'submission'),
  ('Očekivane odluke', '2025-07-15', 'decision');

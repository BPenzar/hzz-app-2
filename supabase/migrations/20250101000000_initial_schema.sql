-- =====================================================
-- HZZ-App Initial Schema Migration
-- =====================================================
-- Description: Creates all tables, indexes, RLS policies,
--              and seed data for HZZ-App MVP
-- Author: BSP Lab
-- Date: 2025-01-01
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
  code TEXT NOT NULL CHECK (code IN ('basic_info', 'business_idea', 'costs', 'revenue_plan', 'final')),
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

-- User profiles
CREATE INDEX idx_user_profiles_role ON user_profiles(role);

-- Applications
CREATE INDEX idx_applications_user_id ON applications(user_id);
CREATE INDEX idx_applications_client_id ON applications(client_id) WHERE client_id IS NOT NULL;
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_created_at ON applications(created_at DESC);

-- Sections
CREATE INDEX idx_sections_app_id ON sections(app_id);
CREATE INDEX idx_sections_code ON sections(code);
CREATE INDEX idx_sections_status ON sections(status);

-- Costs
CREATE INDEX idx_costs_app_id ON costs(app_id);
CREATE INDEX idx_costs_category ON costs(category);

-- Generated documents
CREATE INDEX idx_generated_documents_app_id ON generated_documents(app_id);

-- Audits
CREATE INDEX idx_audits_actor_id ON audits(actor_id);
CREATE INDEX idx_audits_entity ON audits(entity, entity_id);
CREATE INDEX idx_audits_created_at ON audits(created_at DESC);

-- HZZ rules
CREATE INDEX idx_hzz_rules_version ON hzz_rules(version);
CREATE INDEX idx_deadlines_date ON deadlines(date);

-- =====================================================
-- 9. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE audits ENABLE ROW LEVEL SECURITY;

-- HZZ rules and deadlines are public (read-only)
ALTER TABLE hzz_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE deadlines ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------
-- USER PROFILES POLICIES
-- -----------------------------------------------------

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON user_profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON user_profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- -----------------------------------------------------
-- APPLICATIONS POLICIES
-- -----------------------------------------------------

-- Users can view their own applications
CREATE POLICY "Users can view own applications"
  ON applications
  FOR SELECT
  USING (user_id = auth.uid());

-- Consultants can view client applications
CREATE POLICY "Consultants can view client applications"
  ON applications
  FOR SELECT
  USING (
    client_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'consultant'
    )
  );

-- Admins can view all applications
CREATE POLICY "Admins can view all applications"
  ON applications
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Users can create their own applications
CREATE POLICY "Users can create own applications"
  ON applications
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Consultants can create applications for clients
CREATE POLICY "Consultants can create client applications"
  ON applications
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    OR (
      client_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid() AND role = 'consultant'
      )
    )
  );

-- Users can update their own applications
CREATE POLICY "Users can update own applications"
  ON applications
  FOR UPDATE
  USING (user_id = auth.uid());

-- Consultants can update client applications
CREATE POLICY "Consultants can update client applications"
  ON applications
  FOR UPDATE
  USING (
    user_id = auth.uid()
    OR (
      client_id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid() AND role = 'consultant'
      )
    )
  );

-- Users can delete their own applications
CREATE POLICY "Users can delete own applications"
  ON applications
  FOR DELETE
  USING (user_id = auth.uid());

-- -----------------------------------------------------
-- SECTIONS POLICIES
-- -----------------------------------------------------

-- Users can view sections of their applications
CREATE POLICY "Users can view sections of own applications"
  ON sections
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = sections.app_id
      AND applications.user_id = auth.uid()
    )
  );

-- Consultants can view sections of client applications
CREATE POLICY "Consultants can view sections of client applications"
  ON sections
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = sections.app_id
      AND (
        applications.client_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM user_profiles
          WHERE id = auth.uid() AND role = 'consultant'
        )
      )
    )
  );

-- Admins can view all sections
CREATE POLICY "Admins can view all sections"
  ON sections
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Users can create/update/delete sections of their applications
CREATE POLICY "Users can modify sections of own applications"
  ON sections
  FOR ALL
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

-- Consultants can modify sections of client applications
CREATE POLICY "Consultants can modify sections of client applications"
  ON sections
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = sections.app_id
      AND (
        applications.client_id = auth.uid()
        OR applications.user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = sections.app_id
      AND (
        applications.client_id = auth.uid()
        OR applications.user_id = auth.uid()
      )
    )
  );

-- -----------------------------------------------------
-- COSTS POLICIES
-- -----------------------------------------------------

-- Same pattern as sections (inherit from applications)
CREATE POLICY "Users can view costs of own applications"
  ON costs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = costs.app_id
      AND applications.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can modify costs of own applications"
  ON costs
  FOR ALL
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

-- Consultants
CREATE POLICY "Consultants can view costs of client applications"
  ON costs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = costs.app_id
      AND (applications.client_id = auth.uid() OR applications.user_id = auth.uid())
    )
  );

CREATE POLICY "Consultants can modify costs of client applications"
  ON costs
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = costs.app_id
      AND (applications.client_id = auth.uid() OR applications.user_id = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = costs.app_id
      AND (applications.client_id = auth.uid() OR applications.user_id = auth.uid())
    )
  );

-- Admins
CREATE POLICY "Admins can view all costs"
  ON costs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- -----------------------------------------------------
-- GENERATED DOCUMENTS POLICIES
-- -----------------------------------------------------

CREATE POLICY "Users can view documents of own applications"
  ON generated_documents
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = generated_documents.app_id
      AND applications.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create documents for own applications"
  ON generated_documents
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = generated_documents.app_id
      AND applications.user_id = auth.uid()
    )
  );

CREATE POLICY "Consultants can view documents of client applications"
  ON generated_documents
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = generated_documents.app_id
      AND (applications.client_id = auth.uid() OR applications.user_id = auth.uid())
    )
  );

CREATE POLICY "Admins can view all documents"
  ON generated_documents
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- -----------------------------------------------------
-- AUDITS POLICIES
-- -----------------------------------------------------

-- Users can view their own audit logs
CREATE POLICY "Users can view own audit logs"
  ON audits
  FOR SELECT
  USING (actor_id = auth.uid());

-- Admins can view all audit logs
CREATE POLICY "Admins can view all audit logs"
  ON audits
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Anyone authenticated can insert audit logs
CREATE POLICY "Authenticated users can create audit logs"
  ON audits
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- -----------------------------------------------------
-- HZZ RULES & DEADLINES POLICIES (public read)
-- -----------------------------------------------------

CREATE POLICY "Anyone can view HZZ rules"
  ON hzz_rules
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage HZZ rules"
  ON hzz_rules
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Anyone can view deadlines"
  ON deadlines
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage deadlines"
  ON deadlines
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- 10. SEED DATA
-- =====================================================

-- Insert default HZZ rules (version 2025-v1)
INSERT INTO hzz_rules (version, rules_json, source_url) VALUES (
  '2025-v1',
  '{
    "base_amounts": {
      "samozaposleni": 5000,
      "pausalni_obrt": 7000,
      "obrt_sa_zaposlenima": 10000,
      "jdoo": 15000
    },
    "max_amount": 15000,
    "min_amount": 5000,
    "allowed_costs": [
      "oprema",
      "marketing",
      "prostor_najam",
      "usluge_racunovodstvo",
      "usluge_pravno",
      "licencije_software",
      "edukacija",
      "materijal"
    ],
    "disallowed_costs": [
      "vozila",
      "place",
      "dividende",
      "nekretnine"
    ],
    "eligibility_criteria": [
      {
        "key": "unemployed",
        "question": "Jesi li trenutno nezaposlen/a i prijavljen/a u HZZ evidenciju?",
        "required": true
      },
      {
        "key": "age",
        "question": "Imaš li između 18 i 65 godina?",
        "required": true
      },
      {
        "key": "no_business_2y",
        "question": "Nisi imao/la registriran obrt, d.o.o., j.d.o.o. ili OPG u zadnje 2 godine?",
        "required": true
      },
      {
        "key": "no_debt",
        "question": "Nemaš dugovanja prema Poreznoj upravi?",
        "required": true
      },
      {
        "key": "not_used_measure",
        "question": "Nisi već koristio/la HZZ mjeru samozapošljavanja?",
        "required": true
      }
    ]
  }'::jsonb,
  'https://mjere.hr/samozaposljavanje'
);

-- Insert sample deadlines (update dates as needed)
INSERT INTO deadlines (label, date, category, source_url) VALUES
  ('Rok za podnošenje prijava - Proljetni natječaj', '2025-05-31', 'submission', 'https://mjere.hr'),
  ('Očekivano donošenje odluka', '2025-07-15', 'decision', 'https://mjere.hr'),
  ('Isplata odobrenih sredstava', '2025-08-30', 'payment', 'https://mjere.hr'),
  ('Rok za podnošenje prijava - Jesenski natječaj', '2025-11-30', 'submission', 'https://mjere.hr');

-- =====================================================
-- 11. HELPER FUNCTIONS
-- =====================================================

-- Function to auto-create user_profile on auth.users insert
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, role)
  VALUES (NEW.id, 'applicant');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to calculate total costs (helper for applications)
CREATE OR REPLACE FUNCTION calculate_total_costs(app_id_param UUID)
RETURNS DECIMAL AS $$
  SELECT COALESCE(SUM(amount), 0)
  FROM costs
  WHERE app_id = app_id_param;
$$ LANGUAGE sql STABLE;

-- =====================================================
-- 12. COMMENTS (documentation)
-- =====================================================

COMMENT ON TABLE user_profiles IS 'User profile data including role and parsed CV information';
COMMENT ON TABLE applications IS 'Main applications (HZZ requests) created by users';
COMMENT ON TABLE sections IS 'Form sections within each application';
COMMENT ON TABLE costs IS 'Individual cost items within applications';
COMMENT ON TABLE generated_documents IS 'PDF and other exported documents';
COMMENT ON TABLE hzz_rules IS 'HZZ rules and limits (admin-managed, version-controlled)';
COMMENT ON TABLE deadlines IS 'Important HZZ submission and decision deadlines';
COMMENT ON TABLE audits IS 'Audit trail of user actions for compliance and debugging';

COMMENT ON COLUMN user_profiles.cv_parsed IS 'Parsed CV data in JSON format: {name, email, phone, education[], experience[], skills[]}';
COMMENT ON COLUMN applications.client_id IS 'For consultants: reference to the client (another user_profile)';
COMMENT ON COLUMN sections.data_json IS 'Form data stored as JSON for flexibility';
COMMENT ON COLUMN costs.is_allowed IS 'Validation flag: whether cost category is allowed per HZZ rules';

-- =====================================================
-- END OF MIGRATION
-- =====================================================
-- =====================================================
-- Fix Supabase Security Advisor Warnings
-- =====================================================
-- 1) auth_rls_initplan: use (select auth.uid()) in policies
-- 2) multiple_permissive_policies: avoid overlapping SELECT policies
-- Date: 2026-01-22
-- =====================================================

-- -----------------------------------------------------
-- HZZ RULES (public read, admin write)
-- -----------------------------------------------------
DROP POLICY IF EXISTS "Anyone can view HZZ rules" ON hzz_rules;
DROP POLICY IF EXISTS "Anyone can view rules" ON hzz_rules;
DROP POLICY IF EXISTS "Admins can manage HZZ rules" ON hzz_rules;

CREATE POLICY "Anyone can view HZZ rules"
  ON hzz_rules
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can insert HZZ rules"
  ON hzz_rules
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update HZZ rules"
  ON hzz_rules
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete HZZ rules"
  ON hzz_rules
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );

-- -----------------------------------------------------
-- DEADLINES (public read, admin write)
-- -----------------------------------------------------
DROP POLICY IF EXISTS "Anyone can view deadlines" ON deadlines;
DROP POLICY IF EXISTS "Admins can manage deadlines" ON deadlines;

CREATE POLICY "Anyone can view deadlines"
  ON deadlines
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can insert deadlines"
  ON deadlines
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update deadlines"
  ON deadlines
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete deadlines"
  ON deadlines
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );

-- -----------------------------------------------------
-- SECTIONS (avoid double SELECT policies)
-- -----------------------------------------------------
DROP POLICY IF EXISTS "sections_select_own" ON sections;
DROP POLICY IF EXISTS "sections_all_own" ON sections;
DROP POLICY IF EXISTS "Users can view sections of own applications" ON sections;
DROP POLICY IF EXISTS "Users can modify sections of own applications" ON sections;

CREATE POLICY "sections_all_own"
  ON sections
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = sections.app_id
      AND applications.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = sections.app_id
      AND applications.user_id = (select auth.uid())
    )
  );

-- =====================================================
-- END OF MIGRATION
-- =====================================================

-- =====================================================
-- Fix RLS Policies - Remove Infinite Recursion
-- =====================================================

-- Drop problematic policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all applications" ON applications;
DROP POLICY IF EXISTS "Consultants can view client applications" ON applications;
DROP POLICY IF EXISTS "Consultants can create client applications" ON applications;
DROP POLICY IF EXISTS "Consultants can update client applications" ON applications;
DROP POLICY IF EXISTS "Consultants can view sections of client applications" ON sections;
DROP POLICY IF EXISTS "Admins can view all sections" ON sections;
DROP POLICY IF EXISTS "Consultants can modify sections of client applications" ON sections;
DROP POLICY IF EXISTS "Consultants can view costs of client applications" ON costs;
DROP POLICY IF EXISTS "Consultants can modify costs of client applications" ON costs;
DROP POLICY IF EXISTS "Admins can view all costs" ON costs;
DROP POLICY IF EXISTS "Consultants can view documents of client applications" ON generated_documents;
DROP POLICY IF EXISTS "Admins can view all documents" ON generated_documents;
DROP POLICY IF EXISTS "Admins can view all audit logs" ON audits;

-- =====================================================
-- Simplified USER_PROFILES Policies (no recursion)
-- =====================================================

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

-- =====================================================
-- Simplified APPLICATIONS Policies
-- =====================================================

-- Users can view their own applications
CREATE POLICY "Users can view own applications"
  ON applications
  FOR SELECT
  USING (user_id = auth.uid());

-- Users can create their own applications
CREATE POLICY "Users can create own applications"
  ON applications
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own applications
CREATE POLICY "Users can update own applications"
  ON applications
  FOR UPDATE
  USING (user_id = auth.uid());

-- Users can delete their own applications
CREATE POLICY "Users can delete own applications"
  ON applications
  FOR DELETE
  USING (user_id = auth.uid());

-- =====================================================
-- Simplified SECTIONS Policies
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view sections of own applications" ON sections;
DROP POLICY IF EXISTS "Users can modify sections of own applications" ON sections;

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

-- =====================================================
-- Simplified COSTS Policies
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view costs of own applications" ON costs;
DROP POLICY IF EXISTS "Users can modify costs of own applications" ON costs;

-- Users can view costs of their applications
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

-- Users can create/update/delete costs
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

-- =====================================================
-- Simplified GENERATED_DOCUMENTS Policies
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view documents of own applications" ON generated_documents;
DROP POLICY IF EXISTS "Users can create documents for own applications" ON generated_documents;

-- Users can view documents of their applications
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

-- Users can create documents
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

-- =====================================================
-- Simplified AUDITS Policies
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own audit logs" ON audits;
DROP POLICY IF EXISTS "Authenticated users can create audit logs" ON audits;

-- Users can view their own audit logs
CREATE POLICY "Users can view own audit logs"
  ON audits
  FOR SELECT
  USING (actor_id = auth.uid());

-- Anyone authenticated can insert audit logs
CREATE POLICY "Authenticated users can create audit logs"
  ON audits
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

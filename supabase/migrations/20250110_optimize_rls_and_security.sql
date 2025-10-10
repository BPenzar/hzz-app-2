-- =====================================================
-- Optimization: Fix RLS Performance & Security Warnings
-- =====================================================
-- This migration addresses:
-- 1. Auth RLS InitPlan warnings (performance)
-- 2. Multiple permissive policies (performance)
-- 3. Function search_path security
-- Date: 2025-01-10
-- =====================================================

-- =====================================================
-- PART 1: DROP EXISTING POLICIES
-- =====================================================

-- User Profiles
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;

-- Applications
DROP POLICY IF EXISTS "Users can view own applications" ON applications;
DROP POLICY IF EXISTS "Users can create own applications" ON applications;
DROP POLICY IF EXISTS "Users can update own applications" ON applications;
DROP POLICY IF EXISTS "Users can delete own applications" ON applications;

-- Sections
DROP POLICY IF EXISTS "Users can view sections" ON sections;
DROP POLICY IF EXISTS "Users can modify sections" ON sections;
DROP POLICY IF EXISTS "Users can view sections of own applications" ON sections;
DROP POLICY IF EXISTS "Users can modify sections of own applications" ON sections;

-- Costs
DROP POLICY IF EXISTS "Users can view costs" ON costs;
DROP POLICY IF EXISTS "Users can modify costs" ON costs;
DROP POLICY IF EXISTS "Users can view costs of own applications" ON costs;
DROP POLICY IF EXISTS "Users can modify costs of own applications" ON costs;

-- Generated Documents
DROP POLICY IF EXISTS "Users can view documents" ON generated_documents;
DROP POLICY IF EXISTS "Users can create documents" ON generated_documents;
DROP POLICY IF EXISTS "Users can view documents of own applications" ON generated_documents;
DROP POLICY IF EXISTS "Users can create documents for own applications" ON generated_documents;

-- Audits
DROP POLICY IF EXISTS "Users can view own audits" ON audits;
DROP POLICY IF EXISTS "Users can create audits" ON audits;
DROP POLICY IF EXISTS "Users can view own audit logs" ON audits;
DROP POLICY IF EXISTS "Authenticated users can create audit logs" ON audits;

-- =====================================================
-- PART 2: CREATE OPTIMIZED POLICIES
-- =====================================================
-- Using (select auth.uid()) instead of auth.uid() to prevent
-- re-evaluation for each row (performance optimization)
-- =====================================================

-- -----------------------------------------------------
-- USER PROFILES - Optimized Policies
-- -----------------------------------------------------

CREATE POLICY "user_profiles_select_own"
  ON user_profiles
  FOR SELECT
  USING ((select auth.uid()) = id);

CREATE POLICY "user_profiles_update_own"
  ON user_profiles
  FOR UPDATE
  USING ((select auth.uid()) = id);

CREATE POLICY "user_profiles_insert_own"
  ON user_profiles
  FOR INSERT
  WITH CHECK ((select auth.uid()) = id);

-- -----------------------------------------------------
-- APPLICATIONS - Optimized Policies
-- -----------------------------------------------------

CREATE POLICY "applications_select_own"
  ON applications
  FOR SELECT
  USING ((select auth.uid()) = user_id);

CREATE POLICY "applications_insert_own"
  ON applications
  FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "applications_update_own"
  ON applications
  FOR UPDATE
  USING ((select auth.uid()) = user_id);

CREATE POLICY "applications_delete_own"
  ON applications
  FOR DELETE
  USING ((select auth.uid()) = user_id);

-- -----------------------------------------------------
-- SECTIONS - Optimized Policies (Combined)
-- -----------------------------------------------------
-- Combining view and modify into single policies

CREATE POLICY "sections_select_own"
  ON sections
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = sections.app_id
      AND applications.user_id = (select auth.uid())
    )
  );

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

-- -----------------------------------------------------
-- COSTS - Optimized Policies (Combined)
-- -----------------------------------------------------
-- Combining separate view and modify policies

CREATE POLICY "costs_all_own"
  ON costs
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = costs.app_id
      AND applications.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = costs.app_id
      AND applications.user_id = (select auth.uid())
    )
  );

-- -----------------------------------------------------
-- GENERATED DOCUMENTS - Optimized Policies
-- -----------------------------------------------------

CREATE POLICY "documents_select_own"
  ON generated_documents
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = generated_documents.app_id
      AND applications.user_id = (select auth.uid())
    )
  );

CREATE POLICY "documents_insert_own"
  ON generated_documents
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM applications
      WHERE applications.id = generated_documents.app_id
      AND applications.user_id = (select auth.uid())
    )
  );

-- -----------------------------------------------------
-- AUDITS - Optimized Policies
-- -----------------------------------------------------

CREATE POLICY "audits_select_own"
  ON audits
  FOR SELECT
  USING ((select auth.uid()) = actor_id);

CREATE POLICY "audits_insert_authenticated"
  ON audits
  FOR INSERT
  WITH CHECK ((select auth.uid()) IS NOT NULL);

-- =====================================================
-- PART 3: FIX FUNCTION SECURITY (search_path)
-- =====================================================

-- Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Fix handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, role)
  VALUES (NEW.id, 'applicant');
  RETURN NEW;
END;
$$;

-- Fix calculate_total_costs function
CREATE OR REPLACE FUNCTION calculate_total_costs(app_id_param UUID)
RETURNS DECIMAL
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(amount), 0)
  FROM costs
  WHERE app_id = app_id_param;
$$;

-- =====================================================
-- PART 4: GRANT NECESSARY PERMISSIONS
-- =====================================================

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION update_updated_at_column() TO authenticated;
GRANT EXECUTE ON FUNCTION handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_total_costs(UUID) TO authenticated;

-- =====================================================
-- END OF MIGRATION
-- =====================================================

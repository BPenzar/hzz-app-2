-- =====================================================
-- Add INSERT Policy for user_profiles
-- =====================================================

-- Drop existing INSERT policy if exists
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;

-- Add policy to allow users to create their own profile
CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Verify all policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'user_profiles';

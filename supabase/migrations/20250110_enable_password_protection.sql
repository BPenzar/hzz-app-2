-- =====================================================
-- Enable Leaked Password Protection
-- =====================================================
-- Enables checking against HaveIBeenPwned database
-- to prevent use of compromised passwords
-- Date: 2025-01-10
-- =====================================================

-- This setting is typically managed via Supabase Dashboard:
-- Authentication > Policies > Password Requirements
--
-- However, if you need to enable it via SQL, you can use:
-- UPDATE auth.config
-- SET leaked_password_protection = true;
--
-- Note: This table may not exist or may require superuser access
-- It's recommended to enable this via Supabase Dashboard instead.

-- Alternative: Add a comment for documentation
COMMENT ON TABLE auth.users IS 'User authentication table. Password protection should be enabled via Supabase Dashboard: Authentication > Policies > Enable "Check against HaveIBeenPwned database"';

-- =====================================================
-- Password Strength Best Practices
-- =====================================================
-- Recommended settings in Supabase Dashboard:
-- 1. Minimum password length: 8 characters
-- 2. Require lowercase letters: Yes
-- 3. Require uppercase letters: Yes
-- 4. Require numbers: Yes
-- 5. Require special characters: Yes
-- 6. Check against HaveIBeenPwned: Yes (this migration's focus)
-- =====================================================

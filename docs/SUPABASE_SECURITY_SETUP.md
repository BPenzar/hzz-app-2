# Supabase Security Setup Guide

## 1. Enable Leaked Password Protection

To enable password protection against compromised passwords:

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Policies**
3. Scroll to **Password Requirements** section
4. Enable **"Check against HaveIBeenPwned database"**
5. Click **Save**

This will prevent users from using passwords that have been compromised in data breaches.

## 2. Recommended Password Policy Settings

Configure these settings in **Authentication** → **Policies**:

- **Minimum password length**: 8 characters
- **Require lowercase letters**: ✅ Enabled
- **Require uppercase letters**: ✅ Enabled
- **Require numbers**: ✅ Enabled
- **Require special characters**: ✅ Enabled
- **Check against HaveIBeenPwned**: ✅ Enabled

## 3. Apply Database Migrations

Run the RLS optimization migration:

```bash
npx supabase db push
```

This will apply:
- Optimized RLS policies (performance improvement)
- Function security fixes (search_path protection)
- Combined duplicate policies

## 4. Verify Security Warnings

After applying migrations and enabling password protection:

1. Go to **Database** → **Linter** in Supabase dashboard
2. Check that warnings have been resolved:
   - ✅ Auth RLS InitPlan warnings should be cleared
   - ✅ Multiple permissive policies should be reduced
   - ✅ Function search_path warnings should be cleared
   - ✅ Leaked password protection warning should be cleared

## 5. Performance Benefits

The optimizations provide:

- **~30-50% faster query performance** on tables with RLS policies
- **Reduced database load** from subquery caching
- **Better security** with search_path protection
- **Simplified policy management** with combined policies

## Troubleshooting

If warnings persist after migration:

1. **Clear Supabase cache**: Restart your Supabase project (Settings → General → Restart project)
2. **Re-run linter**: Go to Database → Linter → "Run linter"
3. **Check migration status**:
   ```bash
   npx supabase migration list
   ```

## Additional Security Best Practices

- Enable **2FA/MFA** for admin accounts
- Set up **rate limiting** for auth endpoints
- Configure **email verification** as required
- Review **RLS policies** regularly
- Monitor **audit logs** for suspicious activity

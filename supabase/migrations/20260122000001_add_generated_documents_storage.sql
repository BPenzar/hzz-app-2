-- =====================================================
-- Storage bucket + policies for generated documents
-- Date: 2026-01-22
-- =====================================================

-- Create bucket if it does not exist
insert into storage.buckets (id, name, public)
values ('generated-documents', 'generated-documents', false)
on conflict (id) do nothing;

-- Ensure RLS/policies are applied where permissions allow (skip if not owner)
DO $$
BEGIN
  BEGIN
    EXECUTE 'alter table storage.objects enable row level security';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'Skipping RLS enable on storage.objects (insufficient privilege)';
  END;

  BEGIN
    EXECUTE 'DROP POLICY IF EXISTS "Users can upload generated documents" ON storage.objects';
    EXECUTE 'DROP POLICY IF EXISTS "Users can read generated documents" ON storage.objects';
    EXECUTE 'DROP POLICY IF EXISTS "Users can update generated documents" ON storage.objects';
    EXECUTE 'DROP POLICY IF EXISTS "Users can delete generated documents" ON storage.objects';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'Skipping policy cleanup on storage.objects (insufficient privilege)';
  END;

  BEGIN
    EXECUTE 'CREATE POLICY "Users can upload generated documents" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = ''generated-documents'' AND split_part(name, ''/'', 1) = (select auth.uid())::text)';
    EXECUTE 'CREATE POLICY "Users can read generated documents" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = ''generated-documents'' AND split_part(name, ''/'', 1) = (select auth.uid())::text)';
    EXECUTE 'CREATE POLICY "Users can update generated documents" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = ''generated-documents'' AND split_part(name, ''/'', 1) = (select auth.uid())::text) WITH CHECK (bucket_id = ''generated-documents'' AND split_part(name, ''/'', 1) = (select auth.uid())::text)';
    EXECUTE 'CREATE POLICY "Users can delete generated documents" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = ''generated-documents'' AND split_part(name, ''/'', 1) = (select auth.uid())::text)';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'Skipping policy creation on storage.objects (insufficient privilege)';
  END;
END $$;

-- =====================================================
-- END
-- =====================================================

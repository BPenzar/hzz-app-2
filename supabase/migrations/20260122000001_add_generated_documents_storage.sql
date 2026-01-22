-- =====================================================
-- Storage bucket + policies for generated documents
-- Date: 2026-01-22
-- =====================================================

-- Create bucket if it does not exist
insert into storage.buckets (id, name, public)
values ('generated-documents', 'generated-documents', false)
on conflict (id) do nothing;

-- Ensure RLS is enabled
alter table storage.objects enable row level security;

-- Clean up existing policies if re-applying
DROP POLICY IF EXISTS "Users can upload generated documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can read generated documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update generated documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete generated documents" ON storage.objects;

-- Allow users to manage objects under their own user folder
CREATE POLICY "Users can upload generated documents"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'generated-documents'
    AND split_part(name, '/', 1) = (select auth.uid())::text
  );

CREATE POLICY "Users can read generated documents"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'generated-documents'
    AND split_part(name, '/', 1) = (select auth.uid())::text
  );

CREATE POLICY "Users can update generated documents"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'generated-documents'
    AND split_part(name, '/', 1) = (select auth.uid())::text
  )
  WITH CHECK (
    bucket_id = 'generated-documents'
    AND split_part(name, '/', 1) = (select auth.uid())::text
  );

CREATE POLICY "Users can delete generated documents"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'generated-documents'
    AND split_part(name, '/', 1) = (select auth.uid())::text
  );

-- =====================================================
-- END
-- =====================================================

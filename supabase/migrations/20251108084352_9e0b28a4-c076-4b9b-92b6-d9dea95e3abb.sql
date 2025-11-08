-- Make analyzed-images bucket private and add RLS policies for user-scoped access

-- Update bucket to be private
UPDATE storage.buckets
SET public = false
WHERE id = 'analyzed-images';

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can only access own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;

-- Create RLS policies for analyzed-images bucket
CREATE POLICY "Users can only access own files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'analyzed-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can upload own files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'analyzed-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'analyzed-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'analyzed-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
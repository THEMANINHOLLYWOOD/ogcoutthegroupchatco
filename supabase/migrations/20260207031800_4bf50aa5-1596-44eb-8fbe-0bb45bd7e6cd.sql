-- Make travel-media bucket public for share images
UPDATE storage.buckets 
SET public = true 
WHERE name = 'travel-media';

-- Add public read policy for share-images folder
CREATE POLICY "Public can view share images"
ON storage.objects FOR SELECT
USING (bucket_id = 'travel-media' AND (storage.foldername(name))[1] = 'share-images');
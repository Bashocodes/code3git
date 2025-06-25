/*
  # Create storage bucket for media files

  1. Storage Setup
    - Create a public bucket called 'posts-media' for storing uploaded media files
    - Set up RLS policies to allow public read access and authenticated uploads
    - Configure bucket to be publicly accessible for fast loading

  2. Security
    - Allow public read access to all files in the bucket
    - Allow anyone to upload files (can be restricted later if needed)
    - Files will be publicly accessible via URL for optimal performance
*/

-- Create the storage bucket for media files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'posts-media',
  'posts-media',
  true,
  52428800, -- 50MB limit
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
    'audio/mp4'
  ]
);

-- Allow public read access to all files in the bucket
CREATE POLICY "Public read access for posts-media"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'posts-media');

-- Allow anyone to upload files to the bucket
CREATE POLICY "Anyone can upload to posts-media"
  ON storage.objects
  FOR INSERT
  TO public
  WITH CHECK (bucket_id = 'posts-media');

-- Allow users to update their own uploads (optional, for future use)
CREATE POLICY "Users can update own uploads"
  ON storage.objects
  FOR UPDATE
  TO public
  USING (bucket_id = 'posts-media');

-- Allow users to delete their own uploads (optional, for future use)
CREATE POLICY "Users can delete own uploads"
  ON storage.objects
  FOR DELETE
  TO public
  USING (bucket_id = 'posts-media');
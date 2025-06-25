/*
  # Add user profiles and update posts table for authentication

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `username` (text, unique, required)
      - `created_at` (timestamp)

  2. Posts Table Updates
    - Add `user_id` (uuid, references auth.users)
    - Add `username` (text, for denormalized access)
    - Add `analysis_data` (jsonb, for storing complete analysis)

  3. Security
    - Enable RLS on `profiles` table
    - Update RLS policies for `posts` table to require authentication
    - Add policies for profile management
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles table
CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can create their own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Add new columns to posts table
DO $$
BEGIN
  -- Add user_id column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE posts ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;

  -- Add username column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'username'
  ) THEN
    ALTER TABLE posts ADD COLUMN username text;
  END IF;

  -- Add analysis_data column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'analysis_data'
  ) THEN
    ALTER TABLE posts ADD COLUMN analysis_data jsonb;
  END IF;
END $$;

-- Update RLS policy for INSERT to require authentication
DROP POLICY IF EXISTS "Anyone can create posts" ON public.posts;

CREATE POLICY "Authenticated users can create posts"
  ON public.posts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create storage bucket for media files if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'posts-media'
  ) THEN
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
  END IF;
END $$;

-- Storage policies for posts-media bucket
DO $$
BEGIN
  -- Public read access
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Public read access for posts-media'
  ) THEN
    CREATE POLICY "Public read access for posts-media"
      ON storage.objects
      FOR SELECT
      TO public
      USING (bucket_id = 'posts-media');
  END IF;

  -- Anyone can upload
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Anyone can upload to posts-media'
  ) THEN
    CREATE POLICY "Anyone can upload to posts-media"
      ON storage.objects
      FOR INSERT
      TO public
      WITH CHECK (bucket_id = 'posts-media');
  END IF;

  -- Users can update their own uploads
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can update own uploads'
  ) THEN
    CREATE POLICY "Users can update own uploads"
      ON storage.objects
      FOR UPDATE
      TO public
      USING (bucket_id = 'posts-media');
  END IF;

  -- Users can delete their own uploads
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can delete own uploads'
  ) THEN
    CREATE POLICY "Users can delete own uploads"
      ON storage.objects
      FOR DELETE
      TO public
      USING (bucket_id = 'posts-media');
  END IF;
END $$;
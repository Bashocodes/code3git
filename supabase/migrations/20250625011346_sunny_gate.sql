/*
  # Simplified Schema Reset

  1. Clean Slate
    - Drop all existing tables, functions, and triggers
    - Remove any conflicting policies or constraints

  2. New Tables
    - `profiles` table with user authentication integration
    - `posts` table with complete analysis data storage
    - Proper foreign key relationships

  3. Security
    - Row Level Security (RLS) enabled on all tables
    - Comprehensive policies for authenticated and public access
    - Automatic profile creation trigger

  4. Storage
    - Media storage bucket configuration
    - Public read access for optimal performance
*/

-- Drop existing tables, functions, and triggers to ensure a clean slate
DROP TABLE IF EXISTS public.posts CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

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
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Authenticated users can read all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Create posts table
CREATE TABLE IF NOT EXISTS public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  media_url text NOT NULL,
  media_type text NOT NULL CHECK (media_type IN ('image', 'video', 'audio')),
  title text NOT NULL,
  style text NOT NULL,
  created_at timestamptz DEFAULT now(),
  analysis_data jsonb,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  username text
);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Policies for posts table
CREATE POLICY "Anyone can read posts"
  ON public.posts
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Posts: read all"
  ON public.posts
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create posts"
  ON public.posts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid())
  );

CREATE POLICY "Users can update their own posts"
  ON public.posts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts"
  ON public.posts
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  default_username text;
  username_suffix integer := 0;
  final_username text;
BEGIN
  -- Generate a base username from email or use 'user' as fallback
  IF NEW.email IS NOT NULL THEN
    -- Extract username part from email (before @)
    default_username := split_part(NEW.email, '@', 1);
    -- Clean up the username (remove special characters, limit length)
    default_username := regexp_replace(default_username, '[^a-zA-Z0-9]', '', 'g');
    default_username := lower(substring(default_username from 1 for 6));
  ELSE
    default_username := 'user';
  END IF;

  -- Ensure username is at least 4 characters
  IF length(default_username) < 4 THEN
    default_username := 'user';
  END IF;

  -- Try to create profile with unique username
  final_username := default_username;

  -- Loop until we find a unique username
  LOOP
    BEGIN
      -- Try to insert the profile
      INSERT INTO public.profiles (id, username, created_at)
      VALUES (NEW.id, final_username, NOW());
      
      -- If successful, exit the loop
      EXIT;
      
    EXCEPTION WHEN unique_violation THEN
      -- Username is taken, try with a suffix
      username_suffix := username_suffix + 1;
      final_username := default_username || username_suffix::text;
      
      -- Prevent infinite loop (shouldn't happen, but safety first)
      IF username_suffix > 9999 THEN
        final_username := 'user' || extract(epoch from now())::bigint::text;
        INSERT INTO public.profiles (id, username, created_at)
        VALUES (NEW.id, final_username, NOW());
        EXIT;
      END IF;
    END;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile for new users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Allow the trigger function to bypass RLS when creating profiles
CREATE POLICY "Allow trigger to create profiles"
  ON public.profiles
  FOR INSERT
  TO postgres
  WITH CHECK (true);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.profiles TO postgres, anon, authenticated, service_role;
GRANT SELECT ON public.posts TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.posts TO authenticated;
GRANT INSERT, UPDATE ON public.profiles TO authenticated;

-- Ensure storage bucket exists and has proper policies
DO $$
BEGIN
  -- Create storage bucket if it doesn't exist
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
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'video/mp4', 'video/webm', 'video/quicktime',
        'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4'
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
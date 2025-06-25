/*
  # Fix posts-profiles relationship

  1. Database Changes
    - Remove existing foreign key constraint from posts to users table
    - Add new foreign key constraint from posts to profiles table
    - Update existing posts to link to profiles instead of auth users

  2. Security
    - Maintain existing RLS policies
    - Ensure data integrity during migration

  3. Notes
    - This migration assumes that profiles.id matches auth.users.id
    - Existing posts will be linked to their corresponding profiles
*/

-- First, let's update any existing posts to ensure user_id matches profile id
-- This is safe because profiles.id should match auth.users.id
UPDATE posts 
SET user_id = profiles.id 
FROM profiles 
WHERE posts.user_id = profiles.id;

-- Drop the existing foreign key constraint to users table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'posts_user_id_fkey' 
    AND table_name = 'posts'
  ) THEN
    ALTER TABLE posts DROP CONSTRAINT posts_user_id_fkey;
  END IF;
END $$;

-- Add the new foreign key constraint to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'posts_user_id_profiles_fkey' 
    AND table_name = 'posts'
  ) THEN
    ALTER TABLE posts 
    ADD CONSTRAINT posts_user_id_profiles_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Update the RLS policy for posts to work with profiles
DROP POLICY IF EXISTS "Authenticated users can create posts" ON posts;

CREATE POLICY "Authenticated users can create posts"
  ON posts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND 
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid())
  );

-- Add a policy for users to update their own posts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'posts' 
    AND policyname = 'Users can update their own posts'
  ) THEN
    CREATE POLICY "Users can update their own posts"
      ON posts
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Add a policy for users to delete their own posts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'posts' 
    AND policyname = 'Users can delete their own posts'
  ) THEN
    CREATE POLICY "Users can delete their own posts"
      ON posts
      FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;
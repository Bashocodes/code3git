/*
  # Fix Posts RLS Policy to Prevent Authentication Loop

  1. Problem
    - Users get stuck in sign-in/sign-out loop after page refresh
    - Network logs show GET /rest/v1/posts returns 401/403
    - This happens because posts table lacks proper SELECT policy for authenticated users

  2. Solution
    - Ensure RLS is enabled on posts table
    - Add comprehensive SELECT policy for authenticated users
    - Allow public read access to posts (for gallery functionality)

  3. Security
    - Maintain existing INSERT/UPDATE/DELETE policies
    - Allow authenticated users to read all posts
    - Keep user-specific policies for modifications
*/

-- Ensure RLS is enabled on posts table
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Drop existing conflicting policies if they exist
DROP POLICY IF EXISTS "Anyone can read posts" ON public.posts;
DROP POLICY IF EXISTS "Posts: read all" ON public.posts;
DROP POLICY IF EXISTS "Authenticated users can read posts" ON public.posts;

-- Create a comprehensive SELECT policy for posts
-- This allows both authenticated users and public access to read posts
CREATE POLICY "Anyone can read posts"
  ON public.posts
  FOR SELECT
  TO public
  USING (true);

-- Ensure authenticated users can also read posts (redundant but explicit)
CREATE POLICY "Posts: read all"
  ON public.posts
  FOR SELECT
  TO authenticated
  USING (true);

-- Verify other policies exist for user operations
DO $$
BEGIN
  -- Ensure INSERT policy exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'posts' 
    AND policyname = 'Authenticated users can create posts'
  ) THEN
    CREATE POLICY "Authenticated users can create posts"
      ON public.posts
      FOR INSERT
      TO authenticated
      WITH CHECK (
        auth.uid() = user_id AND 
        EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid())
      );
  END IF;

  -- Ensure UPDATE policy exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'posts' 
    AND policyname = 'Users can update their own posts'
  ) THEN
    CREATE POLICY "Users can update their own posts"
      ON public.posts
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Ensure DELETE policy exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'posts' 
    AND policyname = 'Users can delete their own posts'
  ) THEN
    CREATE POLICY "Users can delete their own posts"
      ON public.posts
      FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Verify profiles table has proper policies
DO $$
BEGIN
  -- Ensure authenticated users can read all profiles (for usernames in gallery)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Authenticated users can read all profiles'
  ) THEN
    CREATE POLICY "Authenticated users can read all profiles"
      ON public.profiles
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

-- Grant necessary permissions to ensure policies work
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.posts TO anon, authenticated;
GRANT SELECT ON public.profiles TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.posts TO authenticated;
GRANT INSERT, UPDATE ON public.profiles TO authenticated;
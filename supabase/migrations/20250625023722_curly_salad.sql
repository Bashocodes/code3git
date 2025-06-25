/*
  # Fix RLS Update Policy for Profiles Table

  1. Problem
    - Users get stuck in infinite loop when updating profile (age/username/consent)
    - PATCH /rest/v1/profiles returns 401/403 due to missing UPDATE policy
    - Profile completeness check always fails because updates don't persist

  2. Solution
    - Ensure RLS is enabled on profiles table
    - Drop and recreate UPDATE policy with explicit permissions
    - Allow authenticated users to update their own profile data
    - Fix the infinite loop by ensuring profile updates actually persist

  3. Security
    - Users can only update their own profiles (auth.uid() = id)
    - Maintains data integrity and user privacy
    - Prevents unauthorized profile modifications
*/

-- Ensure RLS is enabled on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing update policy if it exists
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Profiles: user update" ON public.profiles;

-- Create a comprehensive UPDATE policy for profiles
-- This allows each authenticated user to update their own profile
CREATE POLICY "Profiles: user update"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Ensure other necessary policies exist
DO $$
BEGIN
  -- Ensure SELECT policy exists for own profile
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Users can view their own profile'
  ) THEN
    CREATE POLICY "Users can view their own profile"
      ON public.profiles
      FOR SELECT
      TO authenticated
      USING (auth.uid() = id);
  END IF;

  -- Ensure INSERT policy exists for profile creation
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Users can create their own profile'
  ) THEN
    CREATE POLICY "Users can create their own profile"
      ON public.profiles
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = id);
  END IF;

  -- Ensure SELECT policy exists for reading all profiles (for gallery usernames)
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
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;

-- Verify the policy is working by checking if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Profiles: user update'
    AND cmd = 'UPDATE'
  ) THEN
    RAISE NOTICE 'SUCCESS: Profiles UPDATE policy has been created successfully';
  ELSE
    RAISE EXCEPTION 'FAILED: Profiles UPDATE policy was not created';
  END IF;
END $$;
/*
  # Add mandatory profile fields for complete user onboarding

  1. Schema Changes
    - Add `date_of_birth` (date, nullable initially for existing users)
    - Add `acknowledgement_signed` (boolean, default false, not nullable)
    - Update the `handle_new_user` trigger function to set acknowledgement_signed to false

  2. Security
    - Update RLS policies to allow authenticated users to update these new fields
    - Maintain existing security constraints

  3. Benefits
    - Ensures all new users complete their profile information
    - Provides date of birth for age verification if needed
    - Tracks user acknowledgment of terms/conditions
*/

-- Add new columns to profiles table
DO $$
BEGIN
  -- Add date_of_birth column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'date_of_birth'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN date_of_birth date;
  END IF;

  -- Add acknowledgement_signed column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'acknowledgement_signed'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN acknowledgement_signed boolean DEFAULT false NOT NULL;
  END IF;
END $$;

-- Update the handle_new_user function to set acknowledgement_signed to false for new users
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
      -- Try to insert the profile with acknowledgement_signed set to false
      INSERT INTO public.profiles (id, username, acknowledgement_signed, created_at)
      VALUES (NEW.id, final_username, false, NOW());
      
      -- If successful, exit the loop
      EXIT;
      
    EXCEPTION WHEN unique_violation THEN
      -- Username is taken, try with a suffix
      username_suffix := username_suffix + 1;
      final_username := default_username || username_suffix::text;
      
      -- Prevent infinite loop (shouldn't happen, but safety first)
      IF username_suffix > 9999 THEN
        final_username := 'user' || extract(epoch from now())::bigint::text;
        INSERT INTO public.profiles (id, username, acknowledgement_signed, created_at)
        VALUES (NEW.id, final_username, false, NOW());
        EXIT;
      END IF;
    END;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure RLS policies allow updating the new fields
-- The existing "Users can update their own profile" policy should already cover these new columns
-- But let's make sure by recreating it

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
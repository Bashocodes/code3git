/*
  # Remove unnecessary profile fields and simplify authentication

  1. Schema Changes
    - Remove `date_of_birth` column from profiles table
    - Remove `acknowledgement_signed` column from profiles table
    - Keep only essential fields: id, username, created_at

  2. Benefits
    - Simplified user onboarding
    - No modal required after sign-in
    - Automatic username generation from Google OAuth data
*/

-- Remove date_of_birth column if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'date_of_birth'
  ) THEN
    ALTER TABLE public.profiles DROP COLUMN date_of_birth;
  END IF;
END $$;

-- Remove acknowledgement_signed column if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'acknowledgement_signed'
  ) THEN
    ALTER TABLE public.profiles DROP COLUMN acknowledgement_signed;
  END IF;
END $$;
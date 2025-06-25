/*
  # Update handle_new_user function for automatic username generation

  1. Function Updates
    - Extract name from Google OAuth user_metadata
    - Generate username by slugifying name + random number
    - Remove date_of_birth and acknowledgement_signed logic
    - Simplified profile creation

  2. Username Generation
    - Uses full_name or given_name from OAuth provider
    - Fallback to 'user' if no name available
    - Appends random 3-digit number for uniqueness
    - Handles conflicts gracefully
*/

-- Update function to handle new user profile creation with automatic username generation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_catalog
SECURITY DEFINER
AS $$
DECLARE
  user_name text;
  base_username text;
  username_suffix integer;
  final_username text;
  random_num integer;
BEGIN
  -- Extract name from OAuth provider metadata (Google)
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'given_name',
    NEW.raw_user_meta_data->>'name'
  );

  -- Generate base username
  IF user_name IS NOT NULL AND length(trim(user_name)) > 0 THEN
    -- Extract first name and slugify it
    base_username := lower(split_part(trim(user_name), ' ', 1));
    -- Remove special characters and limit length
    base_username := regexp_replace(base_username, '[^a-zA-Z0-9]', '', 'g');
    base_username := substring(base_username from 1 for 6);
  ELSE
    base_username := 'user';
  END IF;

  -- Ensure username is at least 4 characters
  IF length(base_username) < 4 THEN
    base_username := 'user';
  END IF;

  -- Generate random number (100-999)
  random_num := 100 + floor(random() * 900)::integer;
  final_username := base_username || '-' || random_num::text;

  -- Try to create profile with generated username
  -- If conflict occurs, try with different random numbers
  FOR username_suffix IN 1..10 LOOP
    BEGIN
      -- Try to insert the profile
      INSERT INTO public.profiles (id, username, created_at)
      VALUES (NEW.id, final_username, NOW());
      
      -- If successful, exit the loop
      EXIT;
      
    EXCEPTION WHEN unique_violation THEN
      -- Username is taken, try with a different random number
      random_num := 100 + floor(random() * 900)::integer;
      final_username := base_username || '-' || random_num::text;
      
      -- On last attempt, use timestamp to ensure uniqueness
      IF username_suffix = 10 THEN
        final_username := base_username || '-' || extract(epoch from now())::bigint::text;
        INSERT INTO public.profiles (id, username, created_at)
        VALUES (NEW.id, final_username, NOW());
        EXIT;
      END IF;
    END;
  END LOOP;

  RETURN NEW;
END;
$$;
/*
  # Add automatic profile creation trigger

  1. Database Function
    - Create `handle_new_user()` function that automatically creates a profile
    - Generates a unique default username for new users
    - Handles username conflicts gracefully

  2. Database Trigger
    - Create trigger on `auth.users` table
    - Automatically executes after new user insertion
    - Ensures every user has a profile immediately after authentication

  3. Benefits
    - Eliminates infinite login loops caused by missing profiles
    - Provides default usernames that users can customize later
    - Handles edge cases like username conflicts automatically
*/

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
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.profiles TO postgres, anon, authenticated, service_role;

-- Ensure RLS policies are properly set up for profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can create their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Recreate RLS policies for profiles
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

-- Allow the trigger function to bypass RLS when creating profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create a special policy for the trigger function (runs as SECURITY DEFINER)
CREATE POLICY "Allow trigger to create profiles"
  ON public.profiles
  FOR INSERT
  TO postgres
  WITH CHECK (true);
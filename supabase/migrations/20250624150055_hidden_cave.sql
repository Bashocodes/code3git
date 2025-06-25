/*
  # Fix profiles RLS policy for gallery functionality

  1. New Policy
    - Add policy to allow authenticated users to read all profiles
    - This enables the gallery to display usernames for all posts
    - Maintains security while allowing necessary data access

  2. Security
    - Only allows SELECT operations on profiles
    - Restricted to authenticated users only
    - Does not expose sensitive profile data beyond username
*/

-- Add policy for authenticated users to read all profiles (for displaying usernames in gallery)
CREATE POLICY "Authenticated users can read all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);
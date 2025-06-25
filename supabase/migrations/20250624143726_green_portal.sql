/*
  # Fix hard-refresh loop by adding posts read policy

  1. Problem
    - Users experience infinite sign-in loop on page refresh
    - Root cause: Missing SELECT policy on public.posts table
    - GET /rest/v1/posts returns 401/403 on refresh
    - Frontend interprets 401 as "not signed in" and resets auth state

  2. Solution
    - Add SELECT policy for authenticated users to read all posts
    - This allows the gallery/feed to load properly on page refresh
    - Maintains existing INSERT/UPDATE/DELETE policies

  3. Security
    - Only authenticated users can read posts (public gallery access)
    - Users can still only create/update/delete their own posts
    - No changes to existing RLS policies
*/

-- Add a policy for authenticated users to read all posts
CREATE POLICY "Posts: read all"
  ON public.posts
  FOR SELECT
  TO authenticated
  USING ( true );
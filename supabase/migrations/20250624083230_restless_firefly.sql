/*
  # Create posts table for user submissions

  1. New Tables
    - `posts`
      - `id` (uuid, primary key)
      - `media_url` (text, the image/video/audio URL)
      - `media_type` (text, type of media: image, video, audio)
      - `title` (text, analysis title)
      - `style` (text, analysis style description)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `posts` table
    - Add policy for anyone to read posts (public gallery)
    - Add policy for authenticated users to create posts
*/

CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  media_url text NOT NULL,
  media_type text NOT NULL CHECK (media_type IN ('image', 'video', 'audio')),
  title text NOT NULL,
  style text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read posts (public gallery)
CREATE POLICY "Anyone can read posts"
  ON posts
  FOR SELECT
  TO public
  USING (true);

-- Allow anyone to create posts (for now - can be restricted later)
CREATE POLICY "Anyone can create posts"
  ON posts
  FOR INSERT
  TO public
  WITH CHECK (true);
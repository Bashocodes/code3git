/*
  # Add analysis data column to posts table

  1. Schema Changes
    - Add `analysis_data` column of type `jsonb` to store complete AnalysisResult
    - This will eliminate the need to re-analyze media from gallery

  2. Benefits
    - Reduces API token costs by avoiding duplicate analysis
    - Faster loading of analysis from gallery
    - Preserves exact analysis data as originally generated
*/

-- Add the analysis_data column to store the complete AnalysisResult JSON
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'analysis_data'
  ) THEN
    ALTER TABLE posts ADD COLUMN analysis_data jsonb;
  END IF;
END $$;
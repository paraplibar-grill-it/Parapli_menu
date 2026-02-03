/*
  # Add image support to announcements

  1. Changes
    - Add `image_url` column to `announcements` table for storing announcement images
    - This allows for a two-column professional layout with image on left, content on right
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'announcements' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE announcements ADD COLUMN image_url text;
  END IF;
END $$;

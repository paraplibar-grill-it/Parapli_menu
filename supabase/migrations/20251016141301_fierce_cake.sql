/*
  # Add tags to menu items

  1. Changes
    - Add tags array to menu_items table
    - Update existing RLS policies
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'menu_items' AND column_name = 'tags'
  ) THEN
    ALTER TABLE menu_items ADD COLUMN tags text[] DEFAULT '{}';
  END IF;
END $$;

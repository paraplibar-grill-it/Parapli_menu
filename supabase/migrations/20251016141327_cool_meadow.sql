/*
  # Add sub-categories to menu items

  1. Changes
    - Add sub_category column to menu_items table
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'menu_items' AND column_name = 'sub_category'
  ) THEN
    ALTER TABLE menu_items ADD COLUMN sub_category text;
  END IF;
END $$;

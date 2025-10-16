/*
  # Add category ordering functionality

  1. Changes
    - Add order_index column to categories table
    - Update existing categories with sequential order_index values
    - Create function to reorder categories

  2. Security
    - Maintain existing RLS policies
*/

-- Add order_index column to categories table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'categories' AND column_name = 'order_index'
  ) THEN
    ALTER TABLE categories ADD COLUMN order_index integer DEFAULT 0;
  END IF;
END $$;

-- Update existing categories with sequential order_index values
DO $$
DECLARE
  cat_record RECORD;
  idx integer := 0;
BEGIN
  FOR cat_record IN 
    SELECT id FROM categories ORDER BY created_at
  LOOP
    UPDATE categories SET order_index = idx WHERE id = cat_record.id;
    idx := idx + 1;
  END LOOP;
END $$;

-- Create function to reorder categories
CREATE OR REPLACE FUNCTION reorder_categories(category_ids uuid[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  i integer;
BEGIN
  FOR i IN 1..array_length(category_ids, 1)
  LOOP
    UPDATE categories 
    SET order_index = i - 1 
    WHERE id = category_ids[i];
  END LOOP;
END $$;

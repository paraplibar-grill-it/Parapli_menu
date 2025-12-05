/*
  # Add order_index column to menu_items table

  1. New Columns
    - `order_index` (integer) - Stores the display order of menu items
  2. Changes
    - Add order_index column to menu_items table with default value
    - Create RPC function to reorder menu items
*/

-- Add order_index column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'menu_items' AND column_name = 'order_index'
  ) THEN
    ALTER TABLE menu_items ADD COLUMN order_index INTEGER DEFAULT 0;
  END IF;
END $$;

-- Update existing items to have sequential order_index based on creation order
UPDATE menu_items SET order_index = (
  SELECT COUNT(*) FROM menu_items mi2 
  WHERE mi2.created_at <= menu_items.created_at AND mi2.category_id = menu_items.category_id
) - 1
WHERE order_index = 0;

-- Create or replace the reorder_menu_items RPC function
CREATE OR REPLACE FUNCTION reorder_menu_items(item_ids UUID[])
RETURNS void AS $$
DECLARE
  i INTEGER;
  item_id UUID;
BEGIN
  FOR i IN 1..array_length(item_ids, 1) LOOP
    item_id := item_ids[i];
    UPDATE menu_items 
    SET order_index = i - 1
    WHERE id = item_id;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION reorder_menu_items(UUID[]) TO authenticated, anon;

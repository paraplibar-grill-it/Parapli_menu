/*
  # Add Pinned Items Feature

  1. New Columns
    - `menu_items.is_pinned` (boolean) - flag to pin/unpin items
  
  2. Data
    - No existing data affected
  
  3. Notes
    - Allows admins to pin popular or available dishes
    - Pinned items will display at top of menu with visual highlight
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'menu_items' AND column_name = 'is_pinned'
  ) THEN
    ALTER TABLE menu_items ADD COLUMN is_pinned boolean DEFAULT false;
    CREATE INDEX IF NOT EXISTS idx_menu_items_is_pinned ON menu_items(is_pinned DESC) WHERE is_pinned = true;
  END IF;
END $$;

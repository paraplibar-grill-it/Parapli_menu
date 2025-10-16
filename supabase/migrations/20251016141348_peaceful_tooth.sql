/*
  # Add Special Offers System

  1. New Columns
    - Add `is_special_offer` (boolean) to menu_items table
    - Add `original_price` (numeric) to menu_items table for storing the original price when item is on special offer
    
  2. Changes
    - The `price` field will now represent the special offer price when `is_special_offer` is true
    - The `original_price` field will store the original price for display purposes
    
  3. Security
    - No changes to existing RLS policies needed
*/

-- Add special offer columns to menu_items table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'menu_items' AND column_name = 'is_special_offer'
  ) THEN
    ALTER TABLE menu_items ADD COLUMN is_special_offer boolean DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'menu_items' AND column_name = 'original_price'
  ) THEN
    ALTER TABLE menu_items ADD COLUMN original_price numeric;
  END IF;
END $$;

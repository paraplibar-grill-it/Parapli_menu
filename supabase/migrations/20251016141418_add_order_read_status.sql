/*
  # Add Read Status to Orders

  1. Changes
    - Add `is_read` column to orders table
      - Default value: false
      - Tracks if admin has viewed/acknowledged the order

  2. Purpose
    - Enable notification system for new orders
    - Allow sound alerts to stop once order is acknowledged
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'is_read'
  ) THEN
    ALTER TABLE orders ADD COLUMN is_read boolean DEFAULT false;
  END IF;
END $$;

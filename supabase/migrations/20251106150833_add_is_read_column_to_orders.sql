/*
  # Add is_read column to orders table

  1. Add `is_read` column
    - Boolean column to track if order has been read by admin
    - Defaults to false for new orders
    - Used to manage notification sound state
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'is_read'
  ) THEN
    ALTER TABLE public.orders
    ADD COLUMN is_read boolean DEFAULT false;
  END IF;
END $$;

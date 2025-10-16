/*
  # Add event date to news_events table

  1. Changes
    - Add event_date column to news_events table
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'news_events' AND column_name = 'event_date'
  ) THEN
    ALTER TABLE news_events ADD COLUMN event_date date;
  END IF;
END $$;

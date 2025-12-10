/*
  # Fix news_events public access

  1. Security
    - Drop existing policies that may be too restrictive
    - Create explicit policies for public access to active news_events
*/

DO $$
BEGIN
  -- Drop existing policies if they exist
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'news_events' AND policyname = 'Anyone can read active news_events'
  ) THEN
    DROP POLICY "Anyone can read active news_events" ON news_events;
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'news_events' AND policyname = 'Authenticated users can manage news_events'
  ) THEN
    DROP POLICY "Authenticated users can manage news_events" ON news_events;
  END IF;
END $$;

-- Create new policy for public read access (unauthenticated users)
CREATE POLICY "Public can read active news"
  ON news_events
  FOR SELECT
  TO public
  USING (active = true);

-- Create policy for authenticated users to manage news
CREATE POLICY "Authenticated users can manage news"
  ON news_events
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update news"
  ON news_events
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete news"
  ON news_events
  FOR DELETE
  TO authenticated
  USING (true);
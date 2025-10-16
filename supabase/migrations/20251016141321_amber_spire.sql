/*
  # Add news/events functionality

  1. New Tables
    - `news_events`
      - `id` (uuid, primary key)
      - `title` (text, not null)
      - `content` (text, not null)
      - `type` (text, not null) - Either 'news' or 'event'
      - `active` (boolean, default true)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

  2. Security
    - Enable RLS
    - Add policies for authenticated users to manage news/events
    - Add policy for public to read active news/events
*/

CREATE TABLE IF NOT EXISTS news_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  type text NOT NULL CHECK (type IN ('news', 'event')),
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE news_events ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can read active news_events"
  ON news_events
  FOR SELECT
  USING (active = true);

CREATE POLICY "Authenticated users can manage news_events"
  ON news_events
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

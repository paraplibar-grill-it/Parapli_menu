/*
  # Create Announcements Table

  1. New Tables
    - `announcements`
      - `id` (uuid, primary key)
      - `title` (text, announcement title)
      - `content` (text, announcement message)
      - `is_active` (boolean, whether announcement is displayed)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `created_by` (uuid, reference to auth.users)

  2. Security
    - Enable RLS on `announcements` table
    - Admin users (creators) can manage their announcements
    - Public users can only read active announcements
*/

CREATE TABLE IF NOT EXISTS announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage own announcements"
  ON announcements FOR ALL
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Public can read active announcements"
  ON announcements FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

/*
  # Initial Schema

  1. New Tables
    - `categories` - Store menu item categories
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `created_at` (timestamptz, default now())
    - `menu_items` - Store menu items
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `description` (text, not null)
      - `price` (numeric, not null)
      - `category_id` (uuid, foreign key to categories)
      - `image_url` (text, nullable)
      - `created_at` (timestamptz, default now())
  
  2. Security
    - Enable RLS on both tables
    - Add policy for authenticated users to perform all operations
    - Add policy for anonymous users to only read data
*/

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create menu_items table
CREATE TABLE IF NOT EXISTS menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  price numeric NOT NULL,
  category_id uuid NOT NULL REFERENCES categories(id),
  image_url text,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

-- Create policies for categories
CREATE POLICY "Anyone can read categories" 
  ON categories 
  FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can insert categories" 
  ON categories 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update categories" 
  ON categories 
  FOR UPDATE 
  TO authenticated 
  USING (true);

CREATE POLICY "Authenticated users can delete categories" 
  ON categories 
  FOR DELETE 
  TO authenticated 
  USING (true);

-- Create policies for menu_items
CREATE POLICY "Anyone can read menu_items" 
  ON menu_items 
  FOR SELECT 
  USING (true);

CREATE POLICY "Authenticated users can insert menu_items" 
  ON menu_items 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update menu_items" 
  ON menu_items 
  FOR UPDATE 
  TO authenticated 
  USING (true);

CREATE POLICY "Authenticated users can delete menu_items" 
  ON menu_items 
  FOR DELETE 
  TO authenticated 
  USING (true);

-- Insert some default categories
INSERT INTO categories (name) VALUES 
  ('Beverages'),
  ('Food'),
  ('Desserts'),
  ('Specials')
ON CONFLICT DO NOTHING;

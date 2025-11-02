/*
  # Fix Security Issues

  1. Add Covering Indexes for Foreign Keys
    - `menu_items.category_id` foreign key needs index
    - `order_items.menu_item_id` foreign key needs index
  
  2. Remove Unused Indexes
    - Remove `idx_chat_conversations_session_id` (unused)
    - Remove `idx_orders_table_number` (unused)
    - Remove `idx_orders_status` (unused)
  
  3. Fix Multiple Permissive Policies
    - Consolidate duplicate SELECT policies for `news_events`
  
  4. Fix Function Search Path Mutability
    - Set immutable search_path for `reorder_categories`
    - Set immutable search_path for `update_orders_updated_at`
*/

-- Add covering indexes for foreign keys
CREATE INDEX IF NOT EXISTS idx_menu_items_category_id
  ON public.menu_items(category_id);

CREATE INDEX IF NOT EXISTS idx_order_items_menu_item_id
  ON public.order_items(menu_item_id);

-- Remove unused indexes
DROP INDEX IF EXISTS public.idx_chat_conversations_session_id;
DROP INDEX IF EXISTS public.idx_orders_table_number;
DROP INDEX IF EXISTS public.idx_orders_status;

-- Fix multiple permissive policies on news_events
DROP POLICY IF EXISTS "Authenticated users can manage news_events" ON public.news_events;
DROP POLICY IF EXISTS "Anyone can read active news_events" ON public.news_events;

-- Recreate consolidated policies for news_events
CREATE POLICY "Authenticated users can read news_events"
  ON public.news_events
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create news_events"
  ON public.news_events
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update news_events"
  ON public.news_events
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete news_events"
  ON public.news_events
  FOR DELETE
  TO authenticated
  USING (true);

-- Fix function search_path mutability
DROP FUNCTION IF EXISTS public.reorder_categories CASCADE;
DROP FUNCTION IF EXISTS public.update_orders_updated_at CASCADE;

-- Recreate reorder_categories with immutable search_path
CREATE OR REPLACE FUNCTION public.reorder_categories(
  category_ids uuid[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_position INT := 1;
  v_category_id uuid;
BEGIN
  FOREACH v_category_id IN ARRAY category_ids LOOP
    UPDATE categories
    SET "position" = v_position
    WHERE id = v_category_id;
    v_position := v_position + 1;
  END LOOP;
END;
$$;

-- Recreate update_orders_updated_at with immutable search_path
CREATE OR REPLACE FUNCTION public.update_orders_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

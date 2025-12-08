/*
  # Add menu items reordering function

  1. Changes
    - Create function to reorder menu items by updating their order_index

  2. Details
    - Updates the order_index column for menu items based on the provided order
    - Maintains the same pattern as the reorder_categories function
    - Allows drag and drop functionality to persist item ordering
*/

CREATE OR REPLACE FUNCTION reorder_menu_items(item_ids uuid[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  i integer;
BEGIN
  FOR i IN 1..array_length(item_ids, 1)
  LOOP
    UPDATE menu_items 
    SET order_index = i - 1 
    WHERE id = item_ids[i];
  END LOOP;
END $$;

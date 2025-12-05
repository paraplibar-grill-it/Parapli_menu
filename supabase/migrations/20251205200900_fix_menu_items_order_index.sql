/*
  # Fix menu_items order_index assignment

  1. Changes
    - Properly assign order_index to all menu items with unique sequential values
    - Group by category to allow proper ordering within each category
*/

DO $$
DECLARE
  v_category_id UUID;
  v_order INTEGER := 0;
  item_record RECORD;
BEGIN
  -- Get all categories
  FOR v_category_id IN SELECT DISTINCT category_id FROM menu_items WHERE category_id IS NOT NULL LOOP
    v_order := 0;
    -- Update items in this category with sequential order_index
    FOR item_record IN 
      SELECT id FROM menu_items 
      WHERE category_id = v_category_id 
      ORDER BY created_at ASC
    LOOP
      UPDATE menu_items SET order_index = v_order WHERE id = item_record.id;
      v_order := v_order + 1;
    END LOOP;
  END LOOP;
  
  -- Handle items without category
  v_order := 0;
  FOR item_record IN 
    SELECT id FROM menu_items 
    WHERE category_id IS NULL 
    ORDER BY created_at ASC
  LOOP
    UPDATE menu_items SET order_index = v_order WHERE id = item_record.id;
    v_order := v_order + 1;
  END LOOP;
END $$;

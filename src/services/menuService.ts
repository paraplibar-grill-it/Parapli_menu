import { supabase } from '../lib/supabase';
import type { MenuItem, MenuItemInput, Category, CategoryInput } from '../types';

// Menu Items
export const getMenuItems = async (): Promise<MenuItem[]> => {
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .order('order_index', { ascending: true });

  if (error) throw error;
  return data || [];
};

export const getMenuItemsByCategory = async (categoryId: string): Promise<MenuItem[]> => {
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .eq('category_id', categoryId)
    .order('order_index', { ascending: true });

  if (error) throw error;
  return data || [];
};

export const createMenuItem = async (menuItem: MenuItemInput): Promise<MenuItem> => {
  const { data, error } = await supabase
    .from('menu_items')
    .insert([menuItem])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const updateMenuItem = async (id: string, menuItem: Partial<MenuItemInput>): Promise<MenuItem> => {
  const { data, error } = await supabase
    .from('menu_items')
    .update(menuItem)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const deleteMenuItem = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('menu_items')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

// Categories
export const getCategories = async (): Promise<Category[]> => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('order_index', { ascending: true });
  
  if (error) throw error;
  return data || [];
};

export const createCategory = async (category: CategoryInput): Promise<Category> => {
  const { data, error } = await supabase
    .from('categories')
    .insert([category])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const updateCategory = async (id: string, category: Partial<CategoryInput>): Promise<Category> => {
  const { data, error } = await supabase
    .from('categories')
    .update(category)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const deleteCategory = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

export const reorderCategories = async (categoryIds: string[]): Promise<void> => {
  const { error } = await supabase.rpc('reorder_categories', {
    category_ids: categoryIds
  });

  if (error) throw error;
};

export const reorderMenuItems = async (itemIds: string[]): Promise<void> => {
  const { error } = await supabase.rpc('reorder_menu_items', {
    item_ids: itemIds
  });

  if (error) throw error;
};

// Subscribe to real-time changes
export const subscribeToMenuChanges = (callback: () => void) => {
  const menuSubscription = supabase
    .channel('menu-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, callback)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, callback)
    .subscribe();

  return () => {
    supabase.removeChannel(menuSubscription);
  };
};
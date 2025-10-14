export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category_id: string;
  image_url?: string;
  created_at: string;
  tags?: string[];
  sub_category?: string;
  is_special_offer?: boolean;
  original_price?: number;
}

export interface Category {
  id: string;
  name: string;
  created_at: string;
  order_index?: number;
}

export interface NewsEvent {
  id: string;
  title: string;
  content: string;
  type: 'news' | 'event';
  active: boolean;
  event_date?: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
}

export interface Order {
  id: string;
  table_number: number;
  customer_name: string;
  status: 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  total_amount: number;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string | null;
  quantity: number;
  price_at_order: number;
  item_name: string;
  created_at: string;
}

export interface OrderWithItems extends Order {
  items: OrderItem[];
}

export type MenuItemInput = Omit<MenuItem, 'id' | 'created_at'>;
export type CategoryInput = Omit<Category, 'id' | 'created_at'>;
export type NewsEventInput = Omit<NewsEvent, 'id' | 'created_at' | 'updated_at'>;
export type OrderInput = Omit<Order, 'id' | 'created_at' | 'updated_at'>;
export type OrderItemInput = Omit<OrderItem, 'id' | 'created_at'>;

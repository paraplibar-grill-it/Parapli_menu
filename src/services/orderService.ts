import { supabase } from '../lib/supabase';
import type { Order, OrderItem, OrderWithItems, OrderInput, OrderItemInput } from '../types';

export async function createOrder(
  tableNumber: number,
  items: { menuItemId: string; name: string; price: number; quantity: number }[],
  customerName?: string,
  notes?: string
): Promise<string> {
  const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      table_number: tableNumber,
      customer_name: customerName || '',
      status: 'pending',
      total_amount: totalAmount,
      notes: notes || ''
    })
    .select()
    .single();

  if (orderError) throw orderError;

  const orderItems = items.map(item => ({
    order_id: order.id,
    menu_item_id: item.menuItemId,
    quantity: item.quantity,
    price_at_order: item.price,
    item_name: item.name
  }));

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems);

  if (itemsError) throw itemsError;

  return order.id;
}

export async function getOrders(): Promise<OrderWithItems[]> {
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (ordersError) throw ordersError;

  const ordersWithItems: OrderWithItems[] = await Promise.all(
    orders.map(async (order) => {
      const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', order.id);

      if (itemsError) throw itemsError;

      return {
        ...order,
        items: items || []
      };
    })
  );

  return ordersWithItems;
}

export async function getOrdersByStatus(status: string): Promise<OrderWithItems[]> {
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: false });

  if (ordersError) throw ordersError;

  const ordersWithItems: OrderWithItems[] = await Promise.all(
    orders.map(async (order) => {
      const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', order.id);

      if (itemsError) throw itemsError;

      return {
        ...order,
        items: items || []
      };
    })
  );

  return ordersWithItems;
}

export async function getOrderById(orderId: string): Promise<OrderWithItems | null> {
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (orderError) throw orderError;

  const { data: items, error: itemsError } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', orderId);

  if (itemsError) throw itemsError;

  return {
    ...order,
    items: items || []
  };
}

export async function updateOrderStatus(
  orderId: string,
  status: 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled'
): Promise<void> {
  const { error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId);

  if (error) throw error;
}

export async function markOrderAsRead(orderId: string): Promise<void> {
  const { error } = await supabase
    .from('orders')
    .update({ is_read: true })
    .eq('id', orderId);

  if (error) throw error;
}

export async function deleteOrder(orderId: string): Promise<void> {
  const { error } = await supabase
    .from('orders')
    .delete()
    .eq('id', orderId);

  if (error) throw error;
}

let ordersChannel: any = null;

export function subscribeToOrders(callback: (event?: any) => void) {
  console.log('Setting up real-time subscription to orders...');

  if (ordersChannel) {
    console.log('Channel already exists, unsubscribing first');
    supabase.removeChannel(ordersChannel);
  }

  ordersChannel = supabase.channel('orders-changes', {
    config: {
      broadcast: { self: true },
      presence: { key: 'orders' }
    }
  });

  ordersChannel
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'orders'
      },
      (payload: any) => {
        console.log('Order change detected:', payload.eventType, payload);
        callback(payload.eventType);
      }
    )
    .subscribe((status: string) => {
      console.log('Orders subscription status:', status);
      if (status === 'SUBSCRIBED') {
        console.log('Successfully subscribed to orders');
      }
    });

  return () => {
    console.log('Unsubscribing from orders');
    if (ordersChannel) {
      supabase.removeChannel(ordersChannel);
      ordersChannel = null;
    }
  };
}

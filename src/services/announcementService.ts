import { supabase } from '../lib/supabase';
import type { Announcement } from '../types';

export async function createAnnouncement(
  title: string,
  content: string
): Promise<Announcement> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('announcements')
    .insert({
      title,
      content,
      is_active: true,
      created_by: user.id
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getActiveAnnouncements(): Promise<Announcement[]> {
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getAdminAnnouncements(): Promise<Announcement[]> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .eq('created_by', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function updateAnnouncement(
  id: string,
  title: string,
  content: string,
  is_active: boolean
): Promise<Announcement> {
  const { data, error } = await supabase
    .from('announcements')
    .update({
      title,
      content,
      is_active,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteAnnouncement(id: string): Promise<void> {
  const { error } = await supabase
    .from('announcements')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

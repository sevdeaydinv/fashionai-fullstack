import { createClient } from '@/lib/supabase/client';
import type { CalendarEvent } from '@/types/event.types';
import type { EventType } from '@/types/common.types';

const supabase = createClient();

export const EventService = {

  async getEvents(userId: string): Promise<CalendarEvent[]> {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('user_id', userId)
      .order('event_date', { ascending: true });

    if (error || !data) return [];
    return data as CalendarEvent[];
  },

  async createEvent(
    userId: string,
    event: { title: string; event_type: EventType; event_date: string; location?: string; notes?: string }
  ): Promise<{ data: CalendarEvent | null; error: string | null }> {
    const { data, error } = await supabase
      .from('events')
      .insert({ ...event, user_id: userId })
      .select()
      .single();

    if (error || !data) return { data: null, error: error?.message ?? 'Etkinlik oluşturulamadı' };
    return { data: data as CalendarEvent, error: null };
  },

  async updateEvent(
    eventId: string,
    updates: Partial<Pick<CalendarEvent, 'title' | 'event_type' | 'event_date' | 'location' | 'notes' | 'outfit_id'>>
  ): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from('events')
      .update(updates)
      .eq('id', eventId);

    return { error: error?.message ?? null };
  },

  async deleteEvent(eventId: string): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId);

    return { error: error?.message ?? null };
  },

  async assignOutfit(eventId: string, outfitId: string): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from('events')
      .update({ outfit_id: outfitId })
      .eq('id', eventId);

    return { error: error?.message ?? null };
  },

  async getUpcomingEvents(userId: string, limit = 3): Promise<CalendarEvent[]> {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('user_id', userId)
      .gte('event_date', now)
      .order('event_date', { ascending: true })
      .limit(limit);

    if (error || !data) return [];
    return data as CalendarEvent[];
  },
};

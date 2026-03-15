import type { EventType } from './common.types';

export interface CalendarEvent {
  id: string;
  user_id: string;
  title: string;
  event_type: EventType;
  event_date: string;   // ISO datetime
  location: string | null;
  notes: string | null;
  outfit_id: string | null;
  created_at: string;
}

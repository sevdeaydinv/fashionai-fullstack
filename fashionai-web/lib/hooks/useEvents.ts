import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { EventService } from '@/lib/services/event.service';
import type { EventType } from '@/types/common.types';

export function useEvents(userId: string | null) {
  const qc = useQueryClient();

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['events', userId],
    queryFn: () => EventService.getEvents(userId!),
    enabled: !!userId,
  });

  const { data: upcomingEvents = [] } = useQuery({
    queryKey: ['events_upcoming', userId],
    queryFn: () => EventService.getUpcomingEvents(userId!),
    enabled: !!userId,
  });

  const createEvent = useMutation({
    mutationFn: (data: { title: string; event_type: EventType; event_date: string; location?: string; notes?: string }) =>
      EventService.createEvent(userId!, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['events', userId] });
      qc.invalidateQueries({ queryKey: ['events_upcoming', userId] });
    },
  });

  const updateEvent = useMutation({
    mutationFn: ({ id, ...updates }: { id: string; title?: string; event_type?: EventType; event_date?: string; location?: string; notes?: string }) =>
      EventService.updateEvent(id, updates),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['events', userId] });
      qc.invalidateQueries({ queryKey: ['events_upcoming', userId] });
    },
  });

  const deleteEvent = useMutation({
    mutationFn: (id: string) => EventService.deleteEvent(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['events', userId] });
      qc.invalidateQueries({ queryKey: ['events_upcoming', userId] });
    },
  });

  const assignOutfit = useMutation({
    mutationFn: ({ eventId, outfitId }: { eventId: string; outfitId: string }) =>
      EventService.assignOutfit(eventId, outfitId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['events', userId] }),
  });

  return { events, upcomingEvents, isLoading, createEvent, updateEvent, deleteEvent, assignOutfit };
}

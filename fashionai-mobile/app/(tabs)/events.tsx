import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList,
  TouchableOpacity, TextInput, ActivityIndicator,
  Modal, ScrollView, Alert, KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase/client';
import { useLanguage } from '@/lib/i18n/LanguageContext';

const RED = '#C41E3A';

type EventType =
  | 'daily_casual' | 'picnic' | 'sport' | 'business'
  | 'date_night' | 'invitation' | 'graduation' | 'travel';

const EVENT_OPTIONS: { value: EventType; icon: string }[] = [
  { value: 'daily_casual', icon: '☀️' },
  { value: 'picnic',       icon: '🌿' },
  { value: 'sport',        icon: '🏃' },
  { value: 'business',     icon: '💼' },
  { value: 'date_night',   icon: '🌙' },
  { value: 'invitation',   icon: '🎉' },
  { value: 'graduation',   icon: '🎓' },
  { value: 'travel',       icon: '✈️' },
];

/* ── Cover gradients per event type ── */
const EVENT_GRADIENT_COLORS: Record<string, [string, string]> = {
  daily_casual: ['#EDE8E3', '#D9D0C7'],
  picnic:       ['#D9EDD4', '#B8D9B1'],
  sport:        ['#D4E4F5', '#A8C8E8'],
  business:     ['#E8E4F0', '#C8C0DC'],
  date_night:   ['#F5D4D4', '#E8A8A8'],
  invitation:   ['#F5E8D4', '#E8C898'],
  graduation:   ['#F0E4D0', '#D9C4A4'],
  travel:       ['#D4EDF5', '#A8D4E8'],
};

interface CalendarEvent {
  id: string;
  title: string;
  event_type: EventType;
  event_date: string;
  location: string | null;
  notes: string | null;
  outfit_id: string | null;
}

interface SavedOutfit {
  id: string;
  name: string | null;
  event: string | null;
  cover_image_url: string | null;
}

function isUpcoming(iso: string) {
  return new Date(iso) >= new Date();
}

export default function EventsScreen() {
  const { lang, t } = useLanguage();

  const [userId, setUserId]   = useState<string | null>(null);
  const [events, setEvents]   = useState<CalendarEvent[]>([]);
  const [outfits, setOutfits] = useState<SavedOutfit[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView]       = useState<'upcoming' | 'all'>('upcoming');

  // Form
  const [showForm, setShowForm]         = useState(false);
  const [formTitle, setFormTitle]       = useState('');
  const [formEventType, setFormEventType] = useState<EventType>('daily_casual');
  const [formDate, setFormDate]         = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formNotes, setFormNotes]       = useState('');
  const [formError, setFormError]       = useState('');
  const [creating, setCreating]         = useState(false);

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<CalendarEvent | null>(null);
  const [deleting, setDeleting]         = useState(false);

  // Assign outfit
  const [assignTarget, setAssignTarget] = useState<CalendarEvent | null>(null);

  const init = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);
    await Promise.all([fetchEvents(user.id), fetchOutfits(user.id)]);
    setLoading(false);
  }, []);

  useEffect(() => { init(); }, []);

  // Refresh on tab focus so web-added events appear immediately
  useFocusEffect(useCallback(() => {
    if (userId) {
      fetchEvents(userId);
      fetchOutfits(userId);
    }
  }, [userId]));

  const fetchEvents = async (uid: string) => {
    const { data } = await supabase
      .from('events')
      .select('*')
      .eq('user_id', uid)
      .order('event_date', { ascending: true });
    setEvents(data ?? []);
  };

  const fetchOutfits = async (uid: string) => {
    const { data } = await supabase
      .from('outfits')
      .select('id, name, event, cover_image_url')
      .eq('user_id', uid)
      .order('created_at', { ascending: false });
    setOutfits(data ?? []);
  };

  const formatDateOnly = (iso: string) =>
    new Date(iso).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US', {
      day: 'numeric', month: 'long', year: 'numeric', weekday: 'long',
    });

  const formatTimeOnly = (iso: string) =>
    new Date(iso).toLocaleTimeString(lang === 'tr' ? 'tr-TR' : 'en-US', {
      hour: '2-digit', minute: '2-digit',
    });

  const handleCreate = async () => {
    if (!formTitle.trim()) { setFormError(t.events.titleRequired); return; }
    if (!formDate)         { setFormError(t.events.dateRequired);  return; }
    if (!userId) return;

    setFormError('');
    setCreating(true);
    const { data, error } = await supabase
      .from('events')
      .insert({
        user_id: userId,
        title:      formTitle.trim(),
        event_type: formEventType,
        event_date: formDate,
        location:   formLocation || null,
        notes:      formNotes || null,
      })
      .select()
      .single();

    if (error) {
      Alert.alert('Hata', error.message);
    } else if (data) {
      setEvents(prev =>
        [...prev, data].sort((a, b) =>
          new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
        )
      );
      setFormTitle(''); setFormEventType('daily_casual');
      setFormDate(''); setFormLocation(''); setFormNotes('');
      setShowForm(false);
    }
    setCreating(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    await supabase.from('events').delete().eq('id', deleteTarget.id);
    setEvents(prev => prev.filter(e => e.id !== deleteTarget.id));
    setDeleteTarget(null);
    setDeleting(false);
  };

  const handleAssignOutfit = async (outfitId: string) => {
    if (!assignTarget) return;
    await supabase.from('events').update({ outfit_id: outfitId }).eq('id', assignTarget.id);
    setEvents(prev => prev.map(e =>
      e.id === assignTarget.id ? { ...e, outfit_id: outfitId } : e
    ));
    setAssignTarget(null);
  };

  const EVENT_LABEL = (type: EventType): string =>
    (t.events.eventLabels as Record<string, string>)[type] ?? type;

  const displayed = view === 'upcoming'
    ? events.filter(e => isUpcoming(e.event_date))
    : events;

  const upcomingCount = events.filter(e => isUpcoming(e.event_date)).length;

  /* ── Render ── */
  return (
    <SafeAreaView style={s.container}>

      {/* ── Hero header ── */}
      <View style={s.hero}>
        <View style={s.heroIcon}>
          <Text style={{ fontSize: 28 }}>📅</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.heroLabel}>{t.events.sectionLabel.toUpperCase()}</Text>
          <Text style={s.heroTitle}>{t.events.title}</Text>
          <Text style={s.heroSub}>{t.events.subtitle}</Text>
        </View>
        <View style={s.heroBadge}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 }}>
            <View style={s.heroDot} />
            <Text style={s.heroBadgeLabel}>Yaklaşan</Text>
          </View>
          <Text style={s.heroBadgeCount}>{upcomingCount}</Text>
          <Text style={s.heroBadgeSub}>etkinlik</Text>
        </View>
      </View>

      {/* ── Add button ── */}
      <View style={s.addRow}>
        <TouchableOpacity style={s.addBtn} onPress={() => setShowForm(v => !v)} activeOpacity={0.85}>
          <Ionicons name="add" size={15} color="#fff" />
          <Text style={s.addBtnText}>{t.events.addEvent}</Text>
        </TouchableOpacity>
      </View>

      {/* ── Tab bar ── */}
      <View style={s.tabBar}>
        {(['upcoming', 'all'] as const).map(v => (
          <TouchableOpacity key={v} style={[s.tab, view === v && s.tabActive]} onPress={() => setView(v)}>
            <Text style={[s.tabText, view === v && s.tabTextActive]}>
              {v === 'upcoming' ? t.events.tabUpcoming : t.events.tabAll}
            </Text>
          </TouchableOpacity>
        ))}
        <Text style={s.tabCount}>{displayed.length} {t.events.eventsCount}</Text>
      </View>

      {/* ── List ── */}
      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={RED} />
      ) : (
        <FlatList
          data={displayed}
          keyExtractor={item => item.id}
          contentContainerStyle={s.list}
          ListEmptyComponent={
            <View style={s.emptyBox}>
              <View style={s.emptyIconWrap}>
                <Ionicons name="calendar-outline" size={32} color={RED} />
              </View>
              <Text style={s.emptyText}>
                {view === 'upcoming' ? t.events.noUpcoming : t.events.noEvents}
              </Text>
              <Text style={s.emptySub}>{t.events.addEventHint}</Text>
            </View>
          }
          renderItem={({ item }) => {
            const upcoming       = isUpcoming(item.event_date);
            const assignedOutfit = outfits.find(o => o.id === item.outfit_id);
            const gradColors     = EVENT_GRADIENT_COLORS[item.event_type] ?? EVENT_GRADIENT_COLORS.daily_casual;
            const eventIcon      = EVENT_OPTIONS.find(e => e.value === item.event_type)?.icon ?? '📅';

            return (
              <View style={[s.eventCard, !upcoming && { opacity: 0.5 }]}>
                {/* Left cover panel */}
                <View style={[s.coverPanel, { backgroundColor: gradColors[0] }]}>
                  <Text style={{ fontSize: 32 }}>{eventIcon}</Text>
                </View>

                {/* Right content */}
                <View style={s.cardContent}>
                  {/* Top row: badge + delete */}
                  <View style={s.cardTopRow}>
                    <View style={s.typeBadge}>
                      <Text style={s.typeBadgeText}>{EVENT_LABEL(item.event_type)}</Text>
                    </View>
                    <TouchableOpacity style={s.deleteIconBtn} onPress={() => setDeleteTarget(item)}>
                      <Ionicons name="trash-outline" size={13} color="#706A64" />
                    </TouchableOpacity>
                  </View>

                  {/* Title */}
                  <Text style={s.eventTitle} numberOfLines={2}>{item.title}</Text>

                  {/* Date */}
                  <View style={s.metaRow}>
                    <Ionicons name="calendar-outline" size={13} color="#9E9690" />
                    <Text style={s.metaText}>{formatDateOnly(item.event_date)}</Text>
                  </View>
                  <View style={s.metaRow}>
                    <Ionicons name="time-outline" size={13} color="#9E9690" />
                    <Text style={s.metaText}>{formatTimeOnly(item.event_date)}</Text>
                  </View>
                  {item.location ? (
                    <View style={s.metaRow}>
                      <Ionicons name="location-outline" size={13} color="#9E9690" />
                      <Text style={s.metaText}>{item.location}</Text>
                    </View>
                  ) : null}

                  {/* Notes */}
                  {item.notes ? (
                    <Text style={s.noteText} numberOfLines={2}>{item.notes}</Text>
                  ) : null}

                  {/* Assign outfit button */}
                  {upcoming && (
                    <View style={s.cardBottom}>
                      {assignedOutfit && (
                        <View style={s.assignedBadge}>
                          <Ionicons name="checkmark" size={12} color="#4ade80" />
                          <Text style={s.assignedBadgeText}>{t.events.outfitAssigned}</Text>
                        </View>
                      )}
                      <TouchableOpacity
                        style={s.assignBtn}
                        onPress={() => setAssignTarget(item)}
                        activeOpacity={0.85}
                      >
                        <Ionicons name="add" size={13} color="#fff" />
                        <Text style={s.assignBtnText}>Kombin</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            );
          }}
        />
      )}

      {/* ── Create Event Modal ── */}
      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F2EE' }}>
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={s.modalHeader}>
              <View>
                <Text style={s.modalLabel}>{t.events.newEventLabel.toUpperCase()}</Text>
                <Text style={s.modalTitle}>{t.events.addEvent}</Text>
              </View>
              <TouchableOpacity onPress={() => setShowForm(false)} style={s.closeBtn}>
                <Ionicons name="close" size={20} color="#706A64" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={s.formScroll}>
              {/* Title */}
              <View style={s.formCard}>
                <Text style={s.fieldLabel}>{t.events.titleLabel}</Text>
                <TextInput
                  style={s.input}
                  placeholder={t.events.titlePlaceholder}
                  placeholderTextColor="#C4B8B0"
                  value={formTitle}
                  onChangeText={setFormTitle}
                />
              </View>

              {/* Event Type */}
              <View style={s.formCard}>
                <Text style={s.fieldLabel}>{t.events.eventTypeLabel}</Text>
                <View style={s.eventTypeGrid}>
                  {EVENT_OPTIONS.map(opt => (
                    <TouchableOpacity
                      key={opt.value}
                      style={[s.eventTypeBtn, formEventType === opt.value && s.eventTypeBtnActive]}
                      onPress={() => setFormEventType(opt.value)}
                      activeOpacity={0.8}
                    >
                      <Text style={{ fontSize: 18 }}>{opt.icon}</Text>
                      <Text style={[s.eventTypeLbl, formEventType === opt.value && s.eventTypeLblActive]}>
                        {EVENT_LABEL(opt.value)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Date & Location */}
              <View style={s.formCard}>
                <Text style={s.fieldLabel}>{t.events.dateTimeLabel}</Text>
                <TextInput
                  style={s.input}
                  placeholder="2026-06-15T19:30"
                  placeholderTextColor="#C4B8B0"
                  value={formDate}
                  onChangeText={setFormDate}
                />
                <Text style={[s.fieldLabel, { marginTop: 16 }]}>{t.events.locationLabel}</Text>
                <TextInput
                  style={s.input}
                  placeholder={t.events.locationPlaceholder}
                  placeholderTextColor="#C4B8B0"
                  value={formLocation}
                  onChangeText={setFormLocation}
                />
              </View>

              {/* Notes */}
              <View style={s.formCard}>
                <Text style={s.fieldLabel}>{t.events.notesLabel}</Text>
                <TextInput
                  style={[s.input, { height: 84, textAlignVertical: 'top' }]}
                  placeholder={t.events.notesPlaceholder}
                  placeholderTextColor="#C4B8B0"
                  value={formNotes}
                  onChangeText={setFormNotes}
                  multiline
                />
              </View>

              {formError ? <Text style={s.formError}>{formError}</Text> : null}

              <View style={s.formActions}>
                <TouchableOpacity style={s.cancelBtn} onPress={() => setShowForm(false)}>
                  <Text style={s.cancelBtnText}>{t.events.cancel}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.submitBtn, creating && { opacity: 0.5 }]}
                  onPress={handleCreate}
                  disabled={creating}
                  activeOpacity={0.85}
                >
                  {creating
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={s.submitBtnText}>{t.events.createEvent}</Text>
                  }
                </TouchableOpacity>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* ── Assign Outfit Modal ── */}
      <Modal visible={!!assignTarget} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F2EE' }}>
          <View style={s.modalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={s.modalLabel}>{t.events.selectOutfitLabel.toUpperCase()}</Text>
              {assignTarget && (
                <Text style={s.modalTitle} numberOfLines={1}>{t.events.forEvent} {assignTarget.title}</Text>
              )}
            </View>
            <TouchableOpacity onPress={() => setAssignTarget(null)} style={s.closeBtn}>
              <Ionicons name="close" size={20} color="#706A64" />
            </TouchableOpacity>
          </View>

          {outfits.length === 0 ? (
            <View style={s.emptyBox}>
              <Text style={s.emptyText}>{t.events.noSavedOutfits}</Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }}>
              {outfits.map(outfit => (
                <TouchableOpacity
                  key={outfit.id}
                  style={[
                    s.outfitSelectCard,
                    assignTarget?.outfit_id === outfit.id && s.outfitSelectCardActive,
                  ]}
                  onPress={() => handleAssignOutfit(outfit.id)}
                  activeOpacity={0.85}
                >
                  {outfit.cover_image_url ? (
                    <Image source={{ uri: outfit.cover_image_url }} style={s.outfitSelectImg} />
                  ) : (
                    <View style={[s.outfitSelectImg, s.outfitSelectImgEmpty]}>
                      <Ionicons name="sparkles" size={20} color={RED} />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={s.outfitSelectName} numberOfLines={1}>
                      {outfit.name ?? `${(t.events.eventLabels as Record<string, string>)[outfit.event ?? ''] ?? outfit.event} Kombini`}
                    </Text>
                    {outfit.event ? (
                      <Text style={s.outfitSelectMeta}>
                        {(t.events.eventLabels as Record<string, string>)[outfit.event] ?? outfit.event}
                      </Text>
                    ) : null}
                  </View>
                  {assignTarget?.outfit_id === outfit.id && (
                    <Ionicons name="checkmark-circle" size={20} color="#4ade80" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          <View style={{ padding: 16 }}>
            <TouchableOpacity style={s.cancelBtn} onPress={() => setAssignTarget(null)}>
              <Text style={s.cancelBtnText}>{t.events.cancel}</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* ── Delete Confirm Modal ── */}
      <Modal transparent visible={!!deleteTarget} animationType="fade">
        <View style={s.overlay}>
          <View style={s.deleteModal}>
            <Text style={s.deleteLbl}>{t.events.confirmDelete.toUpperCase()}</Text>
            <Text style={s.deleteTitle}>{deleteTarget?.title}</Text>
            <Text style={s.deleteSub}>{t.events.deleteEventConfirm}</Text>
            <View style={s.deleteActions}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setDeleteTarget(null)}>
                <Text style={s.cancelBtnText}>{t.events.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.submitBtn, { backgroundColor: RED }, deleting && { opacity: 0.5 }]}
                onPress={handleDelete}
                disabled={deleting}
                activeOpacity={0.85}
              >
                <Text style={s.submitBtnText}>
                  {deleting ? t.events.deleting : t.events.delete}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F2EE' },

  /* Hero */
  hero: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E2DDD7',
    paddingHorizontal: 18, paddingVertical: 16,
  },
  heroIcon: {
    width: 60, height: 60, borderRadius: 16, flexShrink: 0,
    backgroundColor: '#F5E8E8', borderWidth: 1, borderColor: 'rgba(196,30,58,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  heroLabel: { fontSize: 8, fontWeight: '700', letterSpacing: 2, color: '#9E9690', marginBottom: 2 },
  heroTitle: { fontSize: 20, fontWeight: '700', color: '#141210', letterSpacing: -0.3 },
  heroSub:   { fontSize: 11, color: '#9E9690', marginTop: 2 },
  heroBadge: {
    minWidth: 70, backgroundColor: 'rgba(196,30,58,0.05)',
    borderWidth: 1, borderColor: 'rgba(196,30,58,0.15)',
    borderRadius: 12, paddingVertical: 8, paddingHorizontal: 10, alignItems: 'center',
  },
  heroDot:        { width: 5, height: 5, borderRadius: 3, backgroundColor: RED },
  heroBadgeLabel: { fontSize: 8, fontWeight: '700', letterSpacing: 1, color: '#9E9690' },
  heroBadgeCount: { fontSize: 22, fontWeight: '800', color: RED, lineHeight: 26 },
  heroBadgeSub:   { fontSize: 9, color: '#9E9690', marginTop: 1 },

  /* Add row */
  addRow: { paddingHorizontal: 18, paddingVertical: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E2DDD7' },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: RED, borderRadius: 10,
    paddingVertical: 10, paddingHorizontal: 16, alignSelf: 'flex-end',
  },
  addBtnText: { color: '#fff', fontSize: 12, fontWeight: '700', letterSpacing: 0.3 },

  /* Tab bar */
  tabBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E2DDD7',
    paddingHorizontal: 18,
  },
  tab:          { paddingVertical: 12, marginRight: 20, borderBottomWidth: 2.5, borderBottomColor: 'transparent', marginBottom: -1 },
  tabActive:    { borderBottomColor: RED },
  tabText:      { fontSize: 10, fontWeight: '700', letterSpacing: 1, color: '#9E9690', textTransform: 'uppercase' },
  tabTextActive:{ color: '#141210' },
  tabCount:     { marginLeft: 'auto', fontSize: 11, color: '#9E9690' },

  /* List */
  list: { padding: 16, gap: 12, paddingBottom: 32 },

  /* Event card */
  eventCard: {
    flexDirection: 'row', borderRadius: 18, overflow: 'hidden',
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2DDD7',
    shadowColor: '#141210', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  coverPanel: { width: 80, alignItems: 'center', justifyContent: 'center', minHeight: 150 },
  cardContent: { flex: 1, padding: 14 },
  cardTopRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  typeBadge: {
    backgroundColor: 'rgba(196,30,58,0.09)', borderWidth: 1, borderColor: 'rgba(196,30,58,0.2)',
    paddingHorizontal: 10, paddingVertical: 3, borderRadius: 100,
  },
  typeBadgeText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.8, color: RED, textTransform: 'uppercase' },
  deleteIconBtn: {
    width: 30, height: 30, borderRadius: 8, borderWidth: 1, borderColor: '#E2DDD7',
    backgroundColor: '#F8F5F2', alignItems: 'center', justifyContent: 'center',
  },
  eventTitle: { fontSize: 15, fontWeight: '700', color: '#141210', marginBottom: 8, lineHeight: 20 },
  metaRow:    { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  metaText:   { fontSize: 12, color: '#706A64', flex: 1 },
  noteText:   { fontSize: 12, color: '#9E9690', lineHeight: 17, marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F0EAE4' },

  cardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  assignedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(74,222,128,0.1)', borderWidth: 1, borderColor: 'rgba(74,222,128,0.25)',
    borderRadius: 100, paddingHorizontal: 8, paddingVertical: 3,
  },
  assignedBadgeText: { fontSize: 9, fontWeight: '700', color: '#4ade80', letterSpacing: 0.5 },
  assignBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 'auto',
    backgroundColor: RED, borderRadius: 8, paddingVertical: 7, paddingHorizontal: 12,
  },
  assignBtnText: { fontSize: 11, fontWeight: '700', color: '#fff' },

  /* Empty */
  emptyBox: {
    margin: 20, borderWidth: 1, borderColor: '#EDE6DC', borderStyle: 'dashed',
    borderRadius: 18, paddingVertical: 44, paddingHorizontal: 24, alignItems: 'center',
    backgroundColor: '#FDFAF8',
  },
  emptyIconWrap: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(196,30,58,0.07)', borderWidth: 1, borderColor: 'rgba(196,30,58,0.15)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  emptyText: { fontSize: 16, fontWeight: '700', color: '#1A1108', marginBottom: 6, textAlign: 'center' },
  emptySub:  { fontSize: 12, color: '#A89F96', textAlign: 'center', lineHeight: 18 },

  /* Modal shared */
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: 20, paddingVertical: 18,
    borderBottomWidth: 1, borderBottomColor: '#E2DDD7', backgroundColor: '#fff',
  },
  modalLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 2, color: '#9E9690', marginBottom: 3 },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#141210' },
  closeBtn:   { padding: 4, marginTop: 2 },

  /* Form */
  formScroll: { padding: 16, gap: 12, paddingBottom: 40 },
  formCard: {
    backgroundColor: '#fff', borderRadius: 14,
    borderWidth: 1, borderColor: '#E2DDD7', padding: 16,
  },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: '#706A64', letterSpacing: 0.5, marginBottom: 8 },
  input: {
    borderWidth: 1, borderColor: '#E2DDD7', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: '#141210', backgroundColor: '#FDFAF8',
  },
  eventTypeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  eventTypeBtn: {
    width: '22%', borderWidth: 1, borderColor: '#E2DDD7',
    borderRadius: 10, paddingVertical: 10, alignItems: 'center', gap: 4, backgroundColor: '#F5F2EE',
  },
  eventTypeBtnActive: { backgroundColor: RED, borderColor: RED },
  eventTypeLbl:       { fontSize: 9, fontWeight: '700', letterSpacing: 0.4, color: '#9E9690', textAlign: 'center' },
  eventTypeLblActive: { color: '#fff' },
  formError: { fontSize: 12, color: RED, marginLeft: 4 },
  formActions: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: '#E2DDD7', paddingVertical: 14, alignItems: 'center', borderRadius: 10, backgroundColor: '#fff' },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: '#706A64' },
  submitBtn: { flex: 1, backgroundColor: RED, paddingVertical: 14, alignItems: 'center', borderRadius: 10 },
  submitBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  /* Outfit select */
  outfitSelectCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderColor: '#E2DDD7', backgroundColor: '#fff',
    padding: 12, borderRadius: 12,
  },
  outfitSelectCardActive: { borderColor: 'rgba(196,30,58,0.3)', backgroundColor: 'rgba(196,30,58,0.07)' },
  outfitSelectImg:      { width: 48, height: 48, backgroundColor: '#E2DDD7', borderRadius: 8 },
  outfitSelectImgEmpty: { alignItems: 'center', justifyContent: 'center' },
  outfitSelectName:     { fontSize: 13, fontWeight: '600', color: '#141210' },
  outfitSelectMeta:     { fontSize: 11, color: '#706A64', marginTop: 2 },

  /* Delete modal */
  overlay:       { flex: 1, backgroundColor: 'rgba(14,10,8,0.65)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  deleteModal:   { backgroundColor: '#fff', padding: 32, width: '100%', borderRadius: 18 },
  deleteLbl:     { fontSize: 10, fontWeight: '700', letterSpacing: 2, color: '#9E9690', marginBottom: 8 },
  deleteTitle:   { fontSize: 20, fontWeight: '700', color: '#141210', marginBottom: 6 },
  deleteSub:     { fontSize: 13, color: '#706A64', marginBottom: 24 },
  deleteActions: { flexDirection: 'row', gap: 12 },
});

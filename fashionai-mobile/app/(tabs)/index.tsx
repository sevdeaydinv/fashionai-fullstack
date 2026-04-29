import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase/client';

const QUICK_ACTIONS = [
  { label: 'Wardrobe', description: 'Upload a new item to your collection', icon: '👕', route: '/(tabs)/wardrobe' },
  { label: 'Outfit', description: "Generate today's AI suggestion", icon: '✨', route: '/(tabs)/outfits' },
  { label: 'Beauty', description: 'Personalized beauty recommendations', icon: '💄', route: '/(tabs)/beauty' },
  { label: 'Profile', description: 'Edit your style preferences', icon: '👤', route: '/(tabs)/profile' },
];

const STEPS = [
  { done: true,  label: 'Create your account' },
  { done: false, label: 'Fill in body measurements & style preferences' },
  { done: false, label: 'Upload your first clothing items' },
  { done: false, label: 'Generate your first outfit' },
];

const STATS = [
  { label: 'Clothing Items', value: '0', icon: '👕' },
  { label: 'Outfits Saved', value: '0', icon: '✨' },
  { label: 'Events Planned', value: '0', icon: '📅' },
  { label: 'Style Score', value: '—', icon: '⭐' },
];

export default function HomeScreen() {
  const [firstName, setFirstName] = useState('there');
  const [clothingCount, setClothingCount] = useState(0);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const name = user.user_metadata?.full_name?.split(' ')[0] ?? 'there';
      setFirstName(name);

      const { count } = await supabase
        .from('clothes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      setClothingCount(count ?? 0);
    };
    load();
  }, []);

  const stats = [
    { label: 'Clothing Items', value: String(clothingCount), icon: '👕' },
    { label: 'Outfits Saved', value: '0', icon: '✨' },
    { label: 'Events Planned', value: '0', icon: '📅' },
    { label: 'Style Score', value: '—', icon: '⭐' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.label}>DASHBOARD</Text>
          <Text style={styles.heading}>Good day, {firstName}</Text>
          <Text style={styles.sub}>Let's find you the perfect outfit for today.</Text>
        </View>

        <View style={styles.divider} />

        {/* Getting Started */}
        <View style={styles.card}>
          <Text style={styles.label}>🚀  GETTING STARTED</Text>
          <Text style={styles.cardTitle}>Complete your setup</Text>
          <Text style={styles.cardSub}>Follow these steps to unlock personalized AI styling.</Text>

          <View style={{ marginTop: 16, gap: 10 }}>
            {STEPS.map((step, i) => (
              <View key={i} style={styles.step}>
                <View style={[styles.stepDot, step.done && styles.stepDotDone]}>
                  {step.done && <Text style={{ color: '#fff', fontSize: 10 }}>✓</Text>}
                </View>
                <Text style={[styles.stepText, step.done && styles.stepTextDone]}>{step.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={[styles.label, { paddingHorizontal: 24, marginBottom: 12 }]}>QUICK ACTIONS</Text>
        <View style={styles.actionsGrid}>
          {QUICK_ACTIONS.map((action) => (
            <TouchableOpacity
              key={action.label}
              style={styles.actionCard}
              onPress={() => router.push(action.route as never)}
            >
              <Text style={styles.actionIcon}>{action.icon}</Text>
              <Text style={styles.actionLabel}>{action.label.toUpperCase()}</Text>
              <Text style={styles.actionDesc}>{action.description}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Stats */}
        <Text style={[styles.label, { paddingHorizontal: 24, marginBottom: 12, marginTop: 8 }]}>YOUR STATS</Text>
        <View style={styles.statsGrid}>
          {stats.map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              <Text style={styles.statIcon}>{stat.icon}</Text>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label.toUpperCase()}</Text>
            </View>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: { paddingBottom: 40 },
  header: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 24 },
  label: { fontSize: 10, fontWeight: '700', letterSpacing: 2, color: '#bbb', marginBottom: 6 },
  heading: { fontSize: 30, fontWeight: '700', color: '#111', letterSpacing: -0.5, marginBottom: 4 },
  sub: { fontSize: 13, color: '#999' },
  divider: { height: 1, backgroundColor: '#f0f0f0', marginHorizontal: 24, marginBottom: 24 },

  card: {
    marginHorizontal: 24, marginBottom: 28,
    borderWidth: 1, borderColor: '#fde68a',
    backgroundColor: '#fffbeb', padding: 20,
  },
  cardTitle: { fontSize: 17, fontWeight: '700', color: '#111', marginBottom: 4 },
  cardSub: { fontSize: 12, color: '#666' },
  step: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepDot: {
    width: 20, height: 20, borderWidth: 1, borderColor: '#ccc',
    alignItems: 'center', justifyContent: 'center',
  },
  stepDotDone: { backgroundColor: '#111', borderColor: '#111' },
  stepText: { fontSize: 13, color: '#333', flex: 1 },
  stepTextDone: { color: '#bbb', textDecorationLine: 'line-through' },

  actionsGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 24, gap: 1,
    marginBottom: 28, backgroundColor: '#e5e5e5',
  },
  actionCard: {
    width: '49.5%', backgroundColor: '#fff',
    padding: 20, gap: 8,
  },
  actionIcon: { fontSize: 22 },
  actionLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5, color: '#111' },
  actionDesc: { fontSize: 11, color: '#999', lineHeight: 16 },

  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 24, gap: 1,
    backgroundColor: '#e5e5e5',
  },
  statCard: {
    width: '49.5%', backgroundColor: '#fff',
    padding: 20,
  },
  statIcon: { fontSize: 20 },
  statValue: { fontSize: 28, fontWeight: '700', color: '#111', marginTop: 12, marginBottom: 4 },
  statLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1.5, color: '#bbb' },
});

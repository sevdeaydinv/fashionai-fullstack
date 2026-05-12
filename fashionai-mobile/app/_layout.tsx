import { useEffect, useState } from 'react';
import { Stack, router, useSegments } from 'expo-router';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import { StatusBar } from 'expo-status-bar';
import { LanguageProvider } from '@/lib/i18n/LanguageContext';

export default function RootLayout() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const segments = useSegments();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session === undefined) return;

    // Oturum açık ve auth sayfasındaysa → tabs'a gönder
    if (session && segments[0] === '(auth)') {
      router.replace('/(tabs)');
    }
  }, [session, segments]);

  if (session === undefined) return null;

  return (
    <LanguageProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
    </LanguageProvider>
  );
}

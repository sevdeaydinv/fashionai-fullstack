import { Tabs, Redirect } from 'expo-router';
import { useState, useEffect } from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import { useLanguage } from '@/lib/i18n/LanguageContext';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_ICONS: Record<string, { filled: IoniconName; outline: IoniconName }> = {
  index:    { filled: 'home',      outline: 'home-outline'      },
  wardrobe: { filled: 'shirt',     outline: 'shirt-outline'     },
  outfits:  { filled: 'sparkles',  outline: 'sparkles-outline'  },
  kesfet:   { filled: 'compass',   outline: 'compass-outline'   },
  events:   { filled: 'calendar',  outline: 'calendar-outline'  },
  profile:  { filled: 'person',    outline: 'person-outline'    },
};

function TabIcon({ routeName, focused }: { routeName: string; focused: boolean }) {
  const cfg = TAB_ICONS[routeName];
  if (!cfg) return null;
  return (
    <View style={{
      alignItems: 'center',
      justifyContent: 'center',
      width: 38,
      height: 26,
      borderRadius: 13,
      backgroundColor: focused ? 'rgba(196,30,58,0.15)' : 'transparent',
    }}>
      <Ionicons
        name={focused ? cfg.filled : cfg.outline}
        size={19}
        color={focused ? '#C41E3A' : 'rgba(255,255,255,0.38)'}
      />
    </View>
  );
}

export default function TabsLayout() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const { t } = useLanguage();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  if (session === undefined) return null;
  if (!session) return <Redirect href="/" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1A1410',
          borderTopWidth: 0,
          height: 58,
          paddingTop: 6,
          paddingBottom: 6,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.18,
          shadowRadius: 8,
          elevation: 10,
        },
        tabBarActiveTintColor: '#C41E3A',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.32)',
        tabBarLabelStyle: {
          fontSize: 9,
          fontWeight: '700',
          letterSpacing: 0.4,
          marginTop: 1,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t.dashboardNav.home.toUpperCase(),
          tabBarIcon: ({ focused }) => <TabIcon routeName="index" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="wardrobe"
        options={{
          title: t.dashboardNav.wardrobe.toUpperCase(),
          tabBarIcon: ({ focused }) => <TabIcon routeName="wardrobe" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="outfits"
        options={{
          title: t.dashboardNav.outfits.toUpperCase(),
          tabBarIcon: ({ focused }) => <TabIcon routeName="outfits" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="kesfet"
        options={{
          title: 'KEŞFET',
          tabBarIcon: ({ focused }) => <TabIcon routeName="kesfet" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: t.dashboardNav.events.toUpperCase(),
          tabBarIcon: ({ focused }) => <TabIcon routeName="events" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t.dashboardNav.profile.toUpperCase(),
          tabBarIcon: ({ focused }) => <TabIcon routeName="profile" focused={focused} />,
        }}
      />

      {/* Hidden tabs — still navigable via router.push */}
      <Tabs.Screen name="beauty"       options={{ href: null }} />
      <Tabs.Screen name="avatar"       options={{ href: null }} />
      <Tabs.Screen name="valiz"        options={{ href: null }} />
      <Tabs.Screen name="outfit-detail" options={{ href: null }} />
    </Tabs>
  );
}

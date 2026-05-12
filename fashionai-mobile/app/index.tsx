import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Dimensions, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');
const HERO_IMG = require('@/assets/hero-models.jpg');
// Fotoğraf 848x1264 — yüksekliğe göre ölçeklenince genişlik: 848*(h/1264)
// İkisi de görünsün diye yatay kırpma minimumda tutulur
const SCALED_W = height * (848 / 1264);
const IMG_LEFT = -(SCALED_W - width) / 2;
const RED = '#C41E3A';
const AVATARS = ['S', 'M', 'A', 'J', 'K'];

export default function LandingScreen() {
  return (
    <View style={s.root}>

      {/* ── Arka plan görseli — tam ekran, siyahlık yok ── */}
      <Image
        source={HERO_IMG}
        style={{
          position: 'absolute',
          width: SCALED_W,
          height: height,
          top: 0,
          left: IMG_LEFT,
        }}
        resizeMode="stretch"
      />

      {/* Tek overlay — görsel tüm ekranda görünsün ama yazılar okunur */}
      <View style={s.overlay} pointerEvents="none" />

      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>

        {/* ── Navbar ── */}
        <View style={s.nav}>
          <Text style={s.brand}>FASHION<Text style={s.red}>AI</Text></Text>
          <View style={s.navBtns}>
            <TouchableOpacity style={s.navLogin} onPress={() => router.push('/(auth)/login')} activeOpacity={0.8}>
              <Text style={s.navLoginTxt}>Giriş</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.navStart} onPress={() => router.push('/(auth)/register')} activeOpacity={0.8}>
              <Text style={s.navStartTxt}>Başla</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Boşluk — görselin büyük kısmı görünsün */}
        <View style={{ flex: 1 }} />

        {/* ── Alt içerik ── */}
        <View style={s.content}>
          <Text style={s.h1}>Dijital{'\n'}Gardırobunuz</Text>

          <Text style={s.sub}>
            Gardırobunuzu bir kez yükleyin. Yapay zekamız her gün stilinize ve hava durumuna özel kombinler üretsin.
          </Text>

          <View style={s.btnRow}>
            <TouchableOpacity style={s.btnPrimary} onPress={() => router.push('/(auth)/register')} activeOpacity={0.88}>
              <Text style={s.btnPrimaryTxt}>Ücretsiz Başla</Text>
              <Ionicons name="arrow-forward" size={15} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={s.btnSecondary} activeOpacity={0.88}>
              <Text style={s.btnSecondaryTxt}>Nasıl Çalışır?</Text>
            </TouchableOpacity>
          </View>

          <View style={s.social}>
            <View style={s.avatars}>
              {AVATARS.map((l, i) => (
                <View key={i} style={[s.avatar, {
                  backgroundColor: i % 2 === 0 ? RED : '#7b3535',
                  marginLeft: i > 0 ? -9 : 0,
                  zIndex: 10 - i,
                }]}>
                  <Text style={s.avatarTxt}>{l}</Text>
                </View>
              ))}
            </View>
            <Text style={s.socialTxt}>
              <Text style={s.socialBold}>10.000+</Text> mutlu kullanıcı
            </Text>
          </View>
        </View>

      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a0a0a' },

  // Tek overlay — tüm ekranı örter, görsel her yerde görünür
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },

  safe: { flex: 1 },

  // Navbar
  nav: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22, paddingVertical: 10,
  },
  brand: { fontSize: 14, fontWeight: '900', letterSpacing: 3, color: '#fff' },
  red:   { color: RED },
  navBtns:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  navLogin: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 50,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.28)',
  },
  navLoginTxt: { color: '#fff', fontSize: 13, fontWeight: '700' },
  navStart: {
    paddingHorizontal: 18, paddingVertical: 8,
    borderRadius: 50, backgroundColor: RED,
  },
  navStartTxt: { color: '#fff', fontSize: 13, fontWeight: '800' },

  // İçerik — en alta yapışık
  content: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  h1: {
    fontSize: Math.min(52, width * 0.135),
    fontWeight: '300', fontStyle: 'italic',
    color: '#fff',
    lineHeight: Math.min(58, width * 0.15),
    letterSpacing: -1.5,
    marginBottom: 16,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  sub: {
    fontSize: 14, color: 'rgba(255,255,255,0.85)',
    lineHeight: 22, maxWidth: width * 0.88,
    marginBottom: 24,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  btnRow: { flexDirection: 'row', gap: 10, marginBottom: 24, flexWrap: 'wrap' },
  btnPrimary: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: RED, borderRadius: 50,
    paddingHorizontal: 22, paddingVertical: 13, minHeight: 46,
  },
  btnPrimaryTxt: { color: '#fff', fontSize: 13, fontWeight: '800' },
  btnSecondary: {
    borderRadius: 50, paddingHorizontal: 20, paddingVertical: 13,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)',
    backgroundColor: 'rgba(255,255,255,0.12)',
    minHeight: 46, justifyContent: 'center',
  },
  btnSecondaryTxt: { color: '#fff', fontSize: 13, fontWeight: '700' },

  social: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatars: { flexDirection: 'row' },
  avatar: {
    width: 30, height: 30, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#000',
  },
  avatarTxt:  { fontSize: 10, fontWeight: '800', color: '#fff' },
  socialTxt:  { fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  socialBold: { color: '#fff', fontWeight: '700' },
});

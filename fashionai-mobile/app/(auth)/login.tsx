import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, Alert, StatusBar
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase/client';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Hata', 'E-posta ve şifre gerekli.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) Alert.alert('Giriş hatası', error.message);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" />

      {/* Background glow orbs */}
      <View style={styles.glowTop} />
      <View style={styles.glowBottom} />
      <View style={styles.glowCenter} />

      <View style={styles.inner}>
        {/* Logo */}
        <View style={styles.logoRow}>
          <View style={styles.logoIconWrap}>
            <Ionicons name="sparkles" size={20} color="#fff" />
          </View>
          <Text style={styles.logoText}>FASHION AI</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.heading}>Tekrar hoşgeldiniz</Text>
          <Text style={styles.subheading}>
            Hesabın yok mu?{' '}
            <Text style={styles.subheadingLink} onPress={() => router.push('/(auth)/register')}>
              Kayıt ol
            </Text>
          </Text>

          {/* Email input */}
          <View style={[styles.inputWrap, emailFocused && styles.inputWrapFocused]}>
            <Ionicons name="mail-outline" size={17} color={emailFocused ? '#C41E3A' : 'rgba(255,255,255,0.35)'} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="E-posta adresi"
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={email}
              onChangeText={setEmail}
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
              autoCapitalize="none"
              keyboardType="email-address"
              selectionColor="#C41E3A"
            />
          </View>

          {/* Password input */}
          <View style={[styles.inputWrap, passwordFocused && styles.inputWrapFocused]}>
            <Ionicons name="lock-closed-outline" size={17} color={passwordFocused ? '#C41E3A' : 'rgba(255,255,255,0.35)'} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Şifre"
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={password}
              onChangeText={setPassword}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
              secureTextEntry={!showPassword}
              selectionColor="#C41E3A"
            />
            <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={styles.eyeBtn}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={17} color="rgba(255,255,255,0.35)" />
            </TouchableOpacity>
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <Text style={styles.submitBtnText}>Giriş yapılıyor...</Text>
            ) : (
              <>
                <Ionicons name="log-in-outline" size={17} color="#fff" style={{ marginRight: 7 }} />
                <Text style={styles.submitBtnText}>Giriş Yap</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>veya</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google (disabled placeholder) */}
          <TouchableOpacity style={styles.googleBtn} disabled activeOpacity={0.7}>
            <View style={styles.googleIconWrap}>
              <Text style={styles.googleIconText}>G</Text>
            </View>
            <Text style={styles.googleBtnText}>Google ile devam et</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0E0A08',
  },
  glowTop: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(196,30,58,0.09)',
    top: -100,
    right: -80,
  },
  glowBottom: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(139,0,0,0.07)',
    bottom: -60,
    left: -80,
  },
  glowCenter: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(196,30,58,0.06)',
    top: '38%',
    right: '20%',
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  // Logo
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    gap: 10,
  },
  logoIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#C41E3A',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#C41E3A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  logoText: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 3.5,
    color: '#fff',
  },

  // Card
  card: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: 24,
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  subheading: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.45)',
    marginBottom: 24,
  },
  subheadingLink: {
    color: '#C41E3A',
    fontWeight: '600',
  },

  // Input
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    marginBottom: 12,
    paddingHorizontal: 14,
  },
  inputWrapFocused: {
    borderColor: '#C41E3A',
    backgroundColor: 'rgba(196,30,58,0.06)',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: '#fff',
  },
  eyeBtn: {
    padding: 4,
  },

  // Submit
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#C41E3A',
    paddingVertical: 15,
    borderRadius: 12,
    marginTop: 6,
    shadowColor: '#C41E3A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  submitBtnDisabled: {
    opacity: 0.55,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // Divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  dividerText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.3)',
    letterSpacing: 0.5,
  },

  // Google
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 13,
    borderRadius: 12,
    gap: 10,
    opacity: 0.5,
  },
  googleIconWrap: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIconText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#EA4335',
    lineHeight: 14,
  },
  googleBtnText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.55)',
    fontWeight: '500',
  },
});

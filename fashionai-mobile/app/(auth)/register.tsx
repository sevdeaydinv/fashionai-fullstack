import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, Alert, ScrollView
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase/client';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!email || !password || !name) {
      Alert.alert('Hata', 'Tüm alanları doldurun.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });
    setLoading(false);
    if (error) {
      Alert.alert('Kayıt hatası', error.message);
    } else {
      Alert.alert('Başarılı', 'E-postanızı doğrulayın.');
      router.push('/(auth)/login');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <Text style={styles.logo}>FashionAI</Text>
        <Text style={styles.subtitle}>Hesap oluştur</Text>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Ad Soyad"
            placeholderTextColor="#999"
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={styles.input}
            placeholder="E-posta"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={styles.input}
            placeholder="Şifre"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={styles.btnText}>{loading ? 'Kaydediliyor...' : 'Kayıt Ol'}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.link}>Zaten hesabın var mı? <Text style={styles.linkBold}>Giriş yap</Text></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  inner: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 32, paddingVertical: 60 },
  logo: { fontSize: 32, fontWeight: '700', color: '#111', letterSpacing: -1, marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#999', marginBottom: 40 },
  form: { gap: 12 },
  input: {
    borderWidth: 1, borderColor: '#e5e5e5',
    paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 15, color: '#111',
  },
  btn: {
    backgroundColor: '#111', paddingVertical: 15,
    alignItems: 'center', marginTop: 8,
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: '#fff', fontSize: 14, fontWeight: '600', letterSpacing: 0.5 },
  link: { textAlign: 'center', color: '#999', fontSize: 13, marginTop: 8 },
  linkBold: { color: '#111', fontWeight: '600' },
});

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';

export function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [focused, setFocused]   = useState<'email' | 'password' | null>(null);

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Atenção', 'Preencha e-mail e senha.');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
    } catch (error) {
      Alert.alert(
        'Erro ao entrar',
        error instanceof Error ? error.message : 'Tente novamente.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.topBlob} />
      <View style={s.topBlobSmall} />

      <KeyboardAvoidingView
        style={s.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={s.logoWrap}>
            <View style={s.logoBadge}>
              <Text style={s.logoLetter}>TEA</Text>
            </View>
            <Text style={s.appName}>Sistema TEA</Text>
            <Text style={s.appSub}>Gestão clínica integrada</Text>
          </View>

          <View style={s.card}>
            <Text style={s.cardTitle}>Bem-vindo de volta</Text>
            <Text style={s.cardSub}>Faça login para continuar</Text>

            <View style={s.form}>
              <View>
                <Text style={s.label}>E-mail</Text>
                <View style={[s.inputWrap, focused === 'email' && s.inputFocused]}>
                  <Text style={s.inputIcon}>✉️</Text>
                  <TextInput
                    style={s.textInput}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="seu@email.com"
                    placeholderTextColor="#94A3B8"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading}
                    onFocus={() => setFocused('email')}
                    onBlur={() => setFocused(null)}
                  />
                </View>
              </View>

              <View>
                <Text style={s.label}>Senha</Text>
                <View style={[s.inputWrap, focused === 'password' && s.inputFocused]}>
                  <Text style={s.inputIcon}>🔒</Text>
                  <TextInput
                    style={s.textInput}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="••••••••"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry
                    editable={!loading}
                    onSubmitEditing={handleLogin}
                    returnKeyType="done"
                    onFocus={() => setFocused('password')}
                    onBlur={() => setFocused(null)}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[s.loginBtn, loading && s.loginBtnDisabled]}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={s.loginBtnText}>Entrar</Text>
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity activeOpacity={0.7} style={s.forgotWrap}>
              <Text style={s.forgotText}>Esqueceu a senha?</Text>
            </TouchableOpacity>
          </View>

          <Text style={s.footer}>© 2025 TEA · Todos os direitos reservados</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#EFF6FF' },
  kav:  { flex: 1 },

  topBlob: {
    position: 'absolute', top: -80, right: -80,
    width: 280, height: 280, borderRadius: 140,
    backgroundColor: '#2563EB', opacity: 0.12,
  },
  topBlobSmall: {
    position: 'absolute', top: -30, left: -60,
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: '#3B82F6', opacity: 0.08,
  },

  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 48 },

  logoWrap:   { alignItems: 'center', marginBottom: 32 },
  logoBadge:  {
    width: 72, height: 72, borderRadius: 22,
    backgroundColor: '#2563EB', alignItems: 'center', justifyContent: 'center',
    marginBottom: 14, shadowColor: '#2563EB', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 8,
  },
  logoLetter: { fontSize: 22, fontWeight: '900', color: '#fff', letterSpacing: 2 },
  appName:    { fontSize: 24, fontWeight: '800', color: '#0F172A', letterSpacing: -0.3 },
  appSub:     { fontSize: 13, color: '#64748B', marginTop: 4 },

  card: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24,
    shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 12, elevation: 3,
  },
  cardTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
  cardSub:   { fontSize: 13, color: '#64748B', marginBottom: 24 },

  form:  { gap: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 6 },

  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F8FAFC', borderRadius: 12,
    paddingHorizontal: 14, height: 52,
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  inputFocused: { borderColor: '#2563EB', backgroundColor: '#EFF6FF' },
  inputIcon:    { fontSize: 16, marginRight: 10 },
  textInput:    { flex: 1, fontSize: 15, color: '#0F172A' },

  loginBtn: {
    backgroundColor: '#2563EB', borderRadius: 14,
    height: 52, alignItems: 'center', justifyContent: 'center',
    marginTop: 8,
  },
  loginBtnDisabled: { opacity: 0.6 },
  loginBtnText:     { fontSize: 16, fontWeight: '700', color: '#fff' },

  forgotWrap: { alignItems: 'center', marginTop: 18 },
  forgotText: { fontSize: 13, color: '#2563EB', fontWeight: '600' },

  footer: { textAlign: 'center', fontSize: 11, color: '#94A3B8', marginTop: 32 },
});

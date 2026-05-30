import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft, Save, Eye, EyeOff } from 'lucide-react-native';
import { AppStackParams } from '../../navigation/AppNavigator';
import { api, ApiError, SessionExpiredError } from '../../services/httpClient';

type Nav = NativeStackNavigationProp<AppStackParams>;

const C = {
  primary:    '#1565C0',
  primaryBg:  '#EBF5FC',
  headerBg:   '#1565C0',
  pageBg:     '#EEF2F7',
  surface:    '#FFFFFF',
  border:     '#E4EEF5',
  borderFocus:'#1565C0',
  text:       '#1A2340',
  textSub:    '#5E7A8A',
  textMuted:  '#8A9BB0',
  red:        '#C62828',
  redBg:      '#FFEBEE',
} as const;

interface FormState {
  senha_atual:    string;
  nova_senha:     string;
  confirmar_nova: string;
}

type FieldErrors = Partial<Record<keyof FormState | 'global', string>>;

function validate(f: FormState): FieldErrors {
  const e: FieldErrors = {};
  if (!f.senha_atual.trim())    e.senha_atual    = 'Campo obrigatório';
  if (!f.nova_senha.trim())     e.nova_senha     = 'Campo obrigatório';
  else if (f.nova_senha.length < 8) e.nova_senha = 'Mínimo 8 caracteres';
  if (!f.confirmar_nova.trim()) e.confirmar_nova = 'Campo obrigatório';
  else if (f.nova_senha !== f.confirmar_nova) e.confirmar_nova = 'As senhas não coincidem';
  return e;
}

// ─── PasswordField ────────────────────────────────────────────────────────────
function PasswordField({
  label, value, onChangeText, placeholder, error,
}: {
  label: string; value: string; onChangeText: (v: string) => void;
  placeholder?: string; error?: string;
}) {
  const [focused,  setFocused]  = useState(false);
  const [visible,  setVisible]  = useState(false);

  return (
    <View style={sf.fieldWrap}>
      <Text style={sf.label}>{label}</Text>
      <View style={[sf.inputWrap, focused && sf.inputWrapFocused, !!error && sf.inputWrapError]}>
        <TextInput
          style={sf.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={C.textMuted}
          secureTextEntry={!visible}
          autoCapitalize="none"
          autoCorrect={false}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        <TouchableOpacity
          onPress={() => setVisible(v => !v)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={sf.eyeBtn}
        >
          {visible
            ? <EyeOff size={18} color={C.textMuted} />
            : <Eye    size={18} color={C.textMuted} />}
        </TouchableOpacity>
      </View>
      {!!error && <Text style={sf.fieldError}>{error}</Text>}
    </View>
  );
}

// ─── TELA PRINCIPAL ──────────────────────────────────────────────────────────
export function AlterarSenhaScreen() {
  const navigation = useNavigation<Nav>();
  const [form,        setForm]        = useState<FormState>({ senha_atual: '', nova_senha: '', confirmar_nova: '' });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitting,  setSubmitting]  = useState(false);

  const setField = useCallback(<K extends keyof FormState>(key: K, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setFieldErrors(prev => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const handleSave = useCallback(async () => {
    const errors = validate(form);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);
    setFieldErrors({});
    try {
      await api.post('/api/v1/auth/change-password/', {
        senha_atual:    form.senha_atual,
        nova_senha:     form.nova_senha,
        confirmar_nova: form.confirmar_nova,
      });
      Alert.alert(
        'Senha alterada',
        'Sua senha foi atualizada com sucesso.',
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      );
    } catch (err) {
      if (err instanceof ApiError && err.errors) {
        const mapped: FieldErrors = {};
        for (const [field, msgs] of Object.entries(err.errors)) {
          (mapped as any)[field] = Array.isArray(msgs) ? msgs[0] : msgs;
        }
        setFieldErrors(mapped);
      } else if (err instanceof SessionExpiredError) {
        setFieldErrors({ global: 'Sessão expirada. Faça login novamente.' });
      } else {
        setFieldErrors({ global: (err as any)?.message ?? 'Erro ao alterar senha. Tente novamente.' });
      }
    } finally {
      setSubmitting(false);
    }
  }, [form, navigation]);

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={C.headerBg} />

      <View style={s.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={s.backBtn}
          activeOpacity={0.7}
          disabled={submitting}
        >
          <ArrowLeft size={22} color="rgba(255,255,255,0.9)" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Alterar Senha</Text>
          <Text style={s.headerSub}>Defina uma nova senha para sua conta</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {!!fieldErrors.global && (
            <View style={s.globalError}>
              <Text style={s.globalErrorText}>{fieldErrors.global}</Text>
            </View>
          )}

          <Text style={s.sectionTitle}>Senha atual</Text>
          <View style={s.card}>
            <PasswordField
              label="Senha atual"
              value={form.senha_atual}
              onChangeText={v => setField('senha_atual', v)}
              placeholder="Digite sua senha atual"
              error={fieldErrors.senha_atual}
            />
          </View>

          <Text style={s.sectionTitle}>Nova senha</Text>
          <View style={s.card}>
            <PasswordField
              label="Nova senha"
              value={form.nova_senha}
              onChangeText={v => setField('nova_senha', v)}
              placeholder="Mínimo 8 caracteres"
              error={fieldErrors.nova_senha}
            />
            <View style={s.fieldDivider} />
            <PasswordField
              label="Confirmar nova senha"
              value={form.confirmar_nova}
              onChangeText={v => setField('confirmar_nova', v)}
              placeholder="Repita a nova senha"
              error={fieldErrors.confirmar_nova}
            />
          </View>

          <View style={{ height: 88 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={s.footer}>
        <TouchableOpacity
          style={[s.submitBtn, submitting && { opacity: 0.65 }]}
          onPress={handleSave}
          activeOpacity={0.85}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Save size={18} color="#fff" />
              <Text style={s.submitText}>Salvar nova senha</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const sf = StyleSheet.create({
  fieldWrap:       { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10 },
  label:           { fontSize: 11, fontWeight: '700', color: C.textSub, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6 },
  inputWrap:       { flexDirection: 'row', alignItems: 'center', backgroundColor: C.pageBg, borderWidth: 1.5, borderColor: C.border, borderRadius: 10, paddingHorizontal: 14 },
  inputWrapFocused:{ borderColor: C.borderFocus, backgroundColor: '#F0F7FF' },
  inputWrapError:  { borderColor: C.red },
  input:           { flex: 1, fontSize: 15, color: C.text, paddingVertical: 11 },
  eyeBtn:          { paddingLeft: 8 },
  fieldError:      { fontSize: 12, color: C.red, marginTop: 4, marginLeft: 2 },
});

const s = StyleSheet.create({
  root:          { flex: 1, backgroundColor: C.pageBg },
  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 16 },

  header:      { backgroundColor: C.headerBg, flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 12, paddingTop: 16, paddingBottom: 32, borderBottomLeftRadius: 18, borderBottomRightRadius: 18 },
  backBtn:     { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', marginRight: 4 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff', marginBottom: 3 },
  headerSub:   { fontSize: 12, fontWeight: '500', color: 'rgba(255,255,255,0.75)' },

  globalError:     { backgroundColor: C.redBg, borderRadius: 12, padding: 14, marginBottom: 16, borderLeftWidth: 4, borderLeftColor: C.red },
  globalErrorText: { fontSize: 13, color: C.red, fontWeight: '500' },

  sectionTitle: { fontSize: 12, fontWeight: '700', color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8, marginLeft: 4 },
  card:         { backgroundColor: C.surface, borderRadius: 16, borderWidth: 1, borderColor: C.border, marginBottom: 20, overflow: 'hidden' },
  fieldDivider: { height: 1, backgroundColor: C.border, marginHorizontal: 16 },

  footer:    { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: C.surface, borderTopWidth: 1, borderTopColor: C.border, paddingHorizontal: 20, paddingTop: 12, paddingBottom: Platform.OS === 'ios' ? 32 : 16, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 16 },
  submitBtn: { backgroundColor: C.primary, borderRadius: 14, height: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 6 },
  submitText:{ fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: -0.2 },
});

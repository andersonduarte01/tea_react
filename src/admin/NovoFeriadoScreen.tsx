import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  StatusBar, ScrollView, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, CheckCircle2, Flag, Info } from 'lucide-react-native';
import { criarFeriado } from '../services/feriadoService';
import { ApiError } from '../services/httpClient';

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  primary:     '#1565C0',
  primaryBg:   '#EBF5FC',
  pageBg:      '#F0F4F8',
  surface:     '#FFFFFF',
  surfaceAlt:  '#F8FAFC',
  border:      '#E2E8F0',
  borderFocus: '#1565C0',
  text:        '#0F172A',
  textSub:     '#475569',
  textMuted:   '#94A3B8',
  red:         '#DC2626',
  redLight:    '#FEE2E2',
  redBorder:   '#FCA5A5',
  green:       '#16A34A',
  greenLight:  '#F0FDF4',
  greenBorder: '#86EFAC',
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function maskDate(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

function toISO(v: string): string {
  const d = v.replace(/\D/g, '');
  if (d.length !== 8) return '';
  const day = d.slice(0, 2);
  const mon = d.slice(2, 4);
  const yr  = d.slice(4);
  return `${yr}-${mon}-${day}`;
}

function isValidDate(v: string): boolean {
  const iso = toISO(v);
  if (!iso) return false;
  const date = new Date(iso + 'T00:00:00');
  return !isNaN(date.getTime());
}

// ─── Validação ────────────────────────────────────────────────────────────────
const INITIAL = { data: '', descricao: '' };

function validate(f: typeof INITIAL): Record<string, string> {
  const e: Record<string, string> = {};
  if (!f.data.trim())                            e.data     = 'Data é obrigatória.';
  else if (f.data.replace(/\D/g, '').length < 8) e.data     = 'Data incompleta.';
  else if (!isValidDate(f.data))                 e.data     = 'Data inválida.';
  if (!f.descricao.trim())                       e.descricao = 'Descrição é obrigatória.';
  return e;
}

// ─── InputField ───────────────────────────────────────────────────────────────
type InputFieldProps = {
  label:       string;
  value:       string;
  onChange:    (v: string) => void;
  placeholder: string;
  error?:      string;
  required?:   boolean;
  keyboard?:   React.ComponentProps<typeof TextInput>['keyboardType'];
  capitalize?: React.ComponentProps<typeof TextInput>['autoCapitalize'];
  maxLength?:  number;
};

function InputField({
  label, value, onChange, placeholder, error,
  required, keyboard = 'default', capitalize = 'sentences', maxLength,
}: InputFieldProps) {
  const [focused, setFocused] = useState(false);
  const hasValue = value.length > 0;

  return (
    <View style={fi.wrap}>
      <View style={fi.labelRow}>
        <Text style={fi.label}>
          {label}
          {required && <Text style={fi.asterisk}> *</Text>}
        </Text>
      </View>
      <View style={[
        fi.inputWrap,
        focused              && fi.inputWrapFocus,
        !!error              && fi.inputWrapError,
        hasValue && !focused && !error && fi.inputWrapFilled,
      ]}>
        <TextInput
          style={fi.input}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={C.textMuted}
          keyboardType={keyboard}
          autoCapitalize={capitalize}
          autoCorrect={false}
          maxLength={maxLength}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </View>
      {!!error && (
        <View style={fi.errorRow}>
          <View style={fi.errorDot} />
          <Text style={fi.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
}

const fi = StyleSheet.create({
  wrap:            { marginBottom: 18 },
  labelRow:        { flexDirection: 'row', alignItems: 'center', marginBottom: 7 },
  label:           { fontSize: 13, fontWeight: '600', color: C.textSub },
  asterisk:        { fontSize: 13, fontWeight: '700', color: C.red },
  inputWrap:       { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surfaceAlt, borderWidth: 1.5, borderColor: C.border, borderRadius: 12, overflow: 'hidden' },
  inputWrapFocus:  { borderColor: C.borderFocus, backgroundColor: '#F0F7FF', shadowColor: C.primary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.12, shadowRadius: 6, elevation: 2 },
  inputWrapError:  { borderColor: C.redBorder, backgroundColor: C.redLight },
  inputWrapFilled: { borderColor: '#CBD5E1', backgroundColor: C.surface },
  input:           { flex: 1, height: 50, paddingHorizontal: 14, fontSize: 15, color: C.text, fontWeight: '500' },
  errorRow:        { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 5 },
  errorDot:        { width: 5, height: 5, borderRadius: 3, backgroundColor: C.red },
  errorText:       { fontSize: 12, color: C.red, fontWeight: '500', flex: 1 },
});

// ─── Toggle ativo ─────────────────────────────────────────────────────────────
function AtivoToggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={tg.wrap}>
      <View style={tg.labelCol}>
        <Text style={tg.label}>Feriado ativo</Text>
        <Text style={tg.sub}>
          {value
            ? 'Agendamentos bloqueados nesta data'
            : 'Data liberada para agendamentos'}
        </Text>
      </View>
      <TouchableOpacity
        style={[tg.track, value && tg.trackOn]}
        onPress={() => onChange(!value)}
        activeOpacity={0.8}
      >
        <View style={[tg.thumb, value && tg.thumbOn]} />
      </TouchableOpacity>
    </View>
  );
}

const tg = StyleSheet.create({
  wrap:     { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surfaceAlt, borderWidth: 1.5, borderColor: C.border, borderRadius: 12, padding: 14, marginBottom: 18 },
  labelCol: { flex: 1 },
  label:    { fontSize: 14, fontWeight: '600', color: C.text, marginBottom: 3 },
  sub:      { fontSize: 12, color: C.textMuted },
  track:    { width: 48, height: 28, borderRadius: 14, backgroundColor: C.border, justifyContent: 'center', paddingHorizontal: 3 },
  trackOn:  { backgroundColor: C.primary },
  thumb:    { width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.18, shadowRadius: 3, elevation: 3 },
  thumbOn:  { alignSelf: 'flex-end' },
});

// ─── TELA ─────────────────────────────────────────────────────────────────────
export function NovoFeriadoScreen() {
  const navigation                = useNavigation();
  const [form, setForm]           = useState(INITIAL);
  const [ativo, setAtivo]         = useState(true);
  const [errors, setErrors]       = useState<Record<string, string>>({});
  const [loading, setLoading]     = useState(false);

  const set = useCallback((k: keyof typeof INITIAL, v: string) => {
    setForm(p => ({ ...p, [k]: v }));
    setErrors(p => { const n = { ...p }; delete n[k]; return n; });
  }, []);

  const handleSubmit = useCallback(async () => {
    const errs = validate(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      await criarFeriado({
        data:      toISO(form.data),
        descricao: form.descricao.trim(),
        ativo,
      });

      Alert.alert(
        'Feriado cadastrado',
        `"${form.descricao.trim()}" foi registrado com sucesso.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }],
        { cancelable: false },
      );
    } catch (err: unknown) {
      if (err instanceof ApiError && err.errors) {
        const mapped: Record<string, string> = {};
        Object.entries(err.errors).forEach(([k, msgs]) => { mapped[k] = msgs[0]; });
        setErrors(mapped);
      } else {
        Alert.alert(
          'Erro ao cadastrar',
          err instanceof ApiError ? err.message : 'Verifique sua conexão e tente novamente.',
        );
      }
    } finally {
      setLoading(false);
    }
  }, [form, ativo, navigation]);

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={C.primary} />

      {/* ── Header ── */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} activeOpacity={0.7}>
          <ArrowLeft size={22} color="rgba(255,255,255,0.9)" />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Flag size={18} color="rgba(255,255,255,0.85)" />
          <Text style={s.headerTitle}>Novo Feriado</Text>
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Info ── */}
          <View style={s.infoBanner}>
            <Info size={16} color={C.primary} style={{ flexShrink: 0, marginTop: 1 }} />
            <Text style={s.infoText}>
              Ao cadastrar um feriado local, novos agendamentos serão bloqueados para essa data automaticamente.
            </Text>
          </View>

          {/* ── Formulário ── */}
          <View style={s.card}>
            <InputField
              label="Data do feriado" required
              value={form.data}
              onChange={v => set('data', maskDate(v))}
              placeholder="DD/MM/AAAA"
              error={errors.data}
              keyboard="numeric"
              capitalize="none"
              maxLength={10}
            />

            <InputField
              label="Descrição" required
              value={form.descricao}
              onChange={v => set('descricao', v)}
              placeholder="Ex: Natal, Carnaval, Feriado Municipal"
              error={errors.descricao}
              capitalize="sentences"
            />

            <AtivoToggle value={ativo} onChange={setAtivo} />
          </View>

          <View style={{ height: 110 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Rodapé fixo ── */}
      <View style={s.footer}>
        <TouchableOpacity
          style={[s.submitBtn, loading && { opacity: 0.65 }]}
          onPress={handleSubmit}
          activeOpacity={0.85}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <CheckCircle2 size={18} color="#fff" />
              <Text style={s.submitText}>Cadastrar feriado</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.pageBg },

  header:       { backgroundColor: C.primary, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: 16, paddingBottom: 32, borderBottomLeftRadius: 18, borderBottomRightRadius: 18, gap: 8 },
  backBtn:      { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle:  { fontSize: 21, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },

  infoBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: C.primaryBg, borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#BFDBFE' },
  infoText:   { flex: 1, fontSize: 13, color: C.primary, lineHeight: 19, fontWeight: '500' },

  scroll: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 },

  card: { backgroundColor: C.surface, borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },

  footer:     { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: C.surface, borderTopWidth: 1, borderTopColor: C.border, paddingHorizontal: 20, paddingTop: 12, paddingBottom: Platform.OS === 'ios' ? 32 : 16, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 16 },
  submitBtn:  { backgroundColor: C.primary, borderRadius: 14, height: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 6 },
  submitText: { fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: -0.2 },
});

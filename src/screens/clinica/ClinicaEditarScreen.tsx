import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  TextInputProps,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft, Save } from 'lucide-react-native';
import { AppStackParams } from '../../navigation/AppNavigator';
import { useClinica } from '../../hooks/useClinica';
import { patchClinica } from '../../services/dashboardService';
import { ApiError } from '../../services/httpClient';

type Nav = NativeStackNavigationProp<AppStackParams>;

// ─── Paleta ───────────────────────────────────────────────────────────────────
const C = {
  primary:   '#1565C0',
  primaryBg: '#EBF5FC',
  headerBg:  '#1565C0',
  pageBg:    '#EEF2F7',
  surface:   '#FFFFFF',
  border:    '#E4EEF5',
  borderFocus:'#1565C0',
  text:      '#1A2340',
  textSub:   '#5E7A8A',
  textMuted: '#8A9BB0',
  red:       '#C62828',
  redBg:     '#FFEBEE',
  disabled:  '#B0BEC5',
} as const;

// ─── Tipos de formulário ──────────────────────────────────────────────────────
interface FormState {
  nome:         string;
  telefone:     string;
  email:        string;
  logradouro:   string;
  numero:       string;
  complemento:  string;
  bairro:       string;
  cidade:       string;
  estado:       string;
  cep:          string;
}

type FieldErrors = Partial<Record<keyof FormState | 'global', string>>;

function initialForm(): FormState {
  return {
    nome: '', telefone: '', email: '',
    logradouro: '', numero: '', complemento: '',
    bairro: '', cidade: '', estado: '', cep: '',
  };
}

// ─── Validação local ──────────────────────────────────────────────────────────
function validate(f: FormState): FieldErrors {
  const e: FieldErrors = {};
  if (!f.nome.trim()) e.nome = 'Nome é obrigatório';
  if (f.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim()))
    e.email = 'E-mail inválido';
  if (f.estado.trim() && f.estado.trim().length !== 2)
    e.estado = 'Use a sigla do estado (ex: CE)';
  const cepDigits = f.cep.replace(/\D/g, '');
  if (cepDigits && cepDigits.length !== 8)
    e.cep = 'CEP deve ter 8 dígitos';
  return e;
}

// ─── FormField ────────────────────────────────────────────────────────────────
interface FormFieldProps {
  label:           string;
  value:           string;
  onChangeText:    (v: string) => void;
  placeholder?:    string;
  keyboardType?:   TextInputProps['keyboardType'];
  autoCapitalize?: TextInputProps['autoCapitalize'];
  maxLength?:      number;
  error?:          string;
  flex?:           number;
}

function FormField({
  label, value, onChangeText, placeholder,
  keyboardType = 'default', autoCapitalize = 'sentences',
  maxLength, error, flex,
}: FormFieldProps) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[sf.fieldWrap, flex !== undefined && { flex }]}>
      <Text style={sf.label}>{label}</Text>
      <TextInput
        style={[sf.input, focused && sf.inputFocused, !!error && sf.inputError]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={C.textMuted}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        maxLength={maxLength}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      {!!error && <Text style={sf.fieldError}>{error}</Text>}
    </View>
  );
}

// ─── TELA PRINCIPAL ──────────────────────────────────────────────────────────
export function ClinicaEditarScreen() {
  const navigation = useNavigation<Nav>();
  const { clinica, loading: loadingData } = useClinica();

  const [form,        setForm]        = useState<FormState>(initialForm());
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitting,  setSubmitting]  = useState(false);
  const populated = useRef(false);

  // Popula o form uma única vez quando os dados chegam
  useEffect(() => {
    if (!clinica || populated.current) return;
    populated.current = true;
    const end = clinica.endereco;
    setForm({
      nome:        clinica.nome          ?? '',
      telefone:    clinica.telefone      ?? '',
      email:       clinica.email         ?? '',
      logradouro:  end?.logradouro       ?? '',
      numero:      end?.numero           ?? '',
      complemento: end?.complemento      ?? '',
      bairro:      end?.bairro           ?? '',
      cidade:      end?.cidade           ?? '',
      estado:      end?.estado           ?? '',
      cep:         end?.cep              ?? '',
    });
  }, [clinica]);

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
      await patchClinica({
        nome:     form.nome.trim(),
        telefone: form.telefone.trim() || null,
        email:    form.email.trim()    || null,
        endereco: {
          logradouro:  form.logradouro.trim()  || undefined,
          numero:      form.numero.trim()      || undefined,
          complemento: form.complemento.trim() || null,
          bairro:      form.bairro.trim()      || undefined,
          cidade:      form.cidade.trim()      || undefined,
          estado:      form.estado.trim().toUpperCase() || undefined,
          cep:         form.cep.replace(/\D/g, '') || undefined,
        },
      });
      navigation.navigate('AdminDashboard');
    } catch (err) {
      if (err instanceof ApiError && err.errors) {
        const mapped: FieldErrors = {};
        for (const [field, msgs] of Object.entries(err.errors)) {
          (mapped as any)[field] = Array.isArray(msgs) ? msgs[0] : msgs;
        }
        setFieldErrors(mapped);
      } else {
        setFieldErrors({ global: err instanceof Error ? err.message : 'Erro ao salvar. Tente novamente.' });
      }
    } finally {
      setSubmitting(false);
    }
  }, [form, navigation]);

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={C.headerBg} />

      {/* Header — mesmo padrão do AdminDashboard */}
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
          <Text style={s.headerTitle}>Editar Clínica</Text>
          <Text style={s.headerSub}>Atualize os dados da clínica</Text>
        </View>
      </View>

      {/* Loading inicial */}
      {loadingData && (
        <View style={s.center}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={s.loadingText}>Carregando dados...</Text>
        </View>
      )}

      {!loadingData && (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
        >
          <ScrollView
            style={s.scroll}
            contentContainerStyle={s.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Erro global da API */}
            {!!fieldErrors.global && (
              <View style={s.globalError}>
                <Text style={s.globalErrorText}>{fieldErrors.global}</Text>
              </View>
            )}

            {/* Seção: Informações gerais */}
            <Text style={s.sectionTitle}>Informações gerais</Text>
            <View style={s.card}>
              <FormField
                label="Nome da Clínica *"
                value={form.nome}
                onChangeText={v => setField('nome', v)}
                placeholder="Nome da clínica"
                error={fieldErrors.nome}
              />
              <View style={s.fieldDivider} />
              <FormField
                label="Telefone"
                value={form.telefone}
                onChangeText={v => setField('telefone', v)}
                placeholder="(00) 00000-0000"
                keyboardType="phone-pad"
                maxLength={15}
                error={fieldErrors.telefone}
              />
              <View style={s.fieldDivider} />
              <FormField
                label="E-mail"
                value={form.email}
                onChangeText={v => setField('email', v)}
                placeholder="contato@clinica.com"
                keyboardType="email-address"
                autoCapitalize="none"
                error={fieldErrors.email}
              />
            </View>

            {/* Seção: Endereço */}
            <Text style={s.sectionTitle}>Endereço</Text>
            <View style={s.card}>
              <FormField
                label="Logradouro"
                value={form.logradouro}
                onChangeText={v => setField('logradouro', v)}
                placeholder="Rua, Avenida..."
                error={fieldErrors.logradouro}
              />
              <View style={s.fieldDivider} />
              <View style={s.row}>
                <FormField
                  label="Número"
                  value={form.numero}
                  onChangeText={v => setField('numero', v)}
                  placeholder="Nº"
                  keyboardType="numeric"
                  maxLength={10}
                  error={fieldErrors.numero}
                  flex={1}
                />
                <View style={s.rowGap} />
                <FormField
                  label="Complemento"
                  value={form.complemento}
                  onChangeText={v => setField('complemento', v)}
                  placeholder="Apto, Sala..."
                  error={fieldErrors.complemento}
                  flex={2}
                />
              </View>
              <View style={s.fieldDivider} />
              <FormField
                label="Bairro"
                value={form.bairro}
                onChangeText={v => setField('bairro', v)}
                placeholder="Bairro"
                error={fieldErrors.bairro}
              />
              <View style={s.fieldDivider} />
              <View style={s.row}>
                <FormField
                  label="Cidade"
                  value={form.cidade}
                  onChangeText={v => setField('cidade', v)}
                  placeholder="Cidade"
                  error={fieldErrors.cidade}
                  flex={3}
                />
                <View style={s.rowGap} />
                <FormField
                  label="UF"
                  value={form.estado}
                  onChangeText={v => setField('estado', v.toUpperCase())}
                  placeholder="CE"
                  autoCapitalize="characters"
                  maxLength={2}
                  error={fieldErrors.estado}
                  flex={1}
                />
              </View>
              <View style={s.fieldDivider} />
              <FormField
                label="CEP"
                value={form.cep}
                onChangeText={v => setField('cep', v)}
                placeholder="00000-000"
                keyboardType="numeric"
                maxLength={9}
                error={fieldErrors.cep}
              />
            </View>

            {/* Botão salvar */}
            <TouchableOpacity
              style={[s.saveBtn, submitting && s.saveBtnDisabled]}
              onPress={handleSave}
              activeOpacity={0.85}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Save size={18} color="#fff" />
                  <Text style={s.saveBtnText}>Salvar alterações</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

// ─── Styles do FormField ──────────────────────────────────────────────────────
const sf = StyleSheet.create({
  fieldWrap:   { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10 },
  label:       { fontSize: 11, fontWeight: '700', color: C.textSub, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6 },
  input:       { backgroundColor: C.pageBg, borderWidth: 1.5, borderColor: C.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, color: C.text },
  inputFocused:{ borderColor: C.borderFocus, backgroundColor: '#F0F7FF' },
  inputError:  { borderColor: C.red },
  fieldError:  { fontSize: 12, color: C.red, marginTop: 4, marginLeft: 2 },
});

// ─── Styles da tela ───────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: C.pageBg },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 16 },

  header:      { backgroundColor: C.headerBg, flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 12, paddingTop: 16, paddingBottom: 32, borderBottomLeftRadius: 18, borderBottomRightRadius: 18 },
  backBtn:     { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', marginRight: 4 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff', marginBottom: 3 },
  headerSub:   { fontSize: 12, fontWeight: '500', color: 'rgba(255,255,255,0.75)' },

  center:      { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  loadingText: { marginTop: 12, fontSize: 14, color: C.textMuted },

  globalError:     { backgroundColor: C.redBg, borderRadius: 12, padding: 14, marginBottom: 16, borderLeftWidth: 4, borderLeftColor: C.red },
  globalErrorText: { fontSize: 13, color: C.red, fontWeight: '500' },

  sectionTitle: { fontSize: 12, fontWeight: '700', color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8, marginLeft: 4 },

  card:        { backgroundColor: C.surface, borderRadius: 16, borderWidth: 1, borderColor: C.border, marginBottom: 20, overflow: 'hidden' },
  fieldDivider:{ height: 1, backgroundColor: C.border, marginHorizontal: 16 },

  row:    { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10, gap: 12 },
  rowGap: { width: 0 },

  saveBtn:         { backgroundColor: C.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: 14, marginBottom: 8, shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  saveBtnDisabled: { backgroundColor: C.disabled, shadowOpacity: 0, elevation: 0 },
  saveBtnText:     { fontSize: 16, fontWeight: '700', color: '#fff' },
});

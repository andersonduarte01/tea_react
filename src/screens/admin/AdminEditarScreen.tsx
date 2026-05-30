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
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft, Save } from 'lucide-react-native';
import { AppStackParams } from '../../navigation/AppNavigator';
import { api, SessionExpiredError, ApiError } from '../../services/httpClient';

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
  disabled:   '#B0BEC5',
} as const;

interface FormState {
  telefone:        string;
  data_nascimento: string;
  logradouro:      string;
  numero:          string;
  complemento:     string;
  bairro:          string;
  cidade:          string;
  estado:          string;
  cep:             string;
}

type FieldErrors = Partial<Record<keyof FormState | 'global', string>>;

function initialForm(): FormState {
  return {
    telefone: '', data_nascimento: '',
    logradouro: '', numero: '', complemento: '',
    bairro: '', cidade: '', estado: '', cep: '',
  };
}

function validate(f: FormState): FieldErrors {
  const e: FieldErrors = {};
  if (f.data_nascimento.trim()) {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(f.data_nascimento.trim()))
      e.data_nascimento = 'Use o formato AAAA-MM-DD';
  }
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
}

function FormField({
  label, value, onChangeText, placeholder,
  keyboardType = 'default', autoCapitalize = 'sentences',
  maxLength, error,
}: FormFieldProps) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={sf.fieldWrap}>
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
export function AdminEditarScreen() {
  const navigation = useNavigation<Nav>();
  const [form,        setForm]        = useState<FormState>(initialForm());
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [loading,     setLoading]     = useState(true);
  const [submitting,  setSubmitting]  = useState(false);
  const populated = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.get<any>('/api/v1/admin/perfil/');
        if (populated.current) return;
        populated.current = true;
        const end = data.endereco;
        setForm({
          telefone:        data.telefone        ?? '',
          data_nascimento: data.data_nascimento  ?? '',
          logradouro:      end?.logradouro       ?? '',
          numero:          end?.numero           ?? '',
          complemento:     end?.complemento      ?? '',
          bairro:          end?.bairro           ?? '',
          cidade:          end?.cidade           ?? '',
          estado:          end?.estado           ?? '',
          cep:             end?.cep              ?? '',
        });
      } catch {
        // se falhar, mantém form vazio
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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

    const hasEndereco = [
      form.logradouro, form.numero, form.bairro, form.cidade, form.estado, form.cep,
    ].some(v => v.trim());

    try {
      await api.patch('/api/v1/admin/perfil/', {
        telefone:        form.telefone.trim()        || null,
        data_nascimento: form.data_nascimento.trim()  || null,
        ...(hasEndereco && {
          endereco: {
            logradouro:  form.logradouro.trim()  || undefined,
            numero:      form.numero.trim()      || undefined,
            complemento: form.complemento.trim() || null,
            bairro:      form.bairro.trim()      || undefined,
            cidade:      form.cidade.trim()      || undefined,
            estado:      form.estado.trim().toUpperCase() || undefined,
            cep:         form.cep.replace(/\D/g, '') || undefined,
          },
        }),
      });
      Alert.alert(
        'Alterações salvas',
        'Seu perfil foi atualizado com sucesso.',
        [{ text: 'OK', onPress: () => navigation.navigate('AdminPerfil') }],
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
        setFieldErrors({ global: (err as any)?.message ?? 'Erro ao salvar. Tente novamente.' });
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
          <Text style={s.headerTitle}>Editar Perfil</Text>
          <Text style={s.headerSub}>Atualize seus dados pessoais</Text>
        </View>
      </View>

      {loading && (
        <View style={s.center}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={s.loadingText}>Carregando dados...</Text>
        </View>
      )}

      {!loading && (
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

            <Text style={s.sectionTitle}>Dados pessoais</Text>
            <View style={s.card}>
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
                label="Data de nascimento"
                value={form.data_nascimento}
                onChangeText={v => setField('data_nascimento', v)}
                placeholder="AAAA-MM-DD"
                keyboardType="numeric"
                maxLength={10}
                error={fieldErrors.data_nascimento}
              />
            </View>

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
              <FormField
                label="Número"
                value={form.numero}
                onChangeText={v => setField('numero', v)}
                placeholder="Nº"
                keyboardType="numeric"
                maxLength={10}
                error={fieldErrors.numero}
              />
              <View style={s.fieldDivider} />
              <FormField
                label="Complemento"
                value={form.complemento}
                onChangeText={v => setField('complemento', v)}
                placeholder="Apto, Sala..."
                error={fieldErrors.complemento}
              />
              <View style={s.fieldDivider} />
              <FormField
                label="Bairro"
                value={form.bairro}
                onChangeText={v => setField('bairro', v)}
                placeholder="Bairro"
                error={fieldErrors.bairro}
              />
              <View style={s.fieldDivider} />
              <FormField
                label="Cidade"
                value={form.cidade}
                onChangeText={v => setField('cidade', v)}
                placeholder="Cidade"
                error={fieldErrors.cidade}
              />
              <View style={s.fieldDivider} />
              <FormField
                label="UF"
                value={form.estado}
                onChangeText={v => setField('estado', v.toUpperCase())}
                placeholder="CE"
                autoCapitalize="characters"
                maxLength={2}
                error={fieldErrors.estado}
              />
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

            <View style={{ height: 88 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      {!loading && (
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
                <Text style={s.submitText}>Salvar alterações</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const sf = StyleSheet.create({
  fieldWrap:   { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10 },
  label:       { fontSize: 11, fontWeight: '700', color: C.textSub, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6 },
  input:       { backgroundColor: C.pageBg, borderWidth: 1.5, borderColor: C.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, color: C.text },
  inputFocused:{ borderColor: C.borderFocus, backgroundColor: '#F0F7FF' },
  inputError:  { borderColor: C.red },
  fieldError:  { fontSize: 12, color: C.red, marginTop: 4, marginLeft: 2 },
});

const s = StyleSheet.create({
  root:          { flex: 1, backgroundColor: C.pageBg },
  scroll:        { flex: 1 },
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
  card:         { backgroundColor: C.surface, borderRadius: 16, borderWidth: 1, borderColor: C.border, marginBottom: 20, overflow: 'hidden' },
  fieldDivider: { height: 1, backgroundColor: C.border, marginHorizontal: 16 },

  footer:    { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: C.surface, borderTopWidth: 1, borderTopColor: C.border, paddingHorizontal: 20, paddingTop: 12, paddingBottom: Platform.OS === 'ios' ? 32 : 16, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 16 },
  submitBtn: { backgroundColor: C.primary, borderRadius: 14, height: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 6 },
  submitText:{ fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: -0.2 },
});

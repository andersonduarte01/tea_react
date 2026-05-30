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
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft, Save, Camera } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { launchImageLibrary } from 'react-native-image-picker';
import { AppStackParams } from '../../navigation/AppNavigator';
import { useClinica } from '../../hooks/useClinica';
import { patchClinica } from '../../services/dashboardService';
import { api, ApiError, SessionExpiredError, STORAGE, getBaseUrl } from '../../services/httpClient';

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

// ─── Helpers ──────────────────────────────────────────────────────────────────
function resolveUri(url: string | null): string | null {
  if (!url) return null;
  const u = url.trim();
  if (u.startsWith('http')) return u;
  const base = getBaseUrl().replace(/\/$/, '');
  return `${base}${u.startsWith('/') ? u : `/${u}`}`;
}

// ─── ClinicaPhoto ─────────────────────────────────────────────────────────────
function ClinicaPhoto({ fotoUrl, localUri, nome }: { fotoUrl: string | null; localUri: string | null; nome: string }) {
  const [dataUri, setDataUri] = useState<string | null>(null);

  useEffect(() => {
    if (localUri || !fotoUrl) { setDataUri(null); return; }
    const resolved = resolveUri(fotoUrl);
    if (!resolved) return;
    let cancelled = false;
    (async () => {
      try {
        const token = await AsyncStorage.getItem(STORAGE.ACCESS);
        if (!token || cancelled) return;
        const res = await fetch(resolved, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok || cancelled) return;
        const blob = await res.blob();
        if (cancelled) return;
        const reader = new FileReader();
        reader.onloadend = () => {
          if (!cancelled && typeof reader.result === 'string') setDataUri(reader.result);
        };
        reader.readAsDataURL(blob);
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [fotoUrl, localUri]);

  const uri = localUri ?? dataUri;
  const initials = nome.split(' ').filter(w => w.length > 1).slice(0, 2).map(w => w[0].toUpperCase()).join('');
  return uri
    ? <Image source={{ uri }} style={cp.photoImg} />
    : (
      <View style={cp.photoPlaceholder}>
        <Text style={cp.photoInitials}>{initials || '🏥'}</Text>
      </View>
    );
}

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

  const [form,          setForm]          = useState<FormState>(initialForm());
  const [fieldErrors,   setFieldErrors]   = useState<FieldErrors>({});
  const [submitting,    setSubmitting]    = useState(false);
  const [localPhotoUri, setLocalPhotoUri] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
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

  const uploadFoto = async (uri: string) => {
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('foto', { uri, name: 'foto.jpg', type: 'image/jpeg' } as any);
      await api.patchMultipart('/api/v1/clinica/foto/', formData);
      setLocalPhotoUri(uri);
      Alert.alert('Foto atualizada', 'A foto da clínica foi atualizada com sucesso.');
    } catch (err) {
      if (err instanceof SessionExpiredError) {
        setFieldErrors({ global: 'Sessão expirada. Faça login novamente.' });
      } else {
        Alert.alert('Erro', 'Não foi possível atualizar a foto. Tente novamente.');
      }
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handlePickPhoto = async () => {
    const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8, maxWidth: 800, maxHeight: 800 });
    if (result.didCancel || result.errorCode) return;
    const asset = result.assets?.[0];
    if (!asset?.uri) return;
    uploadFoto(asset.uri);
  };

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
      Alert.alert(
        'Alterações salvas',
        'Os dados da clínica foram atualizados com sucesso.',
        [{ text: 'OK', onPress: () => navigation.navigate('ClinicaPerfil') }],
      );
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

            {/* Seção: Foto da clínica */}
            <Text style={s.sectionTitle}>Foto da clínica</Text>
            <View style={[s.card, cp.photoCard]}>
              <TouchableOpacity
                style={cp.photoBtnWrap}
                activeOpacity={0.85}
                onPress={handlePickPhoto}
                disabled={uploadingPhoto}
              >
                <View style={cp.photoRing}>
                  <ClinicaPhoto
                    fotoUrl={clinica?.foto ?? null}
                    localUri={localPhotoUri}
                    nome={clinica?.nome ?? ''}
                  />
                  {uploadingPhoto ? (
                    <View style={cp.photoOverlay}>
                      <ActivityIndicator color="#fff" size="small" />
                    </View>
                  ) : (
                    <View style={cp.cameraBadge}>
                      <Camera size={14} color="#fff" />
                    </View>
                  )}
                </View>
              </TouchableOpacity>
              <Text style={cp.photoHint}>Toque para alterar a foto</Text>
            </View>

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

      {!loadingData && (
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

// ─── Styles da foto da clínica ───────────────────────────────────────────────
const cp = StyleSheet.create({
  photoCard:        { alignItems: 'center', paddingVertical: 24, marginBottom: 20 },
  photoBtnWrap:     { alignItems: 'center' },
  photoRing:        { width: 104, height: 104, borderRadius: 52, borderWidth: 3, borderColor: C.primary, alignItems: 'center', justifyContent: 'center', backgroundColor: C.primaryBg },
  photoImg:         { width: 96, height: 96, borderRadius: 48 },
  photoPlaceholder: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center' },
  photoInitials:    { fontSize: 28, fontWeight: '800', color: C.primary },
  photoOverlay:     { position: 'absolute', width: 96, height: 96, borderRadius: 48, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  cameraBadge:      { position: 'absolute', bottom: 2, right: 2, width: 28, height: 28, borderRadius: 14, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2.5, borderColor: '#fff' },
  photoHint:        { marginTop: 10, fontSize: 12, color: C.textMuted, fontWeight: '500' },
});

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

  footer:     { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: C.surface, borderTopWidth: 1, borderTopColor: C.border, paddingHorizontal: 20, paddingTop: 12, paddingBottom: Platform.OS === 'ios' ? 32 : 16, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 16 },
  submitBtn:  { backgroundColor: C.primary, borderRadius: 14, height: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 6 },
  submitText: { fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: -0.2 },
});

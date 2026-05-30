import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft, Save, Camera } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { launchImageLibrary } from 'react-native-image-picker';
import { api, ApiError, SessionExpiredError, STORAGE, getBaseUrl } from '../../services/httpClient';
import { AppStackParams } from '../../navigation/AppNavigator';

type Nav   = NativeStackNavigationProp<AppStackParams>;
type Route = RouteProp<AppStackParams, 'ProfissionalEditar'>;

const C = {
  primary:   '#1565C0',
  primaryBg: '#EBF5FC',
  headerBg:  '#1565C0',
  pageBg:    '#EEF2F7',
  surface:   '#FFFFFF',
  border:    '#E4EEF5',
  text:      '#1A2340',
  textSub:   '#5E7A8A',
  textMuted: '#8A9BB0',
  error:     '#C62828',
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getInitials(name: string): string {
  return name.split(' ').filter(w => w.length > 1).slice(0, 2).map(w => w[0].toUpperCase()).join('');
}

function resolveUri(url: string | null): string | null {
  if (!url) return null;
  const u = url.trim();
  if (u.startsWith('http')) return u;
  const base = getBaseUrl().replace(/\/$/, '');
  return `${base}${u.startsWith('/') ? u : `/${u}`}`;
}

// ─── AuthPhoto ────────────────────────────────────────────────────────────────
function AuthPhoto({ name, serverUri, localUri }: { name: string; serverUri: string | null; localUri: string | null }) {
  const [dataUri, setDataUri] = useState<string | null>(null);

  useEffect(() => {
    if (localUri || !serverUri) { setDataUri(null); return; }
    const resolved = resolveUri(serverUri);
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
  }, [serverUri, localUri]);

  const uri = localUri ?? dataUri;
  if (uri) return <Image source={{ uri }} style={ps.photoImg} />;
  return (
    <View style={ps.photoPlaceholder}>
      <Text style={ps.photoInitials}>{getInitials(name)}</Text>
    </View>
  );
}

// ─── Form types ───────────────────────────────────────────────────────────────
interface ProfForm {
  telefone:        string;
  data_nascimento: string;
  funcao:          string;
  logradouro:      string;
  numero:          string;
  complemento:     string;
  bairro:          string;
  cidade:          string;
  estado:          string;
  cep:             string;
}

interface FieldErrors { [key: string]: string }

function Field({
  label, value, onChange, placeholder, keyboardType, maxLength, error,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; keyboardType?: 'default' | 'numeric' | 'phone-pad' | 'email-address';
  maxLength?: number; error?: string;
}) {
  return (
    <View style={s.fieldWrap}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        style={[s.input, !!error && s.inputError]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={C.textMuted}
        keyboardType={keyboardType ?? 'default'}
        maxLength={maxLength}
        autoCapitalize="sentences"
      />
      {!!error && <Text style={s.fieldError}>{error}</Text>}
    </View>
  );
}

function DateField({ label, value, onChange, error }: {
  label: string; value: string; onChange: (v: string) => void; error?: string;
}) {
  const applyMask = (raw: string) => {
    const d = raw.replace(/\D/g, '').slice(0, 8);
    if (d.length <= 2) return d;
    if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
    return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
  };
  return (
    <View style={s.fieldWrap}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        style={[s.input, !!error && s.inputError]}
        value={value}
        onChangeText={v => onChange(applyMask(v))}
        placeholder="DD/MM/AAAA"
        placeholderTextColor={C.textMuted}
        keyboardType="numeric"
        maxLength={10}
        autoCapitalize="none"
      />
      {!!error && <Text style={s.fieldError}>{error}</Text>}
    </View>
  );
}

function isoToDisplay(iso: string): string {
  if (!iso) return '';
  const d = iso.slice(0, 10);
  const [y, m, day] = d.split('-');
  if (!y || !m || !day) return '';
  return `${day}/${m}/${y}`;
}

function displayToIso(display: string): string {
  const d = display.replace(/\D/g, '');
  if (d.length !== 8) return '';
  return `${d.slice(4)}-${d.slice(2, 4)}-${d.slice(0, 2)}`;
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export function ProfissionalEditarScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();

  const [loading,       setLoading]       = useState(true);
  const [saving,        setSaving]        = useState(false);
  const [erro,          setErro]          = useState<string | null>(null);
  const [fieldErr,      setFieldErr]      = useState<FieldErrors>({});
  const [nomeDisplay,   setNomeDisplay]   = useState('');
  const [serverPhotoUrl, setServerPhotoUrl] = useState<string | null>(null);
  const [localPhotoUri, setLocalPhotoUri] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [form, setForm] = useState<ProfForm>({
    telefone: '', data_nascimento: '', funcao: '',
    logradouro: '', numero: '', complemento: '',
    bairro: '', cidade: '', estado: '', cep: '',
  });

  const set = (key: keyof ProfForm) => (v: string) =>
    setForm(f => ({ ...f, [key]: v }));

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      const data = await api.get<any>(`/api/v1/profissional/${params.id}/`);
      setNomeDisplay(data.nome ?? '');
      setServerPhotoUrl(data.foto_url ?? null);
      setForm({
        telefone:        data.telefone        ?? '',
        data_nascimento: isoToDisplay(data.data_nascimento ?? ''),
        funcao:          data.funcao          ?? '',
        logradouro:      data.endereco?.logradouro  ?? '',
        numero:          data.endereco?.numero      ?? '',
        complemento:     data.endereco?.complemento ?? '',
        bairro:          data.endereco?.bairro      ?? '',
        cidade:          data.endereco?.cidade      ?? '',
        estado:          data.endereco?.estado      ?? '',
        cep:             data.endereco?.cep         ?? '',
      });
    } catch (err) {
      setErro((err as any)?.message ?? 'Erro ao carregar dados.');
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => { carregar(); }, [carregar]);

  const uploadFoto = async (uri: string) => {
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('foto', { uri, name: 'foto.jpg', type: 'image/jpeg' } as any);
      await api.patchMultipart(`/api/v1/profissional/${params.id}/foto/`, formData);
      setLocalPhotoUri(uri);
      Alert.alert('Foto atualizada', 'A foto do profissional foi atualizada com sucesso.');
    } catch (err) {
      if (err instanceof SessionExpiredError) {
        setErro('Sessão expirada. Faça login novamente.');
      } else if (err instanceof ApiError && err.errors?.foto) {
        Alert.alert('Erro', err.errors.foto[0]);
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

  const handleSave = async () => {
    setFieldErr({});
    const body: any = {};
    if (form.telefone.trim())        body.telefone        = form.telefone.trim();
    const isoDate = displayToIso(form.data_nascimento);
    if (isoDate) body.data_nascimento = isoDate;
    if (form.funcao.trim())          body.funcao          = form.funcao.trim();

    const hasEnd = [form.logradouro, form.bairro, form.cidade, form.estado, form.cep]
      .some(v => v.trim());
    if (hasEnd) {
      body.endereco = {
        logradouro:  form.logradouro.trim()  || undefined,
        numero:      form.numero.trim()      || undefined,
        complemento: form.complemento.trim() || undefined,
        bairro:      form.bairro.trim()      || undefined,
        cidade:      form.cidade.trim()      || undefined,
        estado:      form.estado.trim()      || undefined,
        cep:         form.cep.trim()         || undefined,
      };
    }

    setSaving(true);
    try {
      await api.patch(`/api/v1/profissional/${params.id}/`, body);
      Alert.alert('Sucesso', 'Informações atualizadas com sucesso.', [
        { text: 'OK', onPress: () => navigation.navigate('ProfissionalPerfil', { id: params.id }) },
      ]);
    } catch (err: any) {
      if (err instanceof SessionExpiredError) {
        setErro('Sessão expirada. Faça login novamente.');
      } else if (err?.errors) {
        const mapped: FieldErrors = {};
        for (const [k, v] of Object.entries(err.errors)) {
          mapped[k] = Array.isArray(v) ? (v as string[]).join(' ') : String(v);
        }
        setFieldErr(mapped);
      } else {
        setErro(err?.message ?? 'Erro ao salvar.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={C.headerBg} />

      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} activeOpacity={0.7}>
          <ArrowLeft size={22} color="rgba(255,255,255,0.9)" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Atualizar Informações</Text>
          <Text style={s.headerSub}>{nomeDisplay || 'Profissional'}</Text>
        </View>
      </View>

      {loading && (
        <View style={s.center}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={s.loadingText}>Carregando...</Text>
        </View>
      )}

      {!!erro && !loading && (
        <View style={s.center}>
          <Text style={s.errorText}>{erro}</Text>
          <TouchableOpacity style={s.retryBtn} onPress={carregar} activeOpacity={0.8}>
            <Text style={s.retryText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      )}

      {!loading && !erro && (
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
            {/* ── Foto ── */}
            <View style={s.section}>
              <Text style={s.sectionTitle}>Foto</Text>
              <View style={[s.card, ps.photoCard]}>
                <TouchableOpacity
                  style={ps.photoBtnWrap}
                  onPress={handlePickPhoto}
                  activeOpacity={0.85}
                  disabled={uploadingPhoto}
                >
                  <View style={ps.photoRing}>
                    <AuthPhoto
                      name={nomeDisplay}
                      serverUri={serverPhotoUrl}
                      localUri={localPhotoUri}
                    />
                    {uploadingPhoto ? (
                      <View style={ps.photoOverlay}>
                        <ActivityIndicator color="#fff" size="small" />
                      </View>
                    ) : (
                      <View style={ps.cameraBadge}>
                        <Camera size={14} color="#fff" />
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
                <Text style={ps.photoHint}>Toque para alterar a foto</Text>
              </View>
            </View>

            {/* ── Dados Pessoais ── */}
            <View style={s.section}>
              <Text style={s.sectionTitle}>Dados Pessoais</Text>
              <View style={s.card}>
                <Field label="Função"          value={form.funcao}          onChange={set('funcao')}          placeholder="Ex: Psiquiatra"    error={fieldErr.funcao} />
                <Field label="Telefone"        value={form.telefone}        onChange={set('telefone')}        placeholder="(85) 99999-0000"   keyboardType="phone-pad" error={fieldErr.telefone} />
                <DateField label="Data nascimento" value={form.data_nascimento} onChange={set('data_nascimento')} error={fieldErr.data_nascimento} />
              </View>
            </View>

            {/* ── Endereço ── */}
            <View style={s.section}>
              <Text style={s.sectionTitle}>Endereço</Text>
              <View style={s.card}>
                <Field label="CEP"         value={form.cep}         onChange={set('cep')}         placeholder="00000-000"    keyboardType="numeric" maxLength={9}  error={fieldErr['endereco.cep']} />
                <Field label="Logradouro"  value={form.logradouro}  onChange={set('logradouro')}  placeholder="Rua, Av..."   error={fieldErr['endereco.logradouro']} />
                <Field label="Número"      value={form.numero}      onChange={set('numero')}      placeholder="100"          error={fieldErr['endereco.numero']} />
                <Field label="Complemento" value={form.complemento} onChange={set('complemento')} placeholder="Apto, Sala…"  error={fieldErr['endereco.complemento']} />
                <Field label="Bairro"      value={form.bairro}      onChange={set('bairro')}      placeholder="Centro"       error={fieldErr['endereco.bairro']} />
                <Field label="Cidade"      value={form.cidade}      onChange={set('cidade')}      placeholder="Fortaleza"    error={fieldErr['endereco.cidade']} />
                <Field label="Estado"      value={form.estado}      onChange={set('estado')}      placeholder="CE"           maxLength={2} error={fieldErr['endereco.estado']} />
              </View>
            </View>

            <View style={{ height: 100 }} />
          </ScrollView>

          <View style={s.footer}>
            <TouchableOpacity
              style={[s.saveBtn, saving && s.saveBtnDisabled]}
              onPress={handleSave}
              activeOpacity={0.85}
              disabled={saving}
            >
              {saving
                ? <ActivityIndicator size="small" color="#fff" />
                : <><Save size={18} color="#fff" style={{ marginRight: 8 }} /><Text style={s.saveText}>Salvar alterações</Text></>
              }
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

// ─── Photo styles ─────────────────────────────────────────────────────────────
const ps = StyleSheet.create({
  photoCard:      { alignItems: 'center', paddingVertical: 24 },
  photoBtnWrap:   { alignItems: 'center' },
  photoRing:      { width: 104, height: 104, borderRadius: 52, borderWidth: 3, borderColor: C.primary, alignItems: 'center', justifyContent: 'center', backgroundColor: C.primaryBg },
  photoImg:       { width: 96, height: 96, borderRadius: 48 },
  photoPlaceholder:{ width: 96, height: 96, borderRadius: 48, backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center' },
  photoInitials:  { fontSize: 28, fontWeight: '800', color: C.primary },
  photoOverlay:   { position: 'absolute', width: 96, height: 96, borderRadius: 48, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  cameraBadge:    { position: 'absolute', bottom: 2, right: 2, width: 28, height: 28, borderRadius: 14, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2.5, borderColor: '#fff' },
  photoHint:      { marginTop: 10, fontSize: 12, color: C.textMuted, fontWeight: '500' },
});

// ─── Main styles ──────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: C.pageBg },
  scroll: { flex: 1 },
  scrollContent: { paddingTop: 8, paddingBottom: 16 },

  header:      { backgroundColor: C.headerBg, flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 12, paddingTop: 16, paddingBottom: 32, borderBottomLeftRadius: 18, borderBottomRightRadius: 18 },
  backBtn:     { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', marginRight: 4 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff', marginBottom: 3 },
  headerSub:   { fontSize: 12, fontWeight: '500', color: 'rgba(255,255,255,0.75)' },

  center:      { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  loadingText: { marginTop: 12, fontSize: 14, color: C.textMuted },
  errorText:   { fontSize: 14, color: C.error, textAlign: 'center', marginBottom: 16 },
  retryBtn:    { backgroundColor: C.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  retryText:   { color: '#fff', fontWeight: '700', fontSize: 14 },

  section:      { marginHorizontal: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: C.textMuted, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8, marginLeft: 4 },
  card:         { backgroundColor: C.surface, borderRadius: 16, borderWidth: 1, borderColor: C.border, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },

  fieldWrap:  { marginBottom: 14 },
  label:      { fontSize: 11, fontWeight: '600', color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6 },
  input:      { backgroundColor: C.pageBg, borderRadius: 10, borderWidth: 1, borderColor: C.border, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: C.text },
  inputError: { borderColor: C.error },
  fieldError: { fontSize: 11, color: C.error, marginTop: 4 },

  footer:          { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: C.surface, borderTopWidth: 1, borderTopColor: C.border, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24 },
  saveBtn:         { backgroundColor: C.primary, borderRadius: 14, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  saveBtnDisabled: { opacity: 0.6 },
  saveText:        { color: '#fff', fontWeight: '700', fontSize: 15 },
});

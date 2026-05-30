import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  StatusBar, ScrollView, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { launchImageLibrary } from 'react-native-image-picker';
import {
  ArrowLeft, Eye, EyeOff, Camera, CheckCircle2,
} from 'lucide-react-native';
import { criarFuncionario, atualizarFotoFuncionario } from '../services/funcionarioService';
import { ApiError } from '../services/httpClient';
import { CriarFuncionarioInput } from '../types/funcionario';

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  primary:      '#1565C0',
  primaryBg:    '#EBF5FC',
  pageBg:       '#F0F4F8',
  surface:      '#FFFFFF',
  surfaceAlt:   '#F8FAFC',
  border:       '#E2E8F0',
  borderFocus:  '#1565C0',
  text:         '#0F172A',
  textSub:      '#475569',
  textMuted:    '#94A3B8',
  red:          '#DC2626',
  redLight:     '#FEE2E2',
  redBorder:    '#FCA5A5',
  green:        '#16A34A',
  amber:        '#D97706',
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function maskCPF(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0,3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6)}`;
  return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}`;
}
function maskPhone(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2)  return d;
  if (d.length <= 7)  return `(${d.slice(0,2)}) ${d.slice(2)}`;
  return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
}
function maskDate(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0,2)}/${d.slice(2)}`;
  return `${d.slice(0,2)}/${d.slice(2,4)}/${d.slice(4)}`;
}
function toISO(v: string): string {
  const d = v.replace(/\D/g, '');
  return d.length === 8 ? `${d.slice(4)}-${d.slice(2,4)}-${d.slice(0,2)}` : v;
}
function strip(v: string): string { return v.replace(/\D/g, ''); }
function getInitials(n: string): string {
  return n.trim().split(/\s+/).filter(w => w.length > 1)
    .slice(0, 2).map(w => w[0].toUpperCase()).join('') || '?';
}

// ─── Força da senha ───────────────────────────────────────────────────────────
function pwdStrength(p: string): { score: number; label: string; color: string } {
  if (!p) return { score: 0, label: '', color: C.border };
  let s = 0;
  if (p.length >= 8)          s++;
  if (p.length >= 12)         s++;
  if (/[A-Z]/.test(p))        s++;
  if (/[0-9]/.test(p))        s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  if (s <= 1) return { score: 1, label: 'Fraca', color: C.red   };
  if (s <= 3) return { score: 2, label: 'Média', color: C.amber };
  return              { score: 3, label: 'Forte', color: C.green };
}

// ─── Validação ────────────────────────────────────────────────────────────────
const INITIAL = {
  nome: '', cpf: '', funcao: '', email: '',
  password: '', confirmar: '', telefone: '', data_nascimento: '',
};

function validate(f: typeof INITIAL): Record<string, string> {
  const e: Record<string, string> = {};
  if (!f.nome.trim())                                    e.nome      = 'Nome é obrigatório.';
  if (!f.cpf.trim())                                     e.cpf       = 'CPF é obrigatório.';
  else if (strip(f.cpf).length !== 11)                   e.cpf       = 'CPF deve ter 11 dígitos.';
  if (!f.funcao.trim())                                  e.funcao    = 'Função é obrigatória.';
  if (!f.email.trim())                                   e.email     = 'E-mail é obrigatório.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) e.email     = 'E-mail inválido.';
  if (!f.password)                                       e.password  = 'Senha é obrigatória.';
  else if (f.password.length < 8)                        e.password  = 'Mínimo 8 caracteres.';
  if (!f.confirmar)                                      e.confirmar = 'Confirme a senha.';
  else if (f.confirmar !== f.password)                   e.confirmar = 'As senhas não coincidem.';
  return e;
}

// ─── Input ────────────────────────────────────────────────────────────────────
type InputFieldProps = {
  label:       string;
  value:       string;
  onChange:    (v: string) => void;
  placeholder: string;
  error?:      string;
  required?:   boolean;
  optional?:   boolean;
  secure?:     boolean;
  onToggle?:   () => void;
  showPwd?:    boolean;
  keyboard?:   React.ComponentProps<typeof TextInput>['keyboardType'];
  capitalize?: React.ComponentProps<typeof TextInput>['autoCapitalize'];
};

function InputField({
  label, value, onChange, placeholder, error,
  required, optional, secure, onToggle, showPwd,
  keyboard = 'default', capitalize = 'sentences',
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
        {optional && <Text style={fi.optional}>opcional</Text>}
      </View>
      <View style={[
        fi.inputWrap,
        focused && fi.inputWrapFocus,
        !!error && fi.inputWrapError,
        hasValue && !focused && !error && fi.inputWrapFilled,
      ]}>
        <TextInput
          style={fi.input}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={C.textMuted}
          secureTextEntry={secure && !showPwd}
          keyboardType={keyboard}
          autoCapitalize={capitalize}
          autoCorrect={false}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {secure && (
          <TouchableOpacity onPress={onToggle} style={fi.pwdBtn} activeOpacity={0.6}>
            {showPwd
              ? <EyeOff size={17} color={C.textMuted} />
              : <Eye    size={17} color={C.textMuted} />}
          </TouchableOpacity>
        )}
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
  labelRow:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 },
  label:    { fontSize: 13, fontWeight: '600', color: C.textSub },
  asterisk: { fontSize: 13, fontWeight: '700', color: C.red },
  optional: { fontSize: 10, fontWeight: '600', color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputWrap:       { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surfaceAlt, borderWidth: 1.5, borderColor: C.border, borderRadius: 12, overflow: 'hidden' },
  inputWrapFocus:  { borderColor: C.borderFocus, backgroundColor: '#F0F7FF', shadowColor: C.primary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.12, shadowRadius: 6, elevation: 2 },
  inputWrapError:  { borderColor: C.redBorder, backgroundColor: C.redLight },
  inputWrapFilled: { borderColor: '#CBD5E1', backgroundColor: C.surface },
  input:           { flex: 1, height: 50, paddingHorizontal: 14, fontSize: 15, color: C.text, fontWeight: '500' },
  pwdBtn:          { width: 46, height: 50, alignItems: 'center', justifyContent: 'center' },
  errorRow:        { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 5 },
  errorDot:        { width: 5, height: 5, borderRadius: 3, backgroundColor: C.red },
  errorText:       { fontSize: 12, color: C.red, fontWeight: '500', flex: 1 },
});

// ─── Barra de força da senha ──────────────────────────────────────────────────
function StrengthBar({ password }: { password: string }) {
  if (!password) return null;
  const { score, label, color } = pwdStrength(password);
  return (
    <View style={sb.wrap}>
      <View style={sb.bars}>
        {[1, 2, 3].map(i => (
          <View key={i} style={[sb.bar, { backgroundColor: i <= score ? color : C.border }]} />
        ))}
      </View>
      <Text style={[sb.label, { color }]}>{label}</Text>
    </View>
  );
}
const sb = StyleSheet.create({
  wrap:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: -10, marginBottom: 18 },
  bars:  { flexDirection: 'row', gap: 4, flex: 1 },
  bar:   { flex: 1, height: 4, borderRadius: 2 },
  label: { fontSize: 11, fontWeight: '700', width: 40, textAlign: 'right' },
});

// ─── Tela ─────────────────────────────────────────────────────────────────────
export function NovoFuncionarioScreen() {
  const navigation                    = useNavigation();
  const [form, setForm]               = useState(INITIAL);
  const [errors, setErrors]           = useState<Record<string, string>>({});
  const [loading, setLoading]         = useState(false);
  const [showPwd, setShowPwd]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [photoUri, setPhotoUri]       = useState<string | null>(null);

  const set = useCallback((k: keyof typeof INITIAL, v: string) => {
    setForm(p => ({ ...p, [k]: v }));
    setErrors(p => { const n = { ...p }; delete n[k]; return n; });
  }, []);

  const handlePickPhoto = useCallback(() => {
    launchImageLibrary({ mediaType: 'photo', quality: 0.8, selectionLimit: 1 }, res => {
      if (res.didCancel || res.errorCode) return;
      const uri = res.assets?.[0]?.uri;
      if (uri) setPhotoUri(uri);
    });
  }, []);

  const handleSubmit = useCallback(async () => {
    const errs = validate(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      const input: CriarFuncionarioInput = {
        nome:     form.nome.trim(),
        email:    form.email.trim().toLowerCase(),
        password: form.password,
        cpf:      strip(form.cpf),
        funcao:   form.funcao.trim(),
        ...(form.telefone        && { telefone:        strip(form.telefone) }),
        ...(form.data_nascimento && { data_nascimento: toISO(form.data_nascimento) }),
      };
      const func = await criarFuncionario(input);

      if (photoUri) {
        try {
          await atualizarFotoFuncionario(func.id, photoUri);
        } catch {
          // foto falhou mas funcionário foi criado — segue normalmente
        }
      }

      Alert.alert(
        'Cadastro realizado',
        `${form.nome.trim()} foi cadastrado com sucesso.`,
        [{ text: 'Continuar', onPress: () => navigation.goBack() }],
      );
    } catch (err: unknown) {
      if (err instanceof ApiError && err.errors) {
        const mapped: Record<string, string> = {};
        Object.entries(err.errors).forEach(([k, msgs]) => { mapped[k] = msgs[0]; });
        setErrors(mapped);
      } else {
        Alert.alert('Erro ao cadastrar', err instanceof ApiError ? err.message : 'Verifique sua conexão e tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  }, [form, photoUri, navigation]);

  const initials = getInitials(form.nome);

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={C.primary} />

      {/* ── Header ── */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} activeOpacity={0.7}>
          <ArrowLeft size={22} color="rgba(255,255,255,0.9)" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Novo Funcionário</Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={s.card}>

            {/* ── Foto ── */}
            <View style={s.photoWrap}>
              <View style={fi.labelRow}>
                <Text style={fi.label}>Foto</Text>
                <Text style={fi.optional}>opcional</Text>
              </View>
              <TouchableOpacity onPress={handlePickPhoto} style={s.photoRow} activeOpacity={0.8}>
                <View style={s.photoAvatarContainer}>
                  {photoUri ? (
                    <Image source={{ uri: photoUri }} style={s.photoAvatar} />
                  ) : (
                    <View style={s.photoAvatarEmpty}>
                      <Text style={s.photoAvatarInitials}>{initials}</Text>
                    </View>
                  )}
                  <View style={s.photoCameraBtn}>
                    <Camera size={12} color="#fff" />
                  </View>
                </View>
                <Text style={s.photoHint}>
                  {photoUri ? 'Foto selecionada · toque para alterar' : 'Toque para selecionar da galeria'}
                </Text>
              </TouchableOpacity>
            </View>

            <InputField
              label="Nome completo" required
              value={form.nome} onChange={v => set('nome', v)}
              placeholder="Ana Santos"
              error={errors.nome} capitalize="words"
            />

            <InputField
              label="Função / Cargo" required
              value={form.funcao} onChange={v => set('funcao', v)}
              placeholder="Ex: Recepcionista, Coordenador"
              error={errors.funcao} capitalize="words"
            />

            <InputField
              label="CPF" required
              value={form.cpf} onChange={v => set('cpf', maskCPF(v))}
              placeholder="000.000.000-00"
              error={errors.cpf} keyboard="numeric" capitalize="none"
            />

            <InputField
              label="Telefone" optional
              value={form.telefone} onChange={v => set('telefone', maskPhone(v))}
              placeholder="(00) 00000-0000"
              keyboard="phone-pad" capitalize="none"
            />

            <InputField
              label="Data de nascimento" optional
              value={form.data_nascimento} onChange={v => set('data_nascimento', maskDate(v))}
              placeholder="DD/MM/AAAA"
              keyboard="numeric" capitalize="none"
            />

            <InputField
              label="E-mail de acesso" required
              value={form.email} onChange={v => set('email', v)}
              placeholder="ana@clinica.com"
              error={errors.email} keyboard="email-address" capitalize="none"
            />

            <InputField
              label="Senha de acesso" required
              value={form.password} onChange={v => set('password', v)}
              placeholder="Mínimo 8 caracteres"
              error={errors.password} secure onToggle={() => setShowPwd(p => !p)} showPwd={showPwd}
              capitalize="none"
            />
            <StrengthBar password={form.password} />

            <InputField
              label="Confirmar senha" required
              value={form.confirmar} onChange={v => set('confirmar', v)}
              placeholder="Repita a senha"
              error={errors.confirmar} secure onToggle={() => setShowConfirm(p => !p)} showPwd={showConfirm}
              capitalize="none"
            />
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
              <Text style={s.submitText}>Cadastrar funcionário</Text>
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

  // header — mesmo tamanho/estilo do AdminDashboard
  header:       { backgroundColor: C.primary, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: 16, paddingBottom: 32, borderBottomLeftRadius: 18, borderBottomRightRadius: 18, gap: 8 },
  backBtn:      { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  headerTitle:  { fontSize: 21, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },

  // campo foto dentro do formulário
  photoWrap:            { marginBottom: 18 },
  photoRow:             { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surfaceAlt, borderWidth: 1.5, borderColor: C.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, gap: 14 },
  photoAvatarContainer: { width: 52, height: 52, borderRadius: 26 },
  photoAvatar:          { width: 52, height: 52, borderRadius: 26 },
  photoAvatarEmpty:     { width: 52, height: 52, borderRadius: 26, backgroundColor: C.primaryBg, alignItems: 'center', justifyContent: 'center' },
  photoAvatarInitials:  { fontSize: 16, fontWeight: '700', color: C.primary },
  photoCameraBtn:       { position: 'absolute', bottom: 0, right: 0, width: 20, height: 20, borderRadius: 10, backgroundColor: C.primary, borderWidth: 1.5, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  photoHint:            { flex: 1, fontSize: 14, color: C.textSub, fontWeight: '500' },

  // scroll
  scroll: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 },

  // card
  card: { backgroundColor: C.surface, borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },

  // footer
  footer:     { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: C.surface, borderTopWidth: 1, borderTopColor: C.border, paddingHorizontal: 20, paddingTop: 12, paddingBottom: Platform.OS === 'ios' ? 32 : 16, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 16 },
  submitBtn:  { backgroundColor: C.primary, borderRadius: 14, height: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 6 },
  submitText: { fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: -0.2 },
});

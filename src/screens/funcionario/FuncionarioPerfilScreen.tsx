import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft, User, Mail, CreditCard, Phone, Briefcase, Calendar, ShieldCheck, MapPin, Pencil, KeyRound } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppStackParams } from '../../navigation/AppNavigator';
import { api, SessionExpiredError, STORAGE, getBaseUrl } from '../../services/httpClient';

type Nav   = NativeStackNavigationProp<AppStackParams>;
type Route = RouteProp<AppStackParams, 'FuncionarioPerfil'>;

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
  green:     '#2E7D32',
  greenBg:   '#E8F5E9',
} as const;

interface FuncionarioDetalhe {
  id:              number;
  nome:            string;
  email:           string;
  cpf:             string | null;
  funcao:          string;
  telefone:        string | null;
  ativo:           boolean;
  data_nascimento: string | null;
  foto_url:        string | null;
  endereco: {
    logradouro:  string;
    numero:      string;
    complemento: string | null;
    bairro:      string;
    cidade:      string;
    estado:      string;
    cep:         string;
  } | null;
}

function resolveUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const u = url.trim();
  if (!u) return null;
  if (u.startsWith('http://') || u.startsWith('https://')) return u;
  const base = getBaseUrl().replace(/\/$/, '');
  return `${base}${u.startsWith('/') ? u : `/${u}`}`;
}

function formatCpf(cpf: string | null): string {
  if (!cpf) return '—';
  const d = cpf.replace(/\D/g, '');
  if (d.length !== 11) return cpf;
  return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}`;
}

function formatTelefone(tel: string | null): string {
  if (!tel) return '—';
  const d = tel.replace(/\D/g, '');
  if (d.length === 11) return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;
  return tel;
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString('pt-BR'); }
  catch { return '—'; }
}

function getInitials(name: string): string {
  return name.split(' ').filter(w => w.length > 1).slice(0, 2).map(w => w[0].toUpperCase()).join('');
}

function FuncFoto({ uri, nome }: { uri: string | null; nome: string }) {
  const [dataUri, setDataUri] = useState<string | null>(null);
  const safeUri = resolveUrl(uri);

  useEffect(() => {
    if (!safeUri) return;
    let cancelled = false;
    (async () => {
      try {
        const token = await AsyncStorage.getItem(STORAGE.ACCESS);
        if (!token || cancelled) return;
        const res = await fetch(safeUri, { headers: { Authorization: `Bearer ${token}` } });
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
  }, [safeUri]);

  if (dataUri) return <Image source={{ uri: dataUri }} style={s.foto} resizeMode="cover" />;
  return (
    <View style={s.fotoPlaceholder}>
      <Text style={s.fotoInitials}>{getInitials(nome)}</Text>
    </View>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <View style={s.infoRow}>
      <View style={s.infoIconWrap}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={s.infoLabel}>{label}</Text>
        <Text style={s.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

export function FuncionarioPerfilScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const [func,       setFunc]       = useState<FuncionarioDetalhe | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [erro,       setErro]       = useState<string | null>(null);

  const carregar = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    setErro(null);
    try {
      const data = await api.get<FuncionarioDetalhe>(`/api/v1/funcionario/${params.id}/`);
      setFunc(data);
    } catch (err) {
      if (err instanceof SessionExpiredError) {
        setErro('Sessão expirada. Faça login novamente.');
      } else {
        setErro((err as any)?.message ?? 'Erro ao carregar funcionário.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [params.id]);

  useEffect(() => { carregar(); }, [carregar]);

  const onRefresh = useCallback(async () => { await carregar(true); }, [carregar]);

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={C.headerBg} />

      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} activeOpacity={0.7}>
          <ArrowLeft size={22} color="rgba(255,255,255,0.9)" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Perfil do Funcionário</Text>
          <Text style={s.headerSub}>Dados e informações</Text>
        </View>
        <TouchableOpacity
          style={s.editBtn}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('FuncionarioEditar', { id: params.id })}
        >
          <Pencil size={18} color="rgba(255,255,255,0.9)" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.editBtn, { marginLeft: 6 }]}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('FuncionarioNovaSenha', { id: params.id })}
        >
          <KeyRound size={18} color="rgba(255,255,255,0.9)" />
        </TouchableOpacity>
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
          <TouchableOpacity style={s.retryBtn} onPress={() => carregar()} activeOpacity={0.8}>
            <Text style={s.retryText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      )}

      {func && !loading && (
        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh}
              colors={[C.primary]} tintColor={C.primary} />
          }
        >
          {/* Hero */}
          <View style={s.heroCard}>
            <FuncFoto uri={func.foto_url} nome={func.nome} />
            <Text style={s.funcNome}>{func.nome}</Text>
            <View style={s.funcaoBadge}>
              <Briefcase size={13} color={C.primary} />
              <Text style={s.funcaoText}>{func.funcao}</Text>
            </View>
            <View style={[s.statusBadge, func.ativo ? s.statusAtivo : s.statusInativo]}>
              <Text style={[s.statusText, func.ativo ? s.statusAtivoText : s.statusInativoText]}>
                {func.ativo ? 'Ativo' : 'Inativo'}
              </Text>
            </View>
          </View>

          {/* Informações */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Informações</Text>
            <View style={s.card}>
              <InfoRow icon={<User       size={18} color={C.primary} />} label="Nome completo"      value={func.nome} />
              <View style={s.divider} />
              <InfoRow icon={<Briefcase  size={18} color={C.primary} />} label="Função"             value={func.funcao} />
              <View style={s.divider} />
              <InfoRow icon={<Mail       size={18} color={C.primary} />} label="E-mail"             value={func.email} />
              <View style={s.divider} />
              <InfoRow icon={<Phone      size={18} color={C.primary} />} label="Telefone"           value={formatTelefone(func.telefone)} />
              <View style={s.divider} />
              <InfoRow icon={<CreditCard size={18} color={C.primary} />} label="CPF"               value={formatCpf(func.cpf)} />
              <View style={s.divider} />
              <InfoRow icon={<Calendar   size={18} color={C.primary} />} label="Data de nascimento" value={formatDate(func.data_nascimento)} />
              <View style={s.divider} />
              <InfoRow icon={<ShieldCheck size={18} color={C.primary} />} label="Status"           value={func.ativo ? 'Ativo' : 'Inativo'} />
            </View>
          </View>

          {func.endereco && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>Endereço</Text>
              <View style={s.card}>
                <InfoRow
                  icon={<MapPin size={18} color={C.primary} />}
                  label={`${func.endereco.cidade}/${func.endereco.estado}`}
                  value={`${func.endereco.logradouro}, ${func.endereco.numero}${func.endereco.complemento ? ` — ${func.endereco.complemento}` : ''}\n${func.endereco.bairro} · ${func.endereco.cidade}/${func.endereco.estado}\nCEP ${func.endereco.cep}`}
                />
              </View>
            </View>
          )}

          <View style={{ height: 32 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:          { flex: 1, backgroundColor: C.pageBg },
  scroll:        { flex: 1 },
  scrollContent: { paddingTop: 8, paddingBottom: 16 },

  header:      { backgroundColor: C.headerBg, flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 12, paddingTop: 16, paddingBottom: 32, borderBottomLeftRadius: 18, borderBottomRightRadius: 18 },
  backBtn:     { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', marginRight: 4 },
  editBtn:     { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff', marginBottom: 3 },
  headerSub:   { fontSize: 12, fontWeight: '500', color: 'rgba(255,255,255,0.75)' },

  center:      { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  loadingText: { marginTop: 12, fontSize: 14, color: C.textMuted },
  errorText:   { fontSize: 14, color: '#C62828', textAlign: 'center', marginBottom: 16 },
  retryBtn:    { backgroundColor: C.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  retryText:   { color: '#fff', fontWeight: '700', fontSize: 14 },

  heroCard:        { backgroundColor: C.surface, margin: 16, borderRadius: 18, alignItems: 'center', padding: 24, borderWidth: 1, borderColor: C.border },
  foto:            { width: 90, height: 90, borderRadius: 45, marginBottom: 14 },
  fotoPlaceholder: { width: 90, height: 90, borderRadius: 45, backgroundColor: C.primaryBg, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  fotoInitials:    { fontSize: 28, fontWeight: '800', color: C.primary },
  funcNome:        { fontSize: 20, fontWeight: '800', color: C.text, textAlign: 'center', marginBottom: 8 },
  funcaoBadge:     { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.primaryBg, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginBottom: 8 },
  funcaoText:      { fontSize: 12, fontWeight: '600', color: C.primary },
  statusBadge:     { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5 },
  statusAtivo:     { backgroundColor: C.greenBg },
  statusInativo:   { backgroundColor: '#FFEBEE' },
  statusText:      { fontSize: 12, fontWeight: '700' },
  statusAtivoText: { color: C.green },
  statusInativoText: { color: '#C62828' },

  section:      { marginHorizontal: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: C.textMuted, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8, marginLeft: 4 },
  card:         { backgroundColor: C.surface, borderRadius: 16, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  divider:      { height: 1, backgroundColor: C.border, marginHorizontal: 16 },

  infoRow:      { flexDirection: 'row', alignItems: 'flex-start', padding: 16, gap: 14 },
  infoIconWrap: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.primaryBg, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  infoLabel:    { fontSize: 11, fontWeight: '600', color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 3 },
  infoValue:    { fontSize: 14, fontWeight: '500', color: C.text, lineHeight: 20 },

});

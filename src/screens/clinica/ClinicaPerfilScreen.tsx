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
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft, Building2, Phone, Mail, MapPin, Calendar, ShieldCheck, Pencil } from 'lucide-react-native';
import { AppStackParams } from '../../navigation/AppNavigator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useClinica } from '../../hooks/useClinica';
import { STORAGE, getBaseUrl } from '../../services/httpClient';

// ─── Paleta ───────────────────────────────────────────────────────────────────
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

// ─── Helpers ──────────────────────────────────────────────────────────────────
function resolveUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const u = url.trim();
  if (!u) return null;
  if (u.startsWith('http://') || u.startsWith('https://')) return u;
  const base = getBaseUrl().replace(/\/$/, '');
  return `${base}${u.startsWith('/') ? u : `/${u}`}`;
}

function formatCnpj(cnpj: string | null): string {
  if (!cnpj) return '—';
  const d = cnpj.replace(/\D/g, '');
  if (d.length !== 14) return cnpj;
  return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8,12)}-${d.slice(12)}`;
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

// ─── Logo com auth ────────────────────────────────────────────────────────────
function ClinicaFoto({ uri }: { uri: string | null }) {
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
      } catch { /* fallback para ícone */ }
    })();
    return () => { cancelled = true; };
  }, [safeUri]);

  if (dataUri) {
    return <Image source={{ uri: dataUri }} style={s.foto} resizeMode="cover" />;
  }
  return (
    <View style={s.fotoPlaceholder}>
      <Building2 size={40} color={C.primary} />
    </View>
  );
}

// ─── InfoRow ──────────────────────────────────────────────────────────────────
function InfoRow({ icon, label, value }: {
  icon: React.ReactNode; label: string; value: string;
}) {
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

// ─── TELA PRINCIPAL ──────────────────────────────────────────────────────────
export function ClinicaPerfilScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParams>>();
  const { clinica, loading, error, refresh } = useClinica();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const endereco = clinica?.endereco;
  const enderecoFormatado = endereco
    ? `${endereco.logradouro}, ${endereco.numero}${endereco.complemento ? ` — ${endereco.complemento}` : ''}\n${endereco.bairro} · ${endereco.cidade}/${endereco.estado}\nCEP ${endereco.cep}`
    : '—';

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={C.headerBg} />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} activeOpacity={0.7}>
          <ArrowLeft size={22} color="rgba(255,255,255,0.9)" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Perfil da Clínica</Text>
          <Text style={s.headerSub}>Dados e informações da clínica</Text>
        </View>
        <TouchableOpacity
          style={s.editBtn}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('ClinicaEditar')}
        >
          <Pencil size={18} color="rgba(255,255,255,0.9)" />
        </TouchableOpacity>
      </View>

      {loading && (
        <View style={s.center}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={s.loadingText}>Carregando...</Text>
        </View>
      )}

      {error && !loading && (
        <View style={s.center}>
          <Text style={s.errorText}>{error}</Text>
        </View>
      )}

      {clinica && !loading && (
        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh}
              colors={[C.primary]} tintColor={C.primary} />
          }
        >
          {/* Card principal com foto e nome */}
          <View style={s.heroCard}>
            <ClinicaFoto uri={clinica.foto} />
            <Text style={s.clinicaNome}>{clinica.nome}</Text>
            <View style={[s.statusBadge, clinica.ativa ? s.statusAtiva : s.statusInativa]}>
              <Text style={[s.statusText, clinica.ativa ? s.statusAtivaText : s.statusInativaText]}>
                {clinica.ativa ? 'Clínica ativa' : 'Clínica inativa'}
              </Text>
            </View>
            <View style={s.papelBadge}>
              <ShieldCheck size={13} color={C.primary} />
              <Text style={s.papelText}>{clinica.meu_papel_display}</Text>
            </View>
          </View>

          {/* Informações gerais */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Informações gerais</Text>
            <View style={s.card}>
              <InfoRow
                icon={<Building2 size={18} color={C.primary} />}
                label="CNPJ"
                value={formatCnpj(clinica.cnpj)}
              />
              <View style={s.divider} />
              <InfoRow
                icon={<Phone size={18} color={C.primary} />}
                label="Telefone"
                value={formatTelefone(clinica.telefone)}
              />
              <View style={s.divider} />
              <InfoRow
                icon={<Mail size={18} color={C.primary} />}
                label="E-mail"
                value={clinica.email ?? '—'}
              />
              <View style={s.divider} />
              <InfoRow
                icon={<Calendar size={18} color={C.primary} />}
                label="Cadastrada em"
                value={formatDate(clinica.data_criacao)}
              />
            </View>
          </View>

          {/* Endereço */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Endereço</Text>
            <View style={s.card}>
              <InfoRow
                icon={<MapPin size={18} color={C.primary} />}
                label={endereco ? `${endereco.cidade}/${endereco.estado}` : 'Endereço'}
                value={enderecoFormatado}
              />
            </View>
          </View>

          <View style={{ height: 32 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: C.pageBg },
  scroll: { flex: 1 },
  scrollContent: { paddingTop: 8, paddingBottom: 16 },

  header:      { backgroundColor: C.headerBg, flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 12, paddingTop: 16, paddingBottom: 32, borderBottomLeftRadius: 18, borderBottomRightRadius: 18 },
  backBtn:     { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', marginRight: 4 },
  editBtn:     { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff', marginBottom: 3 },
  headerSub:   { fontSize: 12, fontWeight: '500', color: 'rgba(255,255,255,0.75)' },

  center:      { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  loadingText: { marginTop: 12, fontSize: 14, color: C.textMuted },
  errorText:   { fontSize: 14, color: '#C62828', textAlign: 'center' },

  // hero
  heroCard:    { backgroundColor: C.surface, margin: 16, borderRadius: 18, alignItems: 'center', padding: 24, borderWidth: 1, borderColor: C.border },
  foto:        { width: 90, height: 90, borderRadius: 45, backgroundColor: C.primaryBg, marginBottom: 14 },
  fotoPlaceholder: { width: 90, height: 90, borderRadius: 45, backgroundColor: C.primaryBg, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  clinicaNome: { fontSize: 20, fontWeight: '800', color: C.text, textAlign: 'center', marginBottom: 10 },

  statusBadge:      { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5, marginBottom: 8 },
  statusAtiva:      { backgroundColor: '#E8F5E9' },
  statusInativa:    { backgroundColor: '#FFEBEE' },
  statusText:       { fontSize: 12, fontWeight: '700' },
  statusAtivaText:  { color: '#2E7D32' },
  statusInativaText:{ color: '#C62828' },

  papelBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.primaryBg, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  papelText:  { fontSize: 12, fontWeight: '600', color: C.primary },

  // section
  section:      { marginHorizontal: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: C.textMuted, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8, marginLeft: 4 },

  card:   { backgroundColor: C.surface, borderRadius: 16, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  divider:{ height: 1, backgroundColor: C.border, marginHorizontal: 16 },

  infoRow:     { flexDirection: 'row', alignItems: 'flex-start', padding: 16, gap: 14 },
  infoIconWrap:{ width: 36, height: 36, borderRadius: 18, backgroundColor: C.primaryBg, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  infoLabel:   { fontSize: 11, fontWeight: '600', color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 3 },
  infoValue:   { fontSize: 14, fontWeight: '500', color: C.text, lineHeight: 20 },
});

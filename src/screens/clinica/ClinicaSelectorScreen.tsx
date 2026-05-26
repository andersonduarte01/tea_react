import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Image,
  StatusBar,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Building2, ChevronRight, LogOut } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { ClinicaVinculo, TipoUsuario } from '../../types/auth';
import { AppStackParams } from '../../navigation/AppNavigator';
import { STORAGE, getBaseUrl } from '../../services/httpClient';

const { width: W } = Dimensions.get('window');

// ─── Config por papel ─────────────────────────────────────────────────────────
const TIPO_CONFIG: Record<TipoUsuario, { label: string; color: string; bg: string }> = {
  ADMIN: { label: 'Administrador', color: '#1565C0', bg: '#DBEAFE' },
  PROF:  { label: 'Profissional',  color: '#7C3AED', bg: '#EDE9FE' },
  FUNC:  { label: 'Funcionário',   color: '#059669', bg: '#D1FAE5' },
  RESP:  { label: 'Responsável',   color: '#D97706', bg: '#FEF3C7' },
  PAC:   { label: 'Paciente',      color: '#0284C7', bg: '#E0F2FE' },
};

const DASHBOARD_BY_TYPE: Record<TipoUsuario, keyof AppStackParams> = {
  ADMIN: 'AdminDashboard',
  PROF:  'ProfissionalDashboard',
  FUNC:  'FuncionarioDashboard',
  RESP:  'ResponsavelDashboard',
  PAC:   'PacienteDashboard',
};

type Nav = NativeStackNavigationProp<AppStackParams>;

// ─── Helper URL ───────────────────────────────────────────────────────────────
function resolveUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const u = url.trim();
  if (!u) return null;
  if (u.startsWith('http://') || u.startsWith('https://')) return u;
  const base = getBaseUrl().replace(/\/$/, '');
  return `${base}${u.startsWith('/') ? u : `/${u}`}`;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(w => w.length > 1)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('');
}

// ─── Foto da clínica autenticada ──────────────────────────────────────────────
function ClinicaCardFoto({ uri }: { uri: string | null }) {
  const [dataUri, setDataUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const safeUri = resolveUrl(uri);

  useEffect(() => {
    if (!safeUri) return;
    let cancelled = false;
    setLoading(true);

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
          if (!cancelled && typeof reader.result === 'string') {
            setDataUri(reader.result);
            setLoading(false);
          }
        };
        reader.readAsDataURL(blob);
      } catch {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [safeUri]);

  if (loading) {
    return (
      <View style={s.cardFotoWrap}>
        <ActivityIndicator size="small" color="#1565C0" />
      </View>
    );
  }

  if (dataUri) {
    return <Image source={{ uri: dataUri }} style={s.cardFoto} resizeMode="cover" />;
  }

  return (
    <View style={s.cardFotoWrap}>
      <Building2 size={28} color="#1565C0" />
    </View>
  );
}

// ─── Card de clínica ──────────────────────────────────────────────────────────
function ClinicaCard({ item, onPress }: { item: ClinicaVinculo; onPress: () => void }) {
  const config = TIPO_CONFIG[item.tipo_usuario] ?? TIPO_CONFIG.FUNC;

  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.75}>
      <View style={[s.cardAccent, { backgroundColor: config.color }]} />

      <ClinicaCardFoto uri={item.foto ?? null} />

      <View style={s.cardBody}>
        <Text style={s.cardNome} numberOfLines={2}>{item.nome}</Text>
        <View style={[s.roleBadge, { backgroundColor: config.bg }]}>
          <View style={[s.roleDot, { backgroundColor: config.color }]} />
          <Text style={[s.roleLabel, { color: config.color }]}>{config.label}</Text>
        </View>
      </View>

      <View style={s.cardArrow}>
        <ChevronRight size={20} color="#94A3B8" />
      </View>
    </TouchableOpacity>
  );
}

// ─── Tela principal ───────────────────────────────────────────────────────────
export function ClinicaSelectorScreen() {
  const { user, selecionarClinica, logout } = useAuth();
  const navigation = useNavigation<Nav>();
  const [selecting, setSelecting] = useState<number | null>(null);

  const initials = getInitials(user?.nome ?? '');
  const firstName = user?.nome?.split(' ')[0] ?? '';
  const total = user?.clinicas?.length ?? 0;

  async function handleSelect(clinica: ClinicaVinculo) {
    if (selecting !== null) return;
    setSelecting(clinica.id);
    await selecionarClinica(clinica);
    navigation.replace(DASHBOARD_BY_TYPE[clinica.tipo_usuario]);
  }

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#1565C0" />

      {/* ── Header ── */}
      <View style={s.header}>
        <View style={s.headerDeco1} />
        <View style={s.headerDeco2} />

        <View style={s.headerContent}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{initials}</Text>
          </View>

          <View style={s.headerText}>
            <Text style={s.headerGreeting}>Olá, {firstName}!</Text>
            <Text style={s.headerSub}>Selecione a clínica para continuar</Text>
          </View>
        </View>

        <View style={s.headerFooter}>
          <View style={s.countBadge}>
            <Building2 size={13} color="rgba(255,255,255,0.85)" />
            <Text style={s.countText}>
              {total} {total === 1 ? 'clínica disponível' : 'clínicas disponíveis'}
            </Text>
          </View>
        </View>
      </View>

      {/* ── Lista ── */}
      <FlatList
        data={user?.clinicas ?? []}
        keyExtractor={item => `${item.id}-${item.tipo_usuario}`}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={<View style={{ height: 8 }} />}
        ListFooterComponent={
          <TouchableOpacity style={s.logoutBtn} onPress={logout} activeOpacity={0.7}>
            <LogOut size={16} color="#EF4444" />
            <Text style={s.logoutText}>Sair da conta</Text>
          </TouchableOpacity>
        }
        renderItem={({ item }) => (
          <View style={s.cardWrap}>
            {selecting === item.id ? (
              <View style={[s.card, s.cardLoading]}>
                <ActivityIndicator size="small" color="#1565C0" />
                <Text style={s.loadingText}>Entrando...</Text>
              </View>
            ) : (
              <ClinicaCard item={item} onPress={() => handleSelect(item)} />
            )}
          </View>
        )}
      />
    </SafeAreaView>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F1F5F9' },

  // header
  header: {
    backgroundColor: '#1565C0',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
    overflow: 'hidden',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerDeco1: {
    position: 'absolute', top: -50, right: -50,
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  headerDeco2: {
    position: 'absolute', bottom: -30, right: 60,
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  headerContent: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 },
  avatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.35)',
  },
  avatarText:    { fontSize: 18, fontWeight: '800', color: '#fff' },
  headerText:    { flex: 1 },
  headerGreeting:{ fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  headerSub:     { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 3, lineHeight: 18 },
  headerFooter:  { flexDirection: 'row' },
  countBadge:    {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
  },
  countText: { fontSize: 12, color: 'rgba(255,255,255,0.85)', fontWeight: '600' },

  // lista
  list: { paddingHorizontal: 16, paddingBottom: 32 },
  cardWrap: { marginBottom: 12 },

  // card
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  cardLoading: {
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 24,
  },
  cardAccent:  { width: 4, alignSelf: 'stretch', borderRadius: 0 },
  cardFoto:    { width: 60, height: 60, borderRadius: 12, margin: 14 },
  cardFotoWrap:{
    width: 60, height: 60, borderRadius: 12, margin: 14,
    backgroundColor: '#EBF5FC',
    alignItems: 'center', justifyContent: 'center',
  },
  cardBody:    { flex: 1, paddingVertical: 16, paddingRight: 4 },
  cardNome:    { fontSize: 15, fontWeight: '700', color: '#0F172A', marginBottom: 6, lineHeight: 20 },
  roleBadge:   { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  roleDot:     { width: 6, height: 6, borderRadius: 3 },
  roleLabel:   { fontSize: 11, fontWeight: '700' },
  cardArrow:   { paddingHorizontal: 14 },
  loadingText: { fontSize: 13, color: '#1565C0', fontWeight: '600' },

  // logout
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginTop: 12, paddingVertical: 14,
  },
  logoutText: { fontSize: 14, fontWeight: '600', color: '#EF4444' },
});

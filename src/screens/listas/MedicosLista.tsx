import React, { useState, useCallback, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, SessionExpiredError, STORAGE, getBaseUrl } from '../../services/httpClient';

// ─── Types ────────────────────────────────────────────────────────────────────
interface ProfissionalAPI {
  id:             number;
  nome:           string;
  funcao:         string;
  foto:           string | null;
  hora_inicio:    string;
  hora_fim:       string;
  duracao_sessao: number;
  intervalo:      number;
}

type ApiResponse = ProfissionalAPI[] | { results: ProfissionalAPI[] };

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getInitials(name: string): string {
  return name.split(' ').filter(w => w.length > 1).slice(0, 2).map(w => w[0].toUpperCase()).join('');
}

function resolveUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const u = url.trim();
  if (!u) return null;
  if (u.startsWith('http://') || u.startsWith('https://')) return u;
  const base = getBaseUrl().replace(/\/$/, '');
  return `${base}${u.startsWith('/') ? u : `/${u}`}`;
}

// ─── AuthAvatar ───────────────────────────────────────────────────────────────
function AuthAvatar({ name, uri }: { name: string; uri: string | null }) {
  const [dataUri, setDataUri] = useState<string | null>(null);
  const safeUri = resolveUrl(uri);

  useEffect(() => {
    if (!safeUri) { setDataUri(null); return; }
    let cancelled = false;
    setDataUri(null);
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

  if (dataUri) {
    return <Image source={{ uri: dataUri }} style={s.avatarImg} />;
  }
  return (
    <View style={s.avatarCircle}>
      <Text style={s.avatarInitials}>{getInitials(name)}</Text>
    </View>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────
function ProfCard({ prof }: { prof: ProfissionalAPI }) {
  const schedule =
    prof.hora_inicio && prof.hora_fim
      ? `${prof.hora_inicio.slice(0, 5)} – ${prof.hora_fim.slice(0, 5)}`
      : null;

  return (
    <View style={s.card}>
      <View style={s.cardRow}>
        <AuthAvatar name={prof.nome} uri={prof.foto} />
        <View style={s.cardBody}>
          <Text style={s.nome}>{prof.nome}</Text>
          <Text style={s.funcao}>{prof.funcao}</Text>
          {schedule && <Text style={s.schedule}>🕐 {schedule}</Text>}
        </View>
        <View style={s.badge}>
          <Text style={s.badgeText}>Ativo</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export function MedicosLista() {
  const [dados, setDados]           = useState<ProfissionalAPI[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [erro, setErro]             = useState<string | null>(null);
  const [busca, setBusca]           = useState('');

  const carregar = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    setErro(null);
    try {
      const json = await api.get<ApiResponse>('/api/v1/profissional/');
      setDados(Array.isArray(json) ? json : (json.results ?? []));
    } catch (err: unknown) {
      if (err instanceof SessionExpiredError) {
        setErro('Sessão expirada. Faça login novamente.');
      } else {
        setErro((err as any)?.message ?? 'Erro ao carregar profissionais.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const filtrados = dados.filter(p =>
    p.nome.toLowerCase().includes(busca.toLowerCase()) ||
    p.funcao.toLowerCase().includes(busca.toLowerCase()),
  );

  if (loading) {
    return (
      <View style={s.stateWrap}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={s.stateText}>Carregando profissionais...</Text>
      </View>
    );
  }

  if (erro) {
    return (
      <View style={s.stateWrap}>
        <Text style={s.stateIcon}>⚠️</Text>
        <Text style={s.stateErr}>{erro}</Text>
        <TouchableOpacity style={s.retryBtn} onPress={() => carregar()} activeOpacity={0.8}>
          <Text style={s.retryText}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={s.root}>
      <View style={s.header}>
        <View>
          <Text style={s.title}>Profissionais</Text>
          <Text style={s.subtitle}>{dados.length} cadastrado{dados.length !== 1 ? 's' : ''}</Text>
        </View>
        <TouchableOpacity style={s.addBtn} activeOpacity={0.75}>
          <Text style={s.addBtnText}>+ Novo</Text>
        </TouchableOpacity>
      </View>

      <View style={s.searchWrap}>
        <View style={s.searchBar}>
          <Text style={s.searchIcon}>🔍</Text>
          <TextInput
            style={s.searchInput}
            value={busca}
            onChangeText={setBusca}
            placeholder="Buscar por nome ou função..."
            placeholderTextColor="#94A3B8"
            returnKeyType="search"
          />
          {busca.length > 0 && (
            <TouchableOpacity onPress={() => setBusca('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={s.searchClear}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {filtrados.length === 0 ? (
        <View style={s.stateWrap}>
          <Text style={s.stateIcon}>👨‍⚕️</Text>
          <Text style={s.emptyTitle}>
            {busca ? 'Nenhum resultado' : 'Nenhum profissional cadastrado'}
          </Text>
          <Text style={s.emptySubtitle}>
            {busca ? `Sem resultados para "${busca}"` : 'Adicione profissionais para começar'}
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => carregar(true)}
              colors={['#2563EB']}
              tintColor="#2563EB"
            />
          }
        >
          {filtrados.map(prof => <ProfCard key={prof.id} prof={prof} />)}
        </ScrollView>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:       { flex: 1, backgroundColor: '#F1F5F9' },
  header:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 14, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  title:      { fontSize: 22, fontWeight: '800', color: '#0F172A', letterSpacing: -0.3 },
  subtitle:   { fontSize: 12, color: '#64748B', marginTop: 2 },
  addBtn:     { backgroundColor: '#2563EB', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  searchWrap: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  searchBar:  { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 16, paddingHorizontal: 14, borderWidth: 1, borderColor: '#E2E8F0', height: 48 },
  searchIcon: { fontSize: 15, marginRight: 8 },
  searchInput:{ flex: 1, fontSize: 14, color: '#0F172A' },
  searchClear:{ fontSize: 14, color: '#94A3B8', paddingLeft: 8 },

  list: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24, gap: 10 },

  card:    { backgroundColor: '#FFFFFF', borderRadius: 16, shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 },
  cardRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  cardBody:{ flex: 1 },
  nome:    { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  funcao:  { fontSize: 13, color: '#64748B', marginTop: 1 },
  schedule:{ fontSize: 11, color: '#94A3B8', marginTop: 3 },

  badge:    { backgroundColor: '#D1FAE5', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText:{ fontSize: 11, fontWeight: '700', color: '#065F46' },

  avatarImg:      { width: 48, height: 48, borderRadius: 24 },
  avatarCircle:   { width: 48, height: 48, borderRadius: 24, backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center' },
  avatarInitials: { fontSize: 16, fontWeight: '700', color: '#2563EB' },

  stateWrap:    { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingVertical: 40 },
  stateIcon:    { fontSize: 48, marginBottom: 12 },
  stateText:    { fontSize: 13, color: '#64748B', marginTop: 10 },
  stateErr:     { fontSize: 13, color: '#EF4444', textAlign: 'center', marginBottom: 16 },
  emptyTitle:   { fontSize: 15, fontWeight: '600', color: '#0F172A', textAlign: 'center', marginBottom: 4 },
  emptySubtitle:{ fontSize: 13, color: '#64748B', textAlign: 'center' },
  retryBtn:     { backgroundColor: '#2563EB', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  retryText:    { color: '#fff', fontWeight: '700', fontSize: 14 },
});

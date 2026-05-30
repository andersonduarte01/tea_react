import React, { useState, useCallback, useEffect } from 'react';
import { Eye } from 'lucide-react-native';
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
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { api, SessionExpiredError, STORAGE, getBaseUrl } from '../../services/httpClient';
import { AppStackParams } from '../../navigation/AppNavigator';

// ─── Types ────────────────────────────────────────────────────────────────────
interface ProfissionalAPI {
  id:             number;
  nome:           string;
  funcao:         string;
  foto_url:       string | null;
  telefone:       string | null;
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
function ProfCard({ prof, onView }: { prof: ProfissionalAPI; onView: () => void }) {
  const schedule =
    prof.hora_inicio && prof.hora_fim
      ? `${prof.hora_inicio.slice(0, 5)} – ${prof.hora_fim.slice(0, 5)}`
      : null;

  return (
    <View style={s.card}>
      <View style={s.cardRow}>
        <AuthAvatar name={prof.nome} uri={prof.foto_url} />
        <View style={s.cardBody}>
          <Text style={s.nome} numberOfLines={1}>{prof.nome}</Text>
          <Text style={s.funcao} numberOfLines={1}>{prof.funcao}</Text>
          {prof.telefone && <Text style={s.telefone}>{prof.telefone}</Text>}
          {schedule && <Text style={s.schedule}>🕐 {schedule}</Text>}
        </View>
        <TouchableOpacity style={s.editBtn} onPress={onView} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Eye size={16} color="#94A3B8" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface MedicosListaProps {
  buscaExterna?:  string;
  onBuscaChange?: (v: string) => void;
  onCountChange?: (n: number) => void;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export function MedicosLista({ buscaExterna, onBuscaChange, onCountChange }: MedicosListaProps = {}) {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParams>>();
  const [dados, setDados]           = useState<ProfissionalAPI[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [erro, setErro]             = useState<string | null>(null);
  const [buscaInterna, setBuscaInterna] = useState('');

  const isControlled = buscaExterna !== undefined;
  const busca        = isControlled ? buscaExterna : buscaInterna;
  const setBusca     = isControlled ? (onBuscaChange ?? (() => {})) : setBuscaInterna;

  const carregar = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    setErro(null);
    try {
      const json = await api.get<ApiResponse>('/api/v1/profissional/');
      const list = Array.isArray(json) ? json : (json.results ?? []);
      setDados(list);
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

  useFocusEffect(useCallback(() => { carregar(); }, [carregar]));

  useEffect(() => {
    onCountChange?.(dados.length);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dados.length]);

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
      {/* Header e busca internos apenas no modo standalone (sem controle externo) */}
      {!isControlled && (
        <>
          <View style={s.header}>
            <Text style={s.title}>Profissionais</Text>
            <Text style={s.subtitle}>{dados.length} cadastrado{dados.length !== 1 ? 's' : ''}</Text>
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
        </>
      )}

      <View style={s.addRow}>
        <TouchableOpacity
          style={s.addBtn}
          activeOpacity={0.75}
          onPress={() => navigation.navigate('NovoProfissional')}
        >
          <Text style={s.addBtnText}>+ Novo profissional</Text>
        </TouchableOpacity>
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
          {filtrados.map(prof => (
            <ProfCard
              key={prof.id}
              prof={prof}
              onView={() => navigation.navigate('ProfissionalPerfil', { id: prof.id })}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:       { flex: 1, backgroundColor: '#F1F5F9' },
  header:     { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 14, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  title:      { fontSize: 22, fontWeight: '800', color: '#0F172A', letterSpacing: -0.3 },
  subtitle:   { fontSize: 12, color: '#64748B', marginTop: 2 },
  addRow:     { paddingHorizontal: 16, paddingTop: 12 },
  addBtn:     { backgroundColor: '#2563EB', paddingVertical: 12, borderRadius: 14, alignItems: 'center' },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  searchWrap: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  searchBar:  { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 16, paddingHorizontal: 14, borderWidth: 1, borderColor: '#E2E8F0', height: 48 },
  searchIcon: { fontSize: 15, marginRight: 8 },
  searchInput:{ flex: 1, fontSize: 14, color: '#0F172A' },
  searchClear:{ fontSize: 14, color: '#94A3B8', paddingLeft: 8 },

  list: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24, gap: 10 },

  card:     { backgroundColor: '#FFFFFF', borderRadius: 16, shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 },
  cardRow:  { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  cardBody: { flex: 1, minWidth: 0 },
  nome:     { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  funcao:   { fontSize: 12, color: '#2563EB', fontWeight: '600', marginTop: 1 },
  telefone: { fontSize: 11, color: '#64748B', marginTop: 2 },
  schedule: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  editBtn:  { padding: 4 },

  avatarImg:      { width: 58, height: 58, borderRadius: 29 },
  avatarCircle:   { width: 58, height: 58, borderRadius: 29, backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center' },
  avatarInitials: { fontSize: 18, fontWeight: '700', color: '#2563EB' },

  stateWrap:    { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingVertical: 40 },
  stateIcon:    { fontSize: 48, marginBottom: 12 },
  stateText:    { fontSize: 13, color: '#64748B', marginTop: 10 },
  stateErr:     { fontSize: 13, color: '#EF4444', textAlign: 'center', marginBottom: 16 },
  emptyTitle:   { fontSize: 15, fontWeight: '600', color: '#0F172A', textAlign: 'center', marginBottom: 4 },
  emptySubtitle:{ fontSize: 13, color: '#64748B', textAlign: 'center' },
  retryBtn:     { backgroundColor: '#2563EB', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  retryText:    { color: '#fff', fontWeight: '700', fontSize: 14 },
});

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
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CalendarPlus, Eye } from 'lucide-react-native';
import { api, SessionExpiredError, STORAGE, getBaseUrl } from '../../services/httpClient';
import { AppStackParams } from '../../navigation/AppNavigator';

type Nav = NativeStackNavigationProp<AppStackParams>;

// ─── Types ────────────────────────────────────────────────────────────────────
interface DiasTrabalho {
  segunda: boolean; terca: boolean; quarta: boolean;
  quinta:  boolean; sexta: boolean; sabado: boolean; domingo: boolean;
}

interface ProfAgendaItem {
  id:              number;  // agenda config ID
  profissional_id: number;  // profissional ID (usado para navegação e cross-reference)
  nome:            string;
  funcao:          string;
  foto:            string | null;
  hora_inicio:     string;
  hora_fim:        string;
  duracao_sessao:  number;
  intervalo:       number;
  dias_trabalho:   DiasTrabalho | null;
  atende_feriados_nacionais?: boolean | null;
  atende_feriados_locais?:    boolean | null;
}

interface ProfSemAgenda {
  id:       number;
  nome:     string;
  funcao:   string;
  foto_url: string | null;
}


// ─── Constants ────────────────────────────────────────────────────────────────
const DIAS: { key: keyof DiasTrabalho; label: string }[] = [
  { key: 'segunda', label: 'Seg' }, { key: 'terca',   label: 'Ter' },
  { key: 'quarta',  label: 'Qua' }, { key: 'quinta',  label: 'Qui' },
  { key: 'sexta',   label: 'Sex' }, { key: 'sabado',  label: 'Sáb' },
  { key: 'domingo', label: 'Dom' },
];

// ─── Paginação ────────────────────────────────────────────────────────────────
// Busca todas as páginas de um endpoint paginado até next === null.
// Funciona também com endpoints que retornam lista simples (sem paginação).
interface PagedResponse<T> { results: T[]; next: string | null }

async function fetchAllPages<T>(path: string): Promise<T[]> {
  const all: T[] = [];
  let page = 1;
  while (true) {
    const sep  = path.includes('?') ? '&' : '?';
    const data = await api.get<T[] | PagedResponse<T>>(`${path}${sep}page=${page}&page_size=100`);
    if (Array.isArray(data)) { all.push(...data); break; }
    all.push(...data.results);
    if (!data.next) break;
    page++;
  }
  return all;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getInitials(name: string): string {
  return name.split(' ').filter(w => w.length > 1).slice(0, 2).map(w => w[0].toUpperCase()).join('');
}

function resolveUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const u = url.trim();
  if (!u) return null;
  if (u.startsWith('http://') || u.startsWith('https://')) return u;
  return `${getBaseUrl().replace(/\/$/, '')}${u.startsWith('/') ? u : `/${u}`}`;
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

  if (dataUri) return <Image source={{ uri: dataUri }} style={s.avatarImg} />;
  return (
    <View style={s.avatarCircle}>
      <Text style={s.avatarInitials}>{getInitials(name)}</Text>
    </View>
  );
}

// ─── Card com agenda ──────────────────────────────────────────────────────────
function CardComAgenda({ prof, onEditar }: { prof: ProfAgendaItem; onEditar: () => void }) {
  const dias = prof.dias_trabalho;
  return (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <AuthAvatar name={prof.nome} uri={prof.foto} />
        <View style={s.cardBody}>
          <Text style={s.nome}>{prof.nome}</Text>
          <Text style={s.funcao}>{prof.funcao}</Text>
          <Text style={s.horario}>
            🕐 {prof.hora_inicio?.slice(0, 5)} – {prof.hora_fim?.slice(0, 5)}
            {'  ·  '}{prof.duracao_sessao} min/sessão
          </Text>
          {dias && (
            <View style={s.diasRow}>
              {DIAS.map(d => (
                <View key={d.key} style={[s.diaChip, dias[d.key] && s.diaChipOn]}>
                  <Text style={[s.diaChipText, dias[d.key] && s.diaChipTextOn]}>{d.label}</Text>
                </View>
              ))}
            </View>
          )}
          {(prof.atende_feriados_nacionais === true || prof.atende_feriados_locais === true) && (
            <View style={s.feriadosRow}>
              {prof.atende_feriados_nacionais === true && (
                <View style={[s.feriadoChip, s.feriadoChipSim]}>
                  <Text style={[s.feriadoText, s.feriadoTextSim]}>✓ Fer. Nacionais</Text>
                </View>
              )}
              {prof.atende_feriados_locais === true && (
                <View style={[s.feriadoChip, s.feriadoChipSim]}>
                  <Text style={[s.feriadoText, s.feriadoTextSim]}>✓ Fer. Locais</Text>
                </View>
              )}
            </View>
          )}
        </View>
        <TouchableOpacity onPress={onEditar} style={s.eyeBtn} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Eye size={16} color="#94A3B8" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Card sem agenda ──────────────────────────────────────────────────────────
function CardSemAgenda({ prof, onCriar }: { prof: ProfSemAgenda; onCriar: () => void }) {
  return (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <AuthAvatar name={prof.nome} uri={prof.foto_url} />
        <View style={s.cardBody}>
          <Text style={s.nome}>{prof.nome}</Text>
          <Text style={s.funcao}>{prof.funcao}</Text>
          <View style={s.semAgendaBadge}>
            <Text style={s.semAgendaText}>Sem agenda configurada</Text>
          </View>
        </View>
      </View>
      <View style={s.divider} />
      <TouchableOpacity style={s.cardActionCreate} onPress={onCriar} activeOpacity={0.75}>
        <CalendarPlus size={14} color="#fff" />
        <Text style={s.cardActionCreateText}>Criar agenda</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export function AgendasLista({ onCountChange, buscaExterna, onBuscaChange }: {
  onCountChange?:  (com: number, sem: number) => void;
  buscaExterna?:   string;
  onBuscaChange?:  (v: string) => void;
}) {
  const navigation = useNavigation<Nav>();

  const [comAgenda,   setComAgenda]   = useState<ProfAgendaItem[]>([]);
  const [semAgenda,   setSemAgenda]   = useState<ProfSemAgenda[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [erro,        setErro]        = useState<string | null>(null);
  const [buscaInterna, setBuscaInterna] = useState('');
  const [aba,         setAba]         = useState<'com' | 'sem'>('com');

  const isControlled = buscaExterna !== undefined;
  const busca        = isControlled ? buscaExterna : buscaInterna;
  const setBusca     = isControlled ? (onBuscaChange ?? (() => {})) : setBuscaInterna;

  const carregar = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    setErro(null);
    try {
      const [listaAgendas, listaTodos] = await Promise.all([
        fetchAllPages<ProfAgendaItem>('/api/v1/agenda/profissionais/'),
        api.get<ProfSemAgenda[] | PagedResponse<ProfSemAgenda>>('/api/v1/profissional/').then(
          r => Array.isArray(r) ? r : (r.results ?? [])
        ),
      ]);

      const idsComAgenda = new Set(listaAgendas.map(a => Number(a.profissional_id)));
      const semLista = listaTodos.filter(p => !idsComAgenda.has(Number(p.id)));
      setComAgenda(listaAgendas);
      setSemAgenda(semLista);
      onCountChange?.(listaAgendas.length, semLista.length);
    } catch (err: unknown) {
      if (err instanceof SessionExpiredError) {
        setErro('Sessão expirada. Faça login novamente.');
      } else {
        setErro((err as any)?.message ?? 'Erro ao carregar agendas.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [onCountChange]);

  useFocusEffect(useCallback(() => { carregar(); }, [carregar]));

  const listaAtiva = aba === 'com' ? comAgenda : semAgenda;
  const filtrados  = listaAtiva.filter(p =>
    p.nome.toLowerCase().includes(busca.toLowerCase()) ||
    p.funcao.toLowerCase().includes(busca.toLowerCase()),
  );

  if (loading) {
    return (
      <View style={s.stateWrap}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={s.stateText}>Carregando agendas...</Text>
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
      {/* Tabs */}
      <View style={s.tabsWrap}>
        <TouchableOpacity
          style={[s.tab, aba === 'com' && s.tabActive]}
          onPress={() => setAba('com')}
          activeOpacity={0.8}
        >
          <Text style={[s.tabText, aba === 'com' && s.tabTextActive]}>
            Com agenda
          </Text>
          <View style={[s.tabBadge, aba === 'com' && s.tabBadgeActive]}>
            <Text style={[s.tabBadgeText, aba === 'com' && s.tabBadgeTextActive]}>
              {comAgenda.length}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.tab, aba === 'sem' && s.tabActive]}
          onPress={() => setAba('sem')}
          activeOpacity={0.8}
        >
          <Text style={[s.tabText, aba === 'sem' && s.tabTextActive]}>
            Sem agenda
          </Text>
          {semAgenda.length > 0 && (
            <View style={[s.tabBadge, s.tabBadgeAlert, aba === 'sem' && s.tabBadgeActive]}>
              <Text style={[s.tabBadgeText, aba === 'sem' && s.tabBadgeTextActive]}>
                {semAgenda.length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Busca interna — apenas no modo standalone */}
      {!isControlled && (
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
      )}

      {/* Lista */}
      {filtrados.length === 0 ? (
        <View style={s.stateWrap}>
          <Text style={s.stateIcon}>{aba === 'com' ? '📅' : '➕'}</Text>
          <Text style={s.emptyTitle}>
            {busca
              ? 'Nenhum resultado'
              : aba === 'com'
                ? 'Nenhuma agenda configurada'
                : 'Todos os profissionais têm agenda'}
          </Text>
          <Text style={s.emptySubtitle}>
            {busca
              ? `Sem resultados para "${busca}"`
              : aba === 'com'
                ? 'Nenhum profissional com agenda ativa'
                : 'Todos já possuem configuração de agenda'}
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
          {aba === 'com'
            ? (filtrados as ProfAgendaItem[]).map(prof => (
                <CardComAgenda
                  key={prof.id}
                  prof={prof}
                  onEditar={() => navigation.navigate('EditarAgenda', { profissionalId: prof.profissional_id, agendaId: prof.id, nome: prof.nome })}
                />
              ))
            : (filtrados as ProfSemAgenda[]).map(prof => (
                <CardSemAgenda
                  key={prof.id}
                  prof={prof}
                  onCriar={() => navigation.navigate('NovaAgenda', { profissionalId: prof.id, nome: prof.nome })}
                />
              ))
          }
        </ScrollView>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F1F5F9' },

  tabsWrap: { flexDirection: 'row', backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, gap: 8, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  tab:      { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 9, borderRadius: 12, backgroundColor: '#F1F5F9' },
  tabActive:{ backgroundColor: '#2563EB' },
  tabText:  { fontSize: 13, fontWeight: '600', color: '#64748B' },
  tabTextActive: { color: '#fff' },
  tabBadge: { backgroundColor: '#E2E8F0', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 },
  tabBadgeAlert: { backgroundColor: '#FEE2E2' },
  tabBadgeActive:{ backgroundColor: 'rgba(255,255,255,0.25)' },
  tabBadgeText:  { fontSize: 11, fontWeight: '700', color: '#64748B' },
  tabBadgeTextActive: { color: '#fff' },

  searchWrap: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  searchBar:  { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 16, paddingHorizontal: 14, borderWidth: 1, borderColor: '#E2E8F0', height: 48 },
  searchIcon: { fontSize: 15, marginRight: 8 },
  searchInput:{ flex: 1, fontSize: 14, color: '#0F172A' },
  searchClear:{ fontSize: 14, color: '#94A3B8', paddingLeft: 8 },

  list: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24, gap: 10 },

  card:       { backgroundColor: '#FFFFFF', borderRadius: 16, shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', padding: 14, gap: 12 },
  cardBody:   { flex: 1 },

  nome:    { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  funcao:  { fontSize: 13, color: '#64748B', marginTop: 1 },
  horario: { fontSize: 11, color: '#94A3B8', marginTop: 3 },

  diasRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 8 },
  diaChip:       { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, backgroundColor: '#F0F4F8' },
  diaChipOn:     { backgroundColor: '#2563EB' },
  diaChipText:   { fontSize: 10, fontWeight: '700', color: '#94A3B8' },
  diaChipTextOn: { color: '#fff' },

  eyeBtn: { padding: 4, marginLeft: 4, alignSelf: 'flex-start' },

  feriadosRow:    { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 6 },
  feriadoChip:    { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  feriadoChipSim: { backgroundColor: '#DCFCE7' },
  feriadoText:    { fontSize: 10, fontWeight: '700' },
  feriadoTextSim: { color: '#15803D' },

  semAgendaBadge: { marginTop: 6, alignSelf: 'flex-start', backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  semAgendaText:  { fontSize: 10, fontWeight: '600', color: '#92400E' },

  cardActionCreate:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 11, backgroundColor: '#2563EB', margin: 10, borderRadius: 10 },
  cardActionCreateText: { fontSize: 13, fontWeight: '700', color: '#fff' },

  divider: { height: 1, backgroundColor: '#E2E8F0' },

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

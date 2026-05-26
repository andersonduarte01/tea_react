import React, { useState, useCallback, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, SessionExpiredError, STORAGE, getBaseUrl } from '../../services/httpClient';

// ─── Types ────────────────────────────────────────────────────────────────────
interface DiasTrabalho {
  segunda: boolean;
  terca:   boolean;
  quarta:  boolean;
  quinta:  boolean;
  sexta:   boolean;
  sabado:  boolean;
  domingo: boolean;
}

interface ProfAgendaItem {
  id:             number;
  nome:           string;
  funcao:         string;
  foto:           string | null;
  hora_inicio:    string;
  hora_fim:       string;
  duracao_sessao: number;
  intervalo:      number;
  dias_trabalho:  DiasTrabalho | null;
}

interface Feriado {
  id:        number;
  data:      string;
  descricao: string;
}

interface Falta {
  id:     number;
  data:   string;
  motivo: string | null;
}

interface ProfAgendaDetalhe extends ProfAgendaItem {
  profissional_id:           number;
  hora_almoco_inicio:        string | null;
  hora_almoco_fim:           string | null;
  atende_feriados_nacionais: boolean;
  atende_feriados_locais:    boolean;
  feriados_locais:           Feriado[];
  faltas:                    Falta[];
}

type ApiResponse = ProfAgendaItem[] | { results: ProfAgendaItem[] };

// ─── Constants ────────────────────────────────────────────────────────────────
const DIAS: { key: keyof DiasTrabalho; label: string }[] = [
  { key: 'segunda', label: 'Seg' },
  { key: 'terca',   label: 'Ter' },
  { key: 'quarta',  label: 'Qua' },
  { key: 'quinta',  label: 'Qui' },
  { key: 'sexta',   label: 'Sex' },
  { key: 'sabado',  label: 'Sáb' },
  { key: 'domingo', label: 'Dom' },
];

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

function formatarData(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
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

// ─── Expandable Card ──────────────────────────────────────────────────────────
function ProfCard({ prof }: { prof: ProfAgendaItem }) {
  const [expandido, setExpandido]           = useState(false);
  const [detalhe, setDetalhe]               = useState<ProfAgendaDetalhe | null>(null);
  const [loadingDetalhe, setLoadingDetalhe] = useState(false);

  const abrirDetalhe = useCallback(async () => {
    if (detalhe) { setExpandido(v => !v); return; }
    setExpandido(true);
    setLoadingDetalhe(true);
    try {
      const data = await api.get<ProfAgendaDetalhe>(`/api/v1/agenda/profissionais/${prof.id}/`);
      setDetalhe(data);
    } catch {}
    finally { setLoadingDetalhe(false); }
  }, [detalhe, prof.id]);

  const dias = prof.dias_trabalho;

  return (
    <View style={s.card}>
      <TouchableOpacity onPress={abrirDetalhe} activeOpacity={0.75} style={s.cardHeader}>
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
                  <Text style={[s.diaChipText, dias[d.key] && s.diaChipTextOn]}>
                    {d.label}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
        <Text style={s.expandIcon}>{expandido ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {expandido && (
        <View style={s.detalheWrap}>
          <View style={s.divider} />
          {loadingDetalhe ? (
            <ActivityIndicator size="small" color="#2563EB" style={s.detalheLoader} />
          ) : detalhe ? (
            <View style={s.detalhePad}>
              {detalhe.hora_almoco_inicio && (
                <View style={s.detalheRow}>
                  <Text style={s.detalheLabel}>🍽 Almoço</Text>
                  <Text style={s.detalheValor}>
                    {detalhe.hora_almoco_inicio.slice(0, 5)} – {detalhe.hora_almoco_fim?.slice(0, 5)}
                  </Text>
                </View>
              )}
              <View style={s.detalheRow}>
                <Text style={s.detalheLabel}>🗓 Feriados nacionais</Text>
                <Text style={s.detalheValor}>
                  {detalhe.atende_feriados_nacionais ? 'Atende' : 'Não atende'}
                </Text>
              </View>

              {detalhe.feriados_locais.length > 0 && (
                <View style={s.detalheBloco}>
                  <Text style={s.detalheBlocoTitle}>
                    Feriados locais ({detalhe.feriados_locais.length})
                  </Text>
                  {detalhe.feriados_locais.map(f => (
                    <Text key={f.id} style={s.detalheBlocoItem}>
                      • {formatarData(f.data)}  –  {f.descricao}
                    </Text>
                  ))}
                </View>
              )}

              {detalhe.faltas.length > 0 && (
                <View style={s.detalheBloco}>
                  <Text style={s.detalheBlocoTitleDanger}>
                    Faltas agendadas ({detalhe.faltas.length})
                  </Text>
                  {detalhe.faltas.map(f => (
                    <Text key={f.id} style={s.detalheBlocoItem}>
                      • {formatarData(f.data)}{f.motivo ? `  –  ${f.motivo}` : ''}
                    </Text>
                  ))}
                </View>
              )}

              {detalhe.feriados_locais.length === 0 && detalhe.faltas.length === 0 && (
                <Text style={s.detalheVazio}>Sem feriados locais ou faltas futuras.</Text>
              )}
            </View>
          ) : (
            <Text style={s.detalheVazio}>Não foi possível carregar o detalhe.</Text>
          )}
        </View>
      )}
    </View>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export function AgendasLista() {
  const [dados, setDados]           = useState<ProfAgendaItem[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [erro, setErro]             = useState<string | null>(null);

  const carregar = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    setErro(null);
    try {
      const json = await api.get<ApiResponse>('/api/v1/agenda/profissionais/');
      setDados(Array.isArray(json) ? json : (json.results ?? []));
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
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

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
      <View style={s.header}>
        <Text style={s.title}>Agendas</Text>
        <Text style={s.subtitle}>
          {dados.length} profissional{dados.length !== 1 ? 'is' : ''} com agenda ativa
        </Text>
      </View>

      {dados.length === 0 ? (
        <View style={s.stateWrap}>
          <Text style={s.stateIcon}>📅</Text>
          <Text style={s.emptyTitle}>Nenhuma agenda ativa</Text>
          <Text style={s.emptySubtitle}>Nenhum profissional com agenda configurada na clínica</Text>
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
          <Text style={s.dica}>Toque em um profissional para ver detalhes da agenda.</Text>
          {dados.map(prof => <ProfCard key={prof.id} prof={prof} />)}
        </ScrollView>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:     { flex: 1, backgroundColor: '#F1F5F9' },
  header:   { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 14, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  title:    { fontSize: 22, fontWeight: '800', color: '#0F172A', letterSpacing: -0.3 },
  subtitle: { fontSize: 12, color: '#64748B', marginTop: 2 },
  dica:     { fontSize: 12, color: '#94A3B8', textAlign: 'center', marginBottom: 8 },
  list:     { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24, gap: 10 },

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

  expandIcon: { fontSize: 11, color: '#94A3B8', marginTop: 4 },

  divider:       { height: 1, backgroundColor: '#E2E8F0' },
  detalheWrap:   {},
  detalheLoader: { marginVertical: 12 },
  detalhePad:    { padding: 14, paddingTop: 12 },

  detalheRow:              { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  detalheLabel:            { fontSize: 13, color: '#64748B' },
  detalheValor:            { fontSize: 13, fontWeight: '600', color: '#0F172A' },
  detalheBloco:            { marginTop: 8, marginBottom: 4 },
  detalheBlocoTitle:       { fontSize: 12, fontWeight: '700', color: '#2563EB', marginBottom: 4 },
  detalheBlocoTitleDanger: { fontSize: 12, fontWeight: '700', color: '#EF4444', marginBottom: 4 },
  detalheBlocoItem:        { fontSize: 12, color: '#64748B', marginBottom: 2 },
  detalheVazio:            { fontSize: 12, color: '#94A3B8', textAlign: 'center', paddingVertical: 8 },

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

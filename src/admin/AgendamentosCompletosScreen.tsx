import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { AppStackParams } from '../navigation/AppNavigator';
import {
  ArrowLeft, AlertTriangle, CalendarX,
  CheckCircle2, Clock, XCircle, UserX, RefreshCw,
} from 'lucide-react-native';
import { useAgendamentosHojeTodos } from '../hooks/useAgendamentosHojeTodos';
import { Agendamento, StatusAgendamento } from '../types/agendamento';

// ─── Paleta ───────────────────────────────────────────────────────────────────
const C = {
  primary:   '#1565C0',
  pageBg:    '#EEF2F7',
  surface:   '#FFFFFF',
  border:    '#E4EEF5',
  text:      '#1A2340',
  textSub:   '#5E7A8A',
  textMuted: '#8A9BB0',
  red:       '#C62828',
  redBg:     '#FFEBEE',
  amber:     '#E65100',
  amberBg:   '#FFF3E0',
  green:     '#2E7D32',
  greenBg:   '#E8F5E9',
  gray:      '#546E7A',
  grayBg:    '#ECEFF1',
  purple:    '#6A1B9A',
  purpleBg:  '#F3E5F5',
} as const;

// ─── Config por status ────────────────────────────────────────────────────────
type StatusCfg = { label: string; color: string; bg: string; accent: string; Icon: React.ComponentType<any> };

function getStatusCfg(item: Agendamento): StatusCfg {
  // Status clínico tem prioridade absoluta — só aguardando diferencia atrasado
  switch (item.status) {
    case 'realizado':      return { label: 'Realizado',      color: C.green,   bg: C.greenBg,  accent: C.green,   Icon: CheckCircle2 };
    case 'cancelado':      return { label: 'Cancelado',      color: C.gray,    bg: C.grayBg,   accent: C.gray,    Icon: XCircle      };
    case 'nao_compareceu': return { label: 'Não compareceu', color: C.amber,   bg: C.amberBg,  accent: C.amber,   Icon: UserX        };
    case 'remarcado':      return { label: 'Remarcado',      color: C.purple,  bg: C.purpleBg, accent: C.purple,  Icon: RefreshCw    };
    default: {
      const isAtrasado = item.visual_status?.alerta === true || item.status_operacional === 'atrasado';
      if (isAtrasado)      return { label: 'Atrasado',       color: C.red,     bg: C.redBg,    accent: C.red,     Icon: AlertTriangle };
      return                      { label: 'Aguardando',     color: C.primary, bg: '#EBF5FC',  accent: C.primary, Icon: Clock        };
    }
  }
}

// ─── Filtros ──────────────────────────────────────────────────────────────────
type FilterKey = 'todos' | StatusAgendamento;

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'todos',          label: 'Todos'      },
  { key: 'aguardando',     label: 'Aguardando' },
  { key: 'realizado',      label: 'Realizados' },
  { key: 'cancelado',      label: 'Cancelados' },
  { key: 'nao_compareceu', label: 'Ausências'  },
];

function countFor(key: FilterKey, items: Agendamento[]): number {
  if (key === 'todos') return items.filter(i => i.status !== 'remarcado').length;
  return items.filter(i => i.status === key).length;
}

function applyFilter(key: FilterKey, items: Agendamento[]): Agendamento[] {
  if (key === 'todos') return items.filter(i => i.status !== 'remarcado');
  return items.filter(i => i.status === key);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatHora(hora: string): string {
  return hora.slice(0, 5);
}

function formatDateLabel(): string {
  return new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'short', year: 'numeric',
  });
}

// ─── Chip de filtro ───────────────────────────────────────────────────────────
function FilterChip({ label, active, count, onPress }: {
  label: string; active: boolean; count: number; onPress: () => void;
}) {
  return (
    <TouchableOpacity style={[s.chip, active && s.chipActive]} onPress={onPress} activeOpacity={0.75}>
      <Text style={[s.chipText, active && s.chipTextActive]}>{label}</Text>
      {count > 0 && (
        <View style={[s.chipBadge, active && s.chipBadgeActive]}>
          <Text style={[s.chipBadgeText, active && s.chipBadgeTextActive]}>{count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ─── Card de agendamento ──────────────────────────────────────────────────────
function AgendamentoCard({ item }: { item: Agendamento }) {
  const cfg = getStatusCfg(item);

  return (
    <View style={s.card}>
      <View style={[s.cardAccent, { backgroundColor: cfg.accent }]} />

      <View style={s.cardTime}>
        <Text style={s.cardHoraInicio}>{formatHora(item.hora_inicio)}</Text>
        <Text style={s.cardHoraFim}>{formatHora(item.hora_fim)}</Text>
      </View>

      <View style={s.cardDivider} />

      <View style={s.cardBody}>
        <Text style={s.cardPatient} numberOfLines={1}>{item.paciente_nome}</Text>
        <Text style={s.cardProf} numberOfLines={1}>{item.profissional_nome}</Text>
      </View>

      <View style={[s.statusBadge, { backgroundColor: cfg.bg }]}>
        <cfg.Icon size={11} color={cfg.color} />
        <Text style={[s.statusText, { color: cfg.color }]}>{cfg.label}</Text>
      </View>
    </View>
  );
}

// ─── Tela principal ───────────────────────────────────────────────────────────
export function AgendamentosCompletosScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<AppStackParams, 'AgendamentosCompletos'>>();
  const { items, total, loading, loadingMore, error, sessionExpired, hasMore, refresh, loadMore } =
    useAgendamentosHojeTodos();

  const [filter, setFilter] = useState<FilterKey>(route.params?.initialFilter ?? 'todos');
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  const displayed = useMemo(() => applyFilter(filter, items), [filter, items]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const renderFooter = () =>
    loadingMore ? (
      <View style={s.footerLoader}>
        <ActivityIndicator size="small" color={C.primary} />
      </View>
    ) : null;

  const renderEmpty = () =>
    loading ? null : (
      <View style={s.emptyWrap}>
        <CalendarX size={52} color={C.textMuted} style={{ marginBottom: 16 }} />
        <Text style={s.emptyTitle}>Nenhum agendamento</Text>
        <Text style={s.emptyText}>
          {filter === 'todos'
            ? 'Não há agendamentos para hoje.'
            : `Nenhum agendamento com status "${FILTERS.find(f => f.key === filter)?.label ?? filter}".`}
        </Text>
      </View>
    );

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={C.primary} />

      {/* ── Header ── */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} activeOpacity={0.7}>
          <ArrowLeft size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Atendimentos do Dia</Text>
          <Text style={s.headerSub} numberOfLines={1}>{formatDateLabel()}</Text>
        </View>
        {!loading && (
          <View style={s.headerBadge}>
            <Text style={s.headerBadgeText}>{countFor('todos', items)}</Text>
          </View>
        )}
      </View>

      {/* ── Filtros (scroll horizontal) ── */}
      <View style={s.filterWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.filterBar}
        >
          {FILTERS.map(f => (
            <FilterChip
              key={f.key}
              label={f.label}
              active={filter === f.key}
              count={countFor(f.key, items)}
              onPress={() => setFilter(f.key)}
            />
          ))}
        </ScrollView>
      </View>

      {/* ── Conteúdo ── */}
      {loading && !refreshing ? (
        <View style={s.stateWrap}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={s.stateText}>Carregando atendimentos...</Text>
        </View>
      ) : (error || sessionExpired) ? (
        <View style={s.stateWrap}>
          <AlertTriangle size={44} color={C.amber} style={{ marginBottom: 14 }} />
          <Text style={s.stateTitle}>
            {sessionExpired ? 'Sessão expirada' : 'Falha ao carregar'}
          </Text>
          <Text style={s.stateText}>
            {sessionExpired ? 'Faça login novamente.' : error ?? 'Erro desconhecido.'}
          </Text>
          {!sessionExpired && (
            <TouchableOpacity style={s.retryBtn} onPress={refresh} activeOpacity={0.8}>
              <Text style={s.retryBtnText}>Tentar novamente</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={displayed}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh}
              colors={[C.primary]} tintColor={C.primary} />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          renderItem={({ item }) => <AgendamentoCard item={item} />}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.pageBg },

  // header
  header:          { backgroundColor: C.primary, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: 12, paddingBottom: 20, gap: 8 },
  backBtn:         { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  headerTitle:     { fontSize: 21, fontWeight: '800', color: '#fff' },
  headerSub:       { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2, textTransform: 'capitalize' },
  headerBadge:     { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 14, paddingHorizontal: 10, paddingVertical: 4 },
  headerBadgeText: { fontSize: 13, fontWeight: '800', color: '#fff' },

  // filtros
  filterWrap: { backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border },
  filterBar:  { paddingHorizontal: 16, paddingVertical: 10, gap: 8, flexDirection: 'row' },

  chip:               { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: C.border },
  chipActive:         { backgroundColor: '#EBF5FC', borderColor: C.primary },
  chipText:           { fontSize: 13, fontWeight: '600', color: C.textSub },
  chipTextActive:     { color: C.primary },
  chipBadge:          { backgroundColor: C.border, borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  chipBadgeActive:    { backgroundColor: C.primary },
  chipBadgeText:      { fontSize: 11, fontWeight: '700', color: C.textMuted },
  chipBadgeTextActive:{ color: '#fff' },

  // lista
  list: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 32 },

  // card
  card:           { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderRadius: 14, marginBottom: 10, overflow: 'hidden', borderWidth: 1, borderColor: C.border, shadowColor: '#0F172A', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  cardAccent:     { width: 4, alignSelf: 'stretch' },
  cardTime:       { alignItems: 'center', paddingHorizontal: 14, paddingVertical: 16, minWidth: 54 },
  cardHoraInicio: { fontSize: 15, fontWeight: '800', color: C.text },
  cardHoraFim:    { fontSize: 11, color: C.textMuted, marginTop: 3 },
  cardDivider:    { width: 1, height: 40, backgroundColor: C.border },
  cardBody:       { flex: 1, paddingHorizontal: 12, paddingVertical: 14, gap: 5 },
  cardPatient:    { fontSize: 14, fontWeight: '700', color: C.text },
  cardProf:       { fontSize: 12, color: C.textSub },
  statusBadge:    { flexDirection: 'row', alignItems: 'center', gap: 4, marginRight: 12, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 10 },
  statusText:     { fontSize: 11, fontWeight: '700' },

  // estados
  stateWrap:   { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingVertical: 48 },
  stateTitle:  { fontSize: 17, fontWeight: '700', color: C.text, marginBottom: 8, textAlign: 'center' },
  stateText:   { fontSize: 14, color: C.textMuted, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  retryBtn:     { backgroundColor: C.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  retryBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  emptyWrap:   { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
  emptyTitle:  { fontSize: 16, fontWeight: '700', color: C.text, marginBottom: 8 },
  emptyText:   { fontSize: 14, color: C.textMuted, textAlign: 'center', lineHeight: 22 },
  footerLoader: { paddingVertical: 20, alignItems: 'center' },
});

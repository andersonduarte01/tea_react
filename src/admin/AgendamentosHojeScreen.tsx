import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { ArrowLeft, User, Stethoscope, AlertTriangle, CalendarX, CheckCircle, Clock } from 'lucide-react-native';
import { useAgendamentosHoje } from '../hooks/useAgendamentosHoje';
import { Agendamento } from '../types/agendamento';

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
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatHora(hora: string): string {
  return hora.slice(0, 5);
}

function formatDateLabel(): string {
  return new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'short', year: 'numeric',
  });
}

// ─── Status config ────────────────────────────────────────────────────────────
function getStatusConfig(item: Agendamento) {
  const op         = item.status_operacional;
  const isAtrasado = op === 'atrasado' || item.visual_status?.alerta === true;

  if (isAtrasado)              return { label: 'Atrasado',   color: C.red,     bg: C.redBg,   accent: C.red,     Icon: AlertTriangle };
  if (op === 'confirmado')     return { label: 'Confirmado', color: C.green,   bg: C.greenBg, accent: C.green,   Icon: CheckCircle   };
  if (op === 'em_atendimento') return { label: 'Em Atend.',  color: C.amber,   bg: C.amberBg, accent: C.amber,   Icon: Clock         };
  return                              { label: 'Aguardando', color: C.primary, bg: '#EBF5FC', accent: C.primary, Icon: null          };
}

// ─── Card de agendamento ──────────────────────────────────────────────────────
function AgendamentoCard({ item }: { item: Agendamento }) {
  const cfg = getStatusConfig(item);

  return (
    <View style={s.card}>
      <View style={[s.cardAccent, { backgroundColor: cfg.accent }]} />

      <View style={s.cardTime}>
        <Text style={s.cardHoraInicio}>{formatHora(item.hora_inicio)}</Text>
        <Text style={s.cardHoraFim}>{formatHora(item.hora_fim)}</Text>
      </View>

      <View style={s.cardDivider} />

      <View style={s.cardBody}>
        <View style={s.cardRow}>
          <User size={13} color={C.textMuted} />
          <Text style={s.cardPatient} numberOfLines={1}>{item.paciente_nome}</Text>
        </View>
        <View style={s.cardRow}>
          <Stethoscope size={13} color={C.textMuted} />
          <Text style={s.cardProf} numberOfLines={1}>{item.profissional_nome}</Text>
        </View>
      </View>

      <View style={[s.statusBadge, { backgroundColor: cfg.bg }]}>
        {cfg.Icon && <cfg.Icon size={11} color={cfg.color} />}
        <Text style={[s.statusText, { color: cfg.color }]}>{cfg.label}</Text>
      </View>
    </View>
  );
}

// ─── Tela principal ───────────────────────────────────────────────────────────
export function AgendamentosHojeScreen() {
  const navigation = useNavigation();
  const { items, total, loading, loadingMore, error, sessionExpired, hasMore, refresh, loadMore } =
    useAgendamentosHoje();

  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={s.footerLoader}>
        <ActivityIndicator size="small" color={C.primary} />
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={s.emptyWrap}>
        <CalendarX size={52} color={C.textMuted} style={{ marginBottom: 16 }} />
        <Text style={s.emptyTitle}>Nenhum agendamento</Text>
        <Text style={s.emptyText}>Não há agendamentos aguardando para hoje.</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={C.primary} />

      {/* ── Header ── */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} activeOpacity={0.7}>
          <ArrowLeft size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Agenda do Dia</Text>
          <Text style={s.headerSub} numberOfLines={1}>{formatDateLabel()}</Text>
        </View>
        {!loading && (
          <View style={s.headerBadge}>
            <Text style={s.headerBadgeText}>{total}</Text>
          </View>
        )}
      </View>

      {/* ── Conteúdo ── */}
      {loading && !refreshing ? (
        <View style={s.stateWrap}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={s.stateText}>Carregando agenda...</Text>
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
          data={items}
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

  header:          { backgroundColor: C.primary, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: 12, paddingBottom: 20, gap: 8 },
  backBtn:         { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  headerTitle:     { fontSize: 21, fontWeight: '800', color: '#fff' },
  headerSub:       { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2, textTransform: 'capitalize' },
  headerBadge:     { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 14, paddingHorizontal: 10, paddingVertical: 4 },
  headerBadgeText: { fontSize: 13, fontWeight: '800', color: '#fff' },

  list: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 32 },

  card:           { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderRadius: 14, marginBottom: 10, overflow: 'hidden', borderWidth: 1, borderColor: C.border, shadowColor: '#0F172A', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  cardAccent:     { width: 4, alignSelf: 'stretch' },
  cardTime:       { alignItems: 'center', paddingHorizontal: 14, paddingVertical: 16, minWidth: 54 },
  cardHoraInicio: { fontSize: 15, fontWeight: '800', color: C.text },
  cardHoraFim:    { fontSize: 11, color: C.textMuted, marginTop: 3 },
  cardDivider:    { width: 1, height: 40, backgroundColor: C.border },
  cardBody:       { flex: 1, paddingHorizontal: 12, paddingVertical: 14, gap: 6 },
  cardRow:        { flexDirection: 'row', alignItems: 'center', gap: 5 },
  cardPatient:    { fontSize: 14, fontWeight: '700', color: C.text, flex: 1 },
  cardProf:       { fontSize: 12, color: C.textSub, flex: 1 },
  statusBadge:    { flexDirection: 'row', alignItems: 'center', gap: 4, marginRight: 12, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 10 },
  statusText:     { fontSize: 11, fontWeight: '700' },

  stateWrap:    { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingVertical: 48 },
  stateTitle:   { fontSize: 17, fontWeight: '700', color: C.text, marginBottom: 8, textAlign: 'center' },
  stateText:    { fontSize: 14, color: C.textMuted, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  retryBtn:     { backgroundColor: C.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  retryBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  emptyWrap:    { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
  emptyTitle:   { fontSize: 16, fontWeight: '700', color: C.text, marginBottom: 8 },
  emptyText:    { fontSize: 14, color: C.textMuted, textAlign: 'center', lineHeight: 22 },
  footerLoader: { paddingVertical: 20, alignItems: 'center' },
});

import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  StatusBar, FlatList, ActivityIndicator, Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft, Flag, Plus, CalendarX } from 'lucide-react-native';
import { AppStackParams } from '../navigation/AppNavigator';
import { getFeriados } from '../services/feriadoService';
import { Feriado } from '../types/feriado';
import { SessionExpiredError } from '../services/httpClient';
import { useClinica } from '../hooks/useClinica';

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  primary:      '#1565C0',
  primaryBg:    '#EBF5FC',
  pageBg:       '#F0F4F8',
  surface:      '#FFFFFF',
  surfaceAlt:   '#F8FAFC',
  border:       '#E2E8F0',
  text:         '#0F172A',
  textSub:      '#475569',
  textMuted:    '#94A3B8',
  green:        '#16A34A',
  greenLight:   '#F0FDF4',
  greenBorder:  '#86EFAC',
  gray:         '#64748B',
  grayLight:    '#F1F5F9',
  grayBorder:   '#CBD5E1',
  red:          '#DC2626',
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const MONTHS = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];

function getDayMonth(iso: string): { day: string; mon: string } {
  try {
    const d = new Date(iso + 'T00:00:00');
    return { day: String(d.getDate()).padStart(2, '0'), mon: MONTHS[d.getMonth()] };
  } catch { return { day: '--', mon: '---' }; }
}

function formatDateFull(iso: string): string {
  try {
    return new Date(iso + 'T00:00:00').toLocaleDateString('pt-BR', {
      day: '2-digit', month: 'long', year: 'numeric',
    });
  } catch { return iso; }
}

// ─── FeriadoItem ──────────────────────────────────────────────────────────────
function FeriadoItem({ item, clinicaNome }: { item: Feriado; clinicaNome: string }) {
  const { day, mon } = getDayMonth(item.data);
  return (
    <View style={fi.row}>
      <View style={fi.dateBadge}>
        <Text style={fi.dateDay}>{day}</Text>
        <Text style={fi.dateMon}>{mon}</Text>
      </View>
      <View style={fi.info}>
        <Text style={fi.descricao} numberOfLines={2}>{item.descricao}</Text>
        <Text style={fi.dateText} numberOfLines={1}>{clinicaNome}</Text>
      </View>
      <View style={[fi.badge, item.ativo ? fi.badgeAtivo : fi.badgeInativo]}>
        <Text style={[fi.badgeText, item.ativo ? fi.badgeAtivoText : fi.badgeInativoText]}>
          {item.ativo ? 'Ativo' : 'Inativo'}
        </Text>
      </View>
    </View>
  );
}

const fi = StyleSheet.create({
  row:             { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderRadius: 14, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2, gap: 12 },
  dateBadge:       { width: 46, height: 46, borderRadius: 10, backgroundColor: C.primaryBg, alignItems: 'center', justifyContent: 'center' },
  dateDay:         { fontSize: 16, fontWeight: '800', color: C.primary, lineHeight: 18 },
  dateMon:         { fontSize: 10, fontWeight: '600', color: C.primary, textTransform: 'uppercase' },
  info:            { flex: 1 },
  descricao:       { fontSize: 14, fontWeight: '700', color: C.text, marginBottom: 2 },
  dateText:        { fontSize: 12, color: C.textMuted },
  badge:           { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  badgeAtivo:      { backgroundColor: C.greenLight, borderColor: C.greenBorder },
  badgeInativo:    { backgroundColor: C.grayLight,  borderColor: C.grayBorder },
  badgeText:       { fontSize: 11, fontWeight: '700' },
  badgeAtivoText:  { color: C.green },
  badgeInativoText:{ color: C.gray },
});

// ─── EmptyState ───────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <View style={em.wrap}>
      <View style={em.iconWrap}>
        <CalendarX size={40} color={C.textMuted} />
      </View>
      <Text style={em.title}>Nenhum feriado cadastrado</Text>
      <Text style={em.sub}>Use o botão + para adicionar feriados locais.</Text>
    </View>
  );
}

const em = StyleSheet.create({
  wrap:     { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  iconWrap: { width: 72, height: 72, borderRadius: 36, backgroundColor: C.surfaceAlt, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  title:    { fontSize: 16, fontWeight: '700', color: C.textSub, marginBottom: 6 },
  sub:      { fontSize: 13, color: C.textMuted, textAlign: 'center' },
});

// ─── TELA ─────────────────────────────────────────────────────────────────────
export function FeriadosScreen() {
  const navigation              = useNavigation<NativeStackNavigationProp<AppStackParams>>();
  const { clinica }             = useClinica();
  const [feriados,   setFeriados]   = useState<Feriado[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const list = await getFeriados();
      setFeriados(list);
    } catch (err: unknown) {
      if (err instanceof SessionExpiredError) {
        Alert.alert('Sessão expirada', 'Faça login novamente.');
        return;
      }
      setError('Falha ao carregar feriados. Verifique sua conexão.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = useCallback(() => load(true), [load]);

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={C.primary} />

      {/* ── Header ── */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} activeOpacity={0.7}>
          <ArrowLeft size={22} color="rgba(255,255,255,0.9)" />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <View style={s.headerTitleRow}>
            <Flag size={16} color="rgba(255,255,255,0.85)" />
            <Text style={s.headerTitle}>Feriados</Text>
          </View>
          {!!clinica?.nome && (
            <Text style={s.headerSubtitle} numberOfLines={1}>{clinica.nome}</Text>
          )}
        </View>
        <TouchableOpacity
          style={s.addBtn}
          onPress={() => navigation.navigate('NovoFeriado')}
          activeOpacity={0.7}
        >
          <Plus size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* ── Body ── */}
      {loading ? (
        <View style={s.centerWrap}>
          <ActivityIndicator color={C.primary} size="large" />
        </View>
      ) : error ? (
        <View style={s.centerWrap}>
          <Text style={s.errorText}>{error}</Text>
          <TouchableOpacity style={s.retryBtn} onPress={() => load()} activeOpacity={0.8}>
            <Text style={s.retryText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={feriados}
          keyExtractor={item => String(item.id)}
          renderItem={({ item }) => <FeriadoItem item={item} clinicaNome={clinica?.nome ?? ''} />}
          contentContainerStyle={s.list}
          ListEmptyComponent={<EmptyState />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[C.primary]}
              tintColor={C.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:        { flex: 1, backgroundColor: C.pageBg },

  header:         { backgroundColor: C.primary, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: 16, paddingBottom: 32, borderBottomLeftRadius: 18, borderBottomRightRadius: 18, gap: 8 },
  backBtn:        { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  headerCenter:   { flex: 1, alignItems: 'flex-start' },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerTitle:    { fontSize: 21, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  headerSubtitle: { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '500', marginTop: 2 },
  addBtn:         { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },

  list:        { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 },

  centerWrap:  { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorText:   { fontSize: 14, color: C.red, textAlign: 'center', marginBottom: 16 },
  retryBtn:    { backgroundColor: C.primary, borderRadius: 10, paddingHorizontal: 24, paddingVertical: 10 },
  retryText:   { fontSize: 14, fontWeight: '700', color: '#fff' },
});

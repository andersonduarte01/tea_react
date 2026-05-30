import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, UserX, CalendarX, AlertTriangle, LockKeyhole } from 'lucide-react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useFaltasHoje } from '../hooks/useFaltasHoje';
import { FaltaProfissional } from '../types/falta';

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
  amber:     '#E65100',
} as const;

function todayFormatted(): string {
  return new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day:     'numeric',
    month:   'long',
  });
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(w => w.length > 1)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('');
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function ProfAvatar({ nome }: { nome: string }) {
  return (
    <View style={s.avatar}>
      <Text style={s.avatarText}>{getInitials(nome)}</Text>
    </View>
  );
}

// ─── Row de falta ─────────────────────────────────────────────────────────────
function FaltaRow({ falta }: { falta: FaltaProfissional }) {
  const dataFormatada = new Date(falta.data + 'T00:00:00').toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });

  return (
    <View style={s.row}>
      <ProfAvatar nome={falta.profissional_nome} />

      <View style={s.rowContent}>
        <Text style={s.rowName} numberOfLines={1}>{falta.profissional_nome}</Text>
        {falta.profissional_funcao ? (
          <Text style={s.rowFuncao} numberOfLines={1}>{falta.profissional_funcao}</Text>
        ) : null}
        <View style={s.rowMeta}>
          <View style={s.motivoBadge}>
            <Text style={s.motivoText} numberOfLines={1}>
              {falta.motivo ?? 'Sem motivo informado'}
            </Text>
          </View>
          <Text style={s.rowData}>{dataFormatada}</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Estado vazio ─────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <View style={s.emptyWrap}>
      <View style={s.emptyIcon}>
        <CalendarX size={40} color={C.primary} />
      </View>
      <Text style={s.emptyTitle}>Nenhuma falta hoje</Text>
      <Text style={s.emptyDesc}>Todos os profissionais estão presentes.</Text>
    </View>
  );
}

// ─── TELA ─────────────────────────────────────────────────────────────────────
export function FaltasHojeScreen() {
  const navigation = useNavigation();
  const { faltas, loading, error, sessionExpired, refresh } = useFaltasHoje();
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const renderContent = () => {
    if (loading && !refreshing) {
      return (
        <View style={s.stateWrap}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={s.stateText}>Carregando faltas...</Text>
        </View>
      );
    }

    if (sessionExpired) {
      return (
        <View style={s.stateWrap}>
          <LockKeyhole size={48} color={C.primary} style={{ marginBottom: 16 }} />
          <Text style={s.stateTitle}>Sessão expirada</Text>
          <Text style={s.stateText}>Faça login novamente para continuar.</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={s.stateWrap}>
          <AlertTriangle size={48} color={C.amber} style={{ marginBottom: 16 }} />
          <Text style={s.stateTitle}>Falha ao carregar</Text>
          <Text style={s.stateText}>{error}</Text>
          <TouchableOpacity style={s.retryBtn} onPress={refresh} activeOpacity={0.8}>
            <Text style={s.retryBtnText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <ScrollView
        style={s.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[C.primary]}
            tintColor={C.primary}
          />
        }
      >
        {faltas.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <View style={s.listHeader}>
              <Text style={s.listHeaderText}>
                {faltas.length} falta{faltas.length !== 1 ? 's' : ''} registrada{faltas.length !== 1 ? 's' : ''} hoje
              </Text>
            </View>

            <View style={s.card}>
              {faltas.map((falta, idx) => (
                <React.Fragment key={falta.id}>
                  <FaltaRow falta={falta} />
                  {idx < faltas.length - 1 && <View style={s.divider} />}
                </React.Fragment>
              ))}
            </View>
          </>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={C.headerBg} />

      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7} style={s.backBtn}>
          <ArrowLeft size={22} color="#fff" />
        </TouchableOpacity>

        <View style={s.headerCenter}>
          <View style={s.headerIconCircle}>
            <UserX size={22} color="#fff" />
          </View>
          <View>
            <Text style={s.headerTitle}>Faltas de Hoje</Text>
            <Text style={s.headerSub}>{todayFormatted()}</Text>
          </View>
        </View>

        <View style={s.headerRight} />
      </View>

      {renderContent()}
    </SafeAreaView>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:          { flex: 1, backgroundColor: C.pageBg },
  scroll:        { flex: 1 },
  scrollContent: { flexGrow: 1, paddingTop: 20 },

  header:          { backgroundColor: C.headerBg, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32, borderBottomLeftRadius: 18, borderBottomRightRadius: 18, flexDirection: 'row', alignItems: 'center' },
  backBtn:         { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerCenter:    { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 8 },
  headerIconCircle:{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  headerTitle:     { fontSize: 21, fontWeight: '800', color: '#fff' },
  headerSub:       { fontSize: 12, color: 'rgba(255,255,255,0.72)', marginTop: 2, textTransform: 'capitalize' },
  headerRight:     { width: 36 },

  listHeader:     { marginHorizontal: 16, marginBottom: 12 },
  listHeaderText: { fontSize: 14, fontWeight: '700', color: C.text },

  card:    { backgroundColor: C.surface, marginHorizontal: 16, borderRadius: 16, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  divider: { height: 1, backgroundColor: C.border, marginHorizontal: 16 },

  row:        { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, gap: 12 },
  rowContent: { flex: 1, minWidth: 0 },
  rowName:    { fontSize: 14, fontWeight: '700', color: C.text, marginBottom: 2 },
  rowFuncao:  { fontSize: 12, color: C.textSub, marginBottom: 6 },
  rowMeta:    { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  rowData:    { fontSize: 11, color: C.textMuted },

  motivoBadge: { backgroundColor: '#FEF3C7', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, maxWidth: 200 },
  motivoText:  { fontSize: 11, color: C.amber, fontWeight: '600' },

  avatar:     { width: 42, height: 42, borderRadius: 21, backgroundColor: C.primaryBg, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarText: { fontSize: 14, fontWeight: '700', color: C.primary },

  emptyWrap:  { alignItems: 'center', paddingTop: 64, paddingHorizontal: 40 },
  emptyIcon:  { width: 80, height: 80, borderRadius: 40, backgroundColor: C.primaryBg, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: C.text, marginBottom: 8, textAlign: 'center' },
  emptyDesc:  { fontSize: 14, color: C.textMuted, textAlign: 'center', lineHeight: 21 },

  stateWrap:    { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingVertical: 64 },
  stateTitle:   { fontSize: 17, fontWeight: '700', color: C.text, marginBottom: 8, textAlign: 'center' },
  stateText:    { fontSize: 14, color: C.textMuted, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  retryBtn:     { backgroundColor: C.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  retryBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});

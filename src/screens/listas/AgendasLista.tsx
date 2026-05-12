import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useApi } from '../../contexts/ApiContext';

// ─── Tipos ────────────────────────────────────────────────────────

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
  id:             number;   // ConfiguracaoAgenda.id
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
  profissional_id:          number;
  hora_almoco_inicio:       string | null;
  hora_almoco_fim:          string | null;
  atende_feriados_nacionais: boolean;
  atende_feriados_locais:    boolean;
  feriados_locais:           Feriado[];
  faltas:                    Falta[];
}

// ─── Dias da semana ───────────────────────────────────────────────

const DIAS: { key: keyof DiasTrabalho; label: string }[] = [
  { key: 'segunda', label: 'Seg' },
  { key: 'terca',   label: 'Ter' },
  { key: 'quarta',  label: 'Qua' },
  { key: 'quinta',  label: 'Qui' },
  { key: 'sexta',   label: 'Sex' },
  { key: 'sabado',  label: 'Sáb' },
  { key: 'domingo', label: 'Dom' },
];

// ─── Avatar ───────────────────────────────────────────────────────

function Avatar({ nome, fotoUrl }: { nome: string; fotoUrl?: string | null }) {
  const [imgErro, setImgErro] = useState(false);
  const initials = nome
    .split(' ')
    .filter(w => w.length > 2)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('');

  if (fotoUrl && !imgErro) {
    return (
      <Image
        source={{ uri: fotoUrl }}
        style={styles.avatarImg}
        onError={() => setImgErro(true)}
      />
    );
  }
  return (
    <View style={styles.avatar}>
      <Text style={styles.avatarText}>{initials}</Text>
    </View>
  );
}

// ─── Card expandível ──────────────────────────────────────────────

function ProfCard({
  prof,
  token,
  clinicaId,
  baseUrl,
}: {
  prof: ProfAgendaItem;
  token: string;
  clinicaId: number;
  baseUrl: string;
}) {
  const [expandido, setExpandido] = useState(false);
  const [detalhe, setDetalhe] = useState<ProfAgendaDetalhe | null>(null);
  const [loadingDetalhe, setLoadingDetalhe] = useState(false);

  const abrirDetalhe = useCallback(async () => {
    if (detalhe) { setExpandido(v => !v); return; }
    setExpandido(true);
    setLoadingDetalhe(true);
    try {
      const res = await fetch(`${baseUrl}/api/agenda/profissionais/${prof.id}/`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Clinica-ID': String(clinicaId),
        },
      });
      if (res.ok) {
        const json = await res.json();
        setDetalhe(json);
      }
    } finally {
      setLoadingDetalhe(false);
    }
  }, [detalhe, prof.id, token, clinicaId, baseUrl]);

  const dias = prof.dias_trabalho;

  return (
    <View style={styles.card}>
      {/* ── Linha principal ── */}
      <TouchableOpacity
        style={styles.cardHeader}
        onPress={abrirDetalhe}
        activeOpacity={0.75}
      >
        <Avatar nome={prof.nome} fotoUrl={prof.foto} />

        <View style={styles.cardInfo}>
          <Text style={styles.cardNome}>{prof.nome}</Text>
          <Text style={styles.cardFuncao}>{prof.funcao}</Text>
          <Text style={styles.cardHorario}>
            🕐 {prof.hora_inicio?.slice(0, 5)} – {prof.hora_fim?.slice(0, 5)}
            {'  ·  '}{prof.duracao_sessao} min/sessão
          </Text>

          {/* Chips de dias */}
          {dias && (
            <View style={styles.diasRow}>
              {DIAS.map(d => (
                <View
                  key={d.key}
                  style={[styles.diaChip, dias[d.key] && styles.diaChipAtivo]}
                >
                  <Text style={[styles.diaChipText, dias[d.key] && styles.diaChipTextAtivo]}>
                    {d.label}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <Text style={styles.expandIcon}>{expandido ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {/* ── Detalhe expandido ── */}
      {expandido && (
        <View style={styles.detalheWrap}>
          {loadingDetalhe ? (
            <ActivityIndicator size="small" color="#1565C0" style={{ marginVertical: 12 }} />
          ) : detalhe ? (
            <>
              <View style={styles.detalheDivider} />

              {/* Almoço */}
              {detalhe.hora_almoco_inicio && (
                <View style={styles.detalheRow}>
                  <Text style={styles.detalheLabel}>🍽 Almoço</Text>
                  <Text style={styles.detalheValor}>
                    {detalhe.hora_almoco_inicio.slice(0, 5)} – {detalhe.hora_almoco_fim?.slice(0, 5)}
                  </Text>
                </View>
              )}

              {/* Feriados */}
              <View style={styles.detalheRow}>
                <Text style={styles.detalheLabel}>🗓 Feriados nacionais</Text>
                <Text style={styles.detalheValor}>
                  {detalhe.atende_feriados_nacionais ? 'Atende' : 'Não atende'}
                </Text>
              </View>

              {/* Feriados locais */}
              {detalhe.feriados_locais.length > 0 && (
                <View style={styles.detalheBloco}>
                  <Text style={styles.detalheBlocoTitle}>
                    Feriados locais ({detalhe.feriados_locais.length})
                  </Text>
                  {detalhe.feriados_locais.map(f => (
                    <Text key={f.id} style={styles.detalheBlocoItem}>
                      • {formatarData(f.data)}  –  {f.descricao}
                    </Text>
                  ))}
                </View>
              )}

              {/* Faltas futuras */}
              {detalhe.faltas.length > 0 && (
                <View style={styles.detalheBloco}>
                  <Text style={[styles.detalheBlocoTitle, { color: '#B71C1C' }]}>
                    Faltas agendadas ({detalhe.faltas.length})
                  </Text>
                  {detalhe.faltas.map(f => (
                    <Text key={f.id} style={styles.detalheBlocoItem}>
                      • {formatarData(f.data)}
                      {f.motivo ? `  –  ${f.motivo}` : ''}
                    </Text>
                  ))}
                </View>
              )}

              {detalhe.feriados_locais.length === 0 && detalhe.faltas.length === 0 && (
                <Text style={styles.detalheVazio}>Sem feriados locais ou faltas futuras.</Text>
              )}
            </>
          ) : (
            <Text style={styles.detalheVazio}>Não foi possível carregar o detalhe.</Text>
          )}
        </View>
      )}
    </View>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────

function formatarData(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

// ─── Componente principal ─────────────────────────────────────────

export function AgendasLista() {
  const { user } = useAuth();
  const { baseUrl } = useApi();

  const [dados, setDados] = useState<ProfAgendaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const clinicaId =
    user?.clinicas.find(c => c.tipo_usuario === user?.tipo_usuario)?.id ??
    user?.clinicas[0]?.id;

  const carregar = useCallback(async (isRefresh = false) => {
    if (!user?.token || !clinicaId) {
      setErro('Dados de autenticação ausentes.');
      setLoading(false);
      return;
    }

    isRefresh ? setRefreshing(true) : setLoading(true);
    setErro(null);

    try {
      const res = await fetch(`${baseUrl}/api/agenda/profissionais/`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
          'X-Clinica-ID': String(clinicaId),
        },
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail ?? `Erro ${res.status}`);
      }

      const json = await res.json();
      setDados(Array.isArray(json) ? json : (json.results ?? []));
    } catch (e: any) {
      setErro(e.message ?? 'Erro ao carregar agendas.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.token, clinicaId, baseUrl]);

  useEffect(() => { carregar(); }, [carregar]);

  // ── Loading ──
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1565C0" />
        <Text style={styles.loadingText}>Carregando agendas...</Text>
      </View>
    );
  }

  // ── Erro ──
  if (erro) {
    return (
      <View style={styles.centered}>
        <Text style={styles.erroIcon}>⚠️</Text>
        <Text style={styles.erroText}>{erro}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => carregar()} activeOpacity={0.8}>
          <Text style={styles.retryBtnText}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Lista ──
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Agendas</Text>
          <Text style={styles.subtitle}>
            {dados.length} profissional{dados.length !== 1 ? 'is' : ''} com agenda ativa
          </Text>
        </View>
      </View>

      {/* Vazio */}
      {dados.length === 0 && (
        <View style={styles.centered}>
          <Text style={styles.emptyIcon}>📅</Text>
          <Text style={styles.emptyText}>Nenhuma agenda ativa na clínica.</Text>
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => carregar(true)}
            colors={['#1565C0']}
            tintColor="#1565C0"
          />
        }
      >
        <Text style={styles.dica}>Toque em um profissional para ver detalhes da agenda.</Text>
        {dados.map(prof => (
          <ProfCard
            key={prof.id}
            prof={prof}
            token={user!.token}
            clinicaId={clinicaId!}
            baseUrl={baseUrl}
          />
        ))}
      </ScrollView>
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F8FC' },

  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  loadingText: { marginTop: 12, fontSize: 14, color: '#5E7A8A' },
  erroIcon: { fontSize: 40, marginBottom: 12 },
  erroText: { fontSize: 14, color: '#B71C1C', textAlign: 'center', marginBottom: 20, lineHeight: 20 },
  retryBtn: { backgroundColor: '#1565C0', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  retryBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 14, color: '#5E7A8A', textAlign: 'center' },

  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#E4EEF5',
  },
  title: { fontSize: 20, fontWeight: '800', color: '#1A2340' },
  subtitle: { fontSize: 12, color: '#6B8498', marginTop: 2 },

  dica: { fontSize: 12, color: '#94A3B8', textAlign: 'center', marginBottom: 8 },

  list: { paddingHorizontal: 16, paddingVertical: 12, gap: 10 },

  // ── Card ──
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#0D4B8F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    gap: 12,
  },
  avatarImg: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#EBF5FC' },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EBF5FC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 16, fontWeight: '700', color: '#1565C0' },

  cardInfo: { flex: 1, gap: 3 },
  cardNome: { fontSize: 14, fontWeight: '700', color: '#1A2340' },
  cardFuncao: { fontSize: 13, color: '#5E7A8A' },
  cardHorario: { fontSize: 11, color: '#94A3B8', marginTop: 2 },

  diasRow: { flexDirection: 'row', gap: 4, marginTop: 6, flexWrap: 'wrap' },
  diaChip: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#F0F4F8',
  },
  diaChipAtivo: { backgroundColor: '#1565C0' },
  diaChipText: { fontSize: 10, fontWeight: '700', color: '#94A3B8' },
  diaChipTextAtivo: { color: '#fff' },

  expandIcon: { fontSize: 11, color: '#94A3B8', marginTop: 4 },

  // ── Detalhe ──
  detalheWrap: { paddingHorizontal: 16, paddingBottom: 14 },
  detalheDivider: { height: 1, backgroundColor: '#E4EEF5', marginBottom: 12 },
  detalheRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detalheLabel: { fontSize: 13, color: '#5E7A8A' },
  detalheValor: { fontSize: 13, fontWeight: '600', color: '#1A2340' },
  detalheBloco: { marginTop: 8, marginBottom: 4 },
  detalheBlocoTitle: { fontSize: 12, fontWeight: '700', color: '#1565C0', marginBottom: 4 },
  detalheBlocoItem: { fontSize: 12, color: '#5E7A8A', marginBottom: 2 },
  detalheVazio: { fontSize: 12, color: '#94A3B8', textAlign: 'center', paddingVertical: 8 },
});

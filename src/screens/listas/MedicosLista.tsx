import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useApi } from '../../contexts/ApiContext';

// ─── Tipos ────────────────────────────────────────────────────────
// id = ConfiguracaoAgenda.id  |  foto = URL absoluta (build_absolute_uri)
interface ProfissionalAPI {
  id: number;
  nome: string;
  funcao: string;
  foto: string | null;   // já vem como URL completa do servidor
  hora_inicio: string;
  hora_fim: string;
  duracao_sessao: number;
  intervalo: number;
}

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

// ─── Componente principal ─────────────────────────────────────────
export function MedicosLista() {
  const { user } = useAuth();
  const { baseUrl } = useApi();

  const [dados, setDados] = useState<ProfissionalAPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [busca, setBusca] = useState('');

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
      const res = await fetch(`${baseUrl}/api/profissional/`, {
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
      setErro(e.message ?? 'Erro ao carregar profissionais.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.token, clinicaId, baseUrl]);

  useEffect(() => { carregar(); }, [carregar]);

  const filtrados = dados.filter(p =>
    p.nome.toLowerCase().includes(busca.toLowerCase()) ||
    p.funcao.toLowerCase().includes(busca.toLowerCase()),
  );

  // ── Loading ──
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1565C0" />
        <Text style={styles.loadingText}>Carregando profissionais...</Text>
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
          <Text style={styles.title}>Médicos</Text>
          <Text style={styles.subtitle}>
            {dados.length} cadastrado{dados.length !== 1 ? 's' : ''}
          </Text>
        </View>
        <TouchableOpacity style={styles.addBtn} activeOpacity={0.8}>
          <Text style={styles.addBtnText}>+ Novo</Text>
        </TouchableOpacity>
      </View>

      {/* Busca */}
      <View style={styles.searchWrap}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nome ou função..."
          placeholderTextColor="#94A3B8"
          value={busca}
          onChangeText={setBusca}
        />
        {busca.length > 0 && (
          <TouchableOpacity onPress={() => setBusca('')} activeOpacity={0.7}>
            <Text style={styles.clearIcon}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Vazio */}
      {filtrados.length === 0 && (
        <View style={styles.centered}>
          <Text style={styles.emptyIcon}>👨‍⚕️</Text>
          <Text style={styles.emptyText}>
            {busca ? 'Nenhum resultado encontrado.' : 'Nenhum profissional cadastrado.'}
          </Text>
        </View>
      )}

      {/* Lista */}
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
        {filtrados.map(prof => {
          // foto já vem como URL absoluta do Django (build_absolute_uri)
          const fotoUrl = prof.foto ?? null;
          const statusAtivo = true;

          return (
            <TouchableOpacity key={prof.id} style={styles.card} activeOpacity={0.75}>
              <Avatar nome={prof.nome} fotoUrl={fotoUrl} />

              <View style={styles.cardInfo}>
                <Text style={styles.cardNome}>{prof.nome}</Text>
                <Text style={styles.cardFuncao}>{prof.funcao}</Text>

                {(prof.hora_inicio && prof.hora_fim) && (
                  <Text style={styles.cardHorario}>
                    🕐 {prof.hora_inicio?.slice(0, 5)} – {prof.hora_fim?.slice(0, 5)}
                  </Text>
                )}
              </View>

              <View style={[
                styles.statusBadge,
                { backgroundColor: statusAtivo ? '#E8F5E918' : '#FFEBEE18' },
              ]}>
                <View style={[
                  styles.statusDot,
                  { backgroundColor: statusAtivo ? '#2E7D32' : '#B71C1C' },
                ]} />
                <Text style={[
                  styles.statusText,
                  { color: statusAtivo ? '#2E7D32' : '#B71C1C' },
                ]}>
                  {statusAtivo ? 'Ativo' : 'Inativo'}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#E4EEF5',
  },
  title: { fontSize: 20, fontWeight: '800', color: '#1A2340' },
  subtitle: { fontSize: 12, color: '#6B8498', marginTop: 2 },
  addBtn: { backgroundColor: '#1565C0', paddingHorizontal: 16, paddingVertical: 9, borderRadius: 10 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E4EEF5',
    gap: 8,
  },
  searchIcon: { fontSize: 15 },
  searchInput: { flex: 1, height: 44, fontSize: 14, color: '#1A2340' },
  clearIcon: { fontSize: 14, color: '#94A3B8', paddingHorizontal: 4 },

  list: { paddingHorizontal: 16, paddingBottom: 16, paddingTop: 4, gap: 10 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#0D4B8F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  avatarImg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EBF5FC',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EBF5FC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 16, fontWeight: '700', color: '#1565C0' },

  cardInfo: { flex: 1, gap: 2 },
  cardNome: { fontSize: 14, fontWeight: '700', color: '#1A2340' },
  cardFuncao: { fontSize: 13, color: '#5E7A8A' },
  cardHorario: { fontSize: 11, color: '#94A3B8', marginTop: 2 },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 5,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '700' },
});

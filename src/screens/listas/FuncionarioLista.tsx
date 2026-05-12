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
// Espelha FuncionarioPerfilSerializer + campos de lista
// Endpoint necessário: GET /api/admin/funcionarios/  (X-Clinica-ID)
interface FuncionarioAPI {
  id: number;
  nome: string;
  email: string;
  funcao: string;
  telefone: string | null;
  foto: string | null;
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
export function FuncionarioLista() {
  const { user } = useAuth();
  const { baseUrl } = useApi();

  const [dados, setDados] = useState<FuncionarioAPI[]>([]);
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
      const res = await fetch(`${baseUrl}/api/funcionario/`, {
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
      setErro(e.message ?? 'Erro ao carregar funcionários.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.token, clinicaId, baseUrl]);

  useEffect(() => { carregar(); }, [carregar]);

  const filtrados = dados.filter(f =>
    f.nome.toLowerCase().includes(busca.toLowerCase()) ||
    f.funcao.toLowerCase().includes(busca.toLowerCase()),
  );

  // ── Loading ──
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1565C0" />
        <Text style={styles.loadingText}>Carregando funcionários...</Text>
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
          <Text style={styles.title}>Funcionários</Text>
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
          <Text style={styles.emptyIcon}>👷</Text>
          <Text style={styles.emptyText}>
            {busca ? 'Nenhum resultado encontrado.' : 'Nenhum funcionário cadastrado.'}
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
        {filtrados.map(func => (
          <TouchableOpacity key={func.id} style={styles.card} activeOpacity={0.75}>
            <Avatar nome={func.nome} fotoUrl={func.foto} />

            <View style={styles.cardInfo}>
              <Text style={styles.cardNome}>{func.nome}</Text>
              <Text style={styles.cardFuncao}>{func.funcao}</Text>
              {func.telefone && (
                <Text style={styles.cardTelefone}>📞 {func.telefone}</Text>
              )}
            </View>

            <View style={styles.funcaoBadge}>
              <Text style={styles.funcaoBadgeText} numberOfLines={2}>
                {func.funcao}
              </Text>
            </View>
          </TouchableOpacity>
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

  cardInfo: { flex: 1, gap: 2 },
  cardNome: { fontSize: 14, fontWeight: '700', color: '#1A2340' },
  cardFuncao: { fontSize: 13, color: '#5E7A8A' },
  cardTelefone: { fontSize: 11, color: '#94A3B8', marginTop: 2 },

  funcaoBadge: {
    backgroundColor: '#EBF5FC',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    maxWidth: 90,
    alignItems: 'center',
  },
  funcaoBadgeText: { fontSize: 11, fontWeight: '700', color: '#1565C0', textAlign: 'center' },
});

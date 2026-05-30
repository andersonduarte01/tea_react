import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  StatusBar,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage         from '@react-native-async-storage/async-storage';
import {
  Bell, LogOut, CalendarCheck, Users, Clock, AlertCircle,
  CalendarPlus, Flag, AlertTriangle, LockKeyhole, Menu,
  User, KeyRound, HelpCircle, ChevronRight, ArrowLeftRight,
  CalendarDays, Search,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParams }  from '../../navigation/AppNavigator';
import { useAuth }         from '../../contexts/AuthContext';
import { useClinica }      from '../../hooks/useClinica';
import {
  CalendarIcon, UsersIcon, HomeIcon, ThreeDotsIcon,
} from '../../components/DashboardLayout';
import { DashboardProfData, AlertaAPI } from '../../types/dashboard';
import { api, SessionExpiredError, getBaseUrl, STORAGE } from '../../services/httpClient';

const { width: W } = Dimensions.get('window');
const SIDEBAR_W    = 280;

// ─── Paleta ───────────────────────────────────────────────────────────────────
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
  tipBg:     '#E8F4FD',
  green:     '#2E7D32',
  amber:     '#E65100',
  red:       '#C62828',
} as const;

// ─── Hook ─────────────────────────────────────────────────────────────────────
interface ProfDashState {
  data:           DashboardProfData | null;
  loading:        boolean;
  error:          string | null;
  sessionExpired: boolean;
}

function useProfDashboard() {
  const [state, setState] = useState<ProfDashState>({
    data: null, loading: true, error: null, sessionExpired: false,
  });

  const fetchData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null, sessionExpired: false }));
    try {
      const data = await api.get<DashboardProfData>('/api/v1/clinica/dashboard/');
      setState({ data, loading: false, error: null, sessionExpired: false });
    } catch (err: unknown) {
      if (err instanceof SessionExpiredError) {
        setState({ data: null, loading: false, error: null, sessionExpired: true });
        return;
      }
      const message = (err as any)?.message ?? 'Erro ao carregar o painel.';
      setState(prev => ({ ...prev, loading: false, error: message }));
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  return { ...state, refresh: fetchData };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function resolveUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const u = url.trim();
  if (!u) return null;
  if (u.startsWith('http://') || u.startsWith('https://')) return u;
  const base = getBaseUrl().replace(/\/$/, '');
  return `${base}${u.startsWith('/') ? u : `/${u}`}`;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

function formatTime(iso: string) {
  try { return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }); }
  catch { return '--:--'; }
}

function getInitials(name: string): string {
  return name.split(' ').filter(w => w.length > 1).slice(0, 2).map(w => w[0].toUpperCase()).join('');
}

// ─── Ilustrações ──────────────────────────────────────────────────────────────
function LogoCircle() {
  return (
    <View style={ic.logoOuter}>
      <View style={ic.logoLeft} />
      <View style={ic.logoCross}>
        <View style={ic.logoCrossV} />
        <View style={ic.logoCrossH} />
      </View>
    </View>
  );
}

function ClinicaLogo({ uri, imgStyle }: { uri: string | null; imgStyle?: object }) {
  const [dataUri, setDataUri] = useState<string | null>(null);
  const safeUri = uri?.trim() || null;

  useEffect(() => {
    if (!safeUri) return;
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
      } catch { /* fallback para LogoCircle */ }
    })();

    return () => { cancelled = true; };
  }, [safeUri]);

  if (dataUri) {
    return <Image source={{ uri: dataUri }} style={[ic.clinicaFoto, imgStyle]} resizeMode="cover" />;
  }
  return <LogoCircle />;
}

function ProfAvatar({ uri, nome }: { uri: string | null; nome: string }) {
  const [dataUri, setDataUri] = useState<string | null>(null);
  const safeUri = uri?.trim() || null;

  useEffect(() => {
    if (!safeUri) return;
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
      } catch { /* fallback para iniciais */ }
    })();

    return () => { cancelled = true; };
  }, [safeUri]);

  if (dataUri) {
    return <Image source={{ uri: dataUri }} style={ic.profFoto} resizeMode="cover" />;
  }
  return (
    <View style={s.avatarSm}>
      <Text style={s.avatarText}>{getInitials(nome)}</Text>
    </View>
  );
}

function BellIcon({ badge }: { badge?: number }) {
  return (
    <View style={ic.bellWrap}>
      <Bell size={22} color="rgba(255,255,255,0.9)" />
      {badge != null && badge > 0 && (
        <View style={ic.bellBadge}>
          <Text style={ic.bellBadgeText}>{badge}</Text>
        </View>
      )}
    </View>
  );
}

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
function SidebarMenu({ translateX, onClose, clinicaFoto, clinicaNome, onLogout, showMudarClinica, onMudarClinica, onMeuPerfil, onAlterarSenha }: {
  translateX:       Animated.Value;
  onClose:          () => void;
  clinicaFoto:      string | null;
  clinicaNome:      string;
  onLogout:         () => void;
  showMudarClinica: boolean;
  onMudarClinica:   () => void;
  onMeuPerfil:      () => void;
  onAlterarSenha:   () => void;
}) {
  const SIDEBAR_ACTIONS: { icon: typeof User; label: string; onPress: () => void }[] = [
    { icon: User,     label: 'Meu Perfil',      onPress: onMeuPerfil },
    { icon: KeyRound, label: 'Atualizar Senha',  onPress: onAlterarSenha },
  ];

  return (
    <>
      <TouchableOpacity style={s.sidebarBackdrop} onPress={onClose} activeOpacity={1} />
      <Animated.View style={[s.sidebar, { transform: [{ translateX }] }]}>

        <View style={s.sidebarHeader}>
          <ClinicaLogo uri={clinicaFoto} imgStyle={ic.sidebarFoto} />
          <Text style={s.sidebarClinicaNome} numberOfLines={2}>{clinicaNome}</Text>
          <Text style={s.sidebarClinicaSub}>CLÍNICA</Text>
        </View>

        <View style={s.sidebarDivider} />

        <View style={s.sidebarNav}>
          {SIDEBAR_ACTIONS.map(item => (
            <TouchableOpacity key={item.label} style={s.sidebarItem} onPress={item.onPress} activeOpacity={0.7}>
              <View style={s.sidebarItemIcon}>
                <item.icon size={20} color={C.primary} />
              </View>
              <Text style={s.sidebarItemLabel}>{item.label}</Text>
              <ChevronRight size={16} color={C.textMuted} />
            </TouchableOpacity>
          ))}

          {showMudarClinica && (
            <>
              <View style={[s.sidebarDivider, { marginVertical: 4 }]} />
              <TouchableOpacity style={s.sidebarItem} onPress={onMudarClinica} activeOpacity={0.7}>
                <View style={[s.sidebarItemIcon, { backgroundColor: '#F0FDF4' }]}>
                  <ArrowLeftRight size={20} color={C.green} />
                </View>
                <Text style={s.sidebarItemLabel}>Mudar de Clínica</Text>
                <ChevronRight size={16} color={C.textMuted} />
              </TouchableOpacity>
            </>
          )}
        </View>

        <View style={{ flex: 1 }} />

        <View style={s.sidebarDivider} />

        <TouchableOpacity style={s.sidebarLogout} onPress={onLogout} activeOpacity={0.7}>
          <View style={s.sidebarLogoutIcon}>
            <LogOut size={20} color="#EF4444" />
          </View>
          <Text style={s.sidebarLogoutLabel}>Sair da conta</Text>
        </TouchableOpacity>

      </Animated.View>
    </>
  );
}

// ─── 1. HEADER ────────────────────────────────────────────────────────────────
function DashHeader({ name, alertCount, clinicaNome, onMenuPress, subtitle, showSearchIcon, searchActive, onSearchPress }: {
  name:            string;
  alertCount:      number;
  clinicaNome?:    string;
  onMenuPress:     () => void;
  subtitle?:       string;
  showSearchIcon?: boolean;
  searchActive?:   boolean;
  onSearchPress?:  () => void;
}) {
  const firstName = name.split(' ')[0];
  return (
    <View style={s.header}>
      <View style={s.greetingRow}>
        <TouchableOpacity onPress={onMenuPress} activeOpacity={0.7} style={s.menuBtn}>
          <Menu size={22} color="rgba(255,255,255,0.9)" />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={s.greetingClinica} numberOfLines={1}>{clinicaNome}</Text>
          <Text style={s.greetingTitle}>
            {subtitle !== undefined ? subtitle : `${getGreeting()}, ${firstName}!`}
          </Text>
        </View>

        <View style={s.headerRight}>
          <BellIcon badge={alertCount} />
          {showSearchIcon && (
            <TouchableOpacity
              onPress={onSearchPress}
              style={s.searchIconBtn}
              hitSlop={{ top: 4, bottom: 8, left: 8, right: 4 }}
              activeOpacity={0.7}
            >
              <Search size={18} color={searchActive ? '#fff' : 'rgba(255,255,255,0.65)'} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

// ─── 2. MÉTRICAS FLUTUANTES ───────────────────────────────────────────────────
function FloatingMetrics({ d, onPacientesPress, onAgendaPress }: {
  d: DashboardProfData; onPacientesPress: () => void; onAgendaPress: () => void;
}) {
  const items = [
    { id: '1', icon: (c: string) => <CalendarCheck size={22} color={c} />, value: d.consultas_hoje,       label: 'Consultas',    onPress: undefined },
    { id: '2', icon: (c: string) => <Users         size={22} color={c} />, value: d.pacientes_ativos,     label: 'Pacientes',    onPress: onPacientesPress },
    { id: '3', icon: (c: string) => <CalendarDays  size={22} color={c} />, value: d.agendamentos_abertos, label: 'Agendamentos', onPress: onAgendaPress },
    { id: '4', icon: (c: string) => <AlertCircle   size={22} color={c} />, value: d.faltas_pendentes,     label: 'Faltas',       onPress: undefined },
  ];
  return (
    <View style={s.floatingCard}>
      <View style={s.floatingRow}>
        {items.map((item, idx) => {
          const inner = (
            <>
              <View style={s.floatingIconCircle}>{item.icon(C.primary)}</View>
              <Text style={s.floatingValue}>{item.value}</Text>
              <Text style={s.floatingLabel}>{item.label}</Text>
            </>
          );
          return item.onPress ? (
            <TouchableOpacity
              key={item.id}
              style={[s.floatingItem, idx < items.length - 1 && s.floatingItemBorder]}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              {inner}
            </TouchableOpacity>
          ) : (
            <View key={item.id} style={[s.floatingItem, idx < items.length - 1 && s.floatingItemBorder]}>
              {inner}
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ─── 3. CARD AZUL — resumo crítico ────────────────────────────────────────────
function SummaryCard({
  d,
  onAgendamentosPress,
  onFaltasPress,
}: {
  d: DashboardProfData;
  onAgendamentosPress: () => void;
  onFaltasPress: () => void;
}) {
  const realizados = d.consultas_hoje;
  const pendentes  = d.agendamentos_abertos;
  const total      = realizados + pendentes;
  const temFaltas  = d.faltas_pendentes > 0;
  const pc         = d.proxima_consulta;

  return (
    <View style={s.blueCard}>
      {/* Topo — navega para agendamentos do dia */}
      <TouchableOpacity style={s.blueCardTop} onPress={onAgendamentosPress} activeOpacity={0.75}>
        <View style={s.blueCardIconCircle}>
          <CalendarIcon size={28} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.blueCardTopLabel}>RESUMO DO DIA</Text>
          <Text style={s.blueCardMain}>{total} Agendamentos</Text>
          <Text style={s.blueCardSub}>
            {realizados} realiz. · {pendentes} aguard.
          </Text>
        </View>
        <Text style={s.blueCardArrow}>›</Text>
      </TouchableOpacity>

      <View style={s.blueCardDivider} />

      {/* Rodapé — próxima consulta + faltas */}
      {temFaltas ? (
        <TouchableOpacity style={s.blueCardBottom} onPress={onFaltasPress} activeOpacity={0.75}>
          <View style={s.blueCardPersonCircle}>
            <Clock size={26} color="rgba(255,255,255,0.9)" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.blueCardPersonName}>
              {pc ? pc.paciente_nome : 'Próxima consulta'}
            </Text>
            <Text style={s.blueCardPersonSub}>
              {pc ? `${pc.hora} — ${pc.tipo}` : 'Agenda livre hoje'}
            </Text>
          </View>
          <View style={s.faltasBadgeRow}>
            <View style={[s.statusBadge, { backgroundColor: C.amber }]}>
              <Text style={s.statusText}>
                {d.faltas_pendentes} falta{d.faltas_pendentes > 1 ? 's' : ''}
              </Text>
            </View>
            <Text style={s.blueCardArrowSm}>›</Text>
          </View>
        </TouchableOpacity>
      ) : (
        <View style={s.blueCardBottom}>
          <View style={s.blueCardPersonCircle}>
            <Clock size={26} color="rgba(255,255,255,0.9)" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.blueCardPersonName}>
              {pc ? pc.paciente_nome : 'Agenda livre'}
            </Text>
            <Text style={s.blueCardPersonSub}>
              {pc ? `${pc.hora} — ${pc.tipo}` : 'Nenhuma consulta pendente hoje'}
            </Text>
          </View>
          <View style={[s.statusBadge, { backgroundColor: C.green }]}>
            <Text style={s.statusText}>✓ ok</Text>
          </View>
        </View>
      )}
    </View>
  );
}

// ─── 4. ACESSO RÁPIDO ─────────────────────────────────────────────────────────
const QUICK_ACCESS = [
  { id: '1', label: 'Novo',      sub: 'agendamento', icon: (c: string) => <CalendarPlus  size={24} color={c} /> },
  { id: '2', label: 'Nova',      sub: 'consulta',    icon: (c: string) => <CalendarCheck size={24} color={c} /> },
  { id: '3', label: 'Registrar', sub: 'falta',       icon: (c: string) => <AlertCircle   size={24} color={c} /> },
  { id: '4', label: 'Novo',      sub: 'formulário',  icon: (c: string) => <Flag          size={24} color={c} /> },
];

function QuickAccess({ onNovoAgendamento, onNovaConsulta, onRegistrarFalta }: {
  onNovoAgendamento: () => void;
  onNovaConsulta:    () => void;
  onRegistrarFalta:  () => void;
}) {
  const handlers: Record<string, (() => void) | undefined> = {
    '1': onNovoAgendamento,
    '2': onNovaConsulta,
    '3': onRegistrarFalta,
  };
  return (
    <View style={s.quickCard}>
      <View style={s.quickCardHeader}>
        <Text style={s.sectionTitle}>Acesso rápido</Text>
      </View>
      <View style={s.accessRow}>
        {QUICK_ACCESS.map(item => (
          <TouchableOpacity key={item.id} style={s.accessItem} activeOpacity={0.7} onPress={handlers[item.id]}>
            <View style={s.accessCircle}>{item.icon(C.primary)}</View>
            <Text style={s.accessLabel}>{item.label}</Text>
            <Text style={s.accessSub}>{item.sub}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ─── 5. ALERTAS ───────────────────────────────────────────────────────────────
const ALERT_ACCENT: Record<string, string> = { warning: C.amber, error: C.red, info: C.primary };
const BADGE_BG: Record<string, string>     = { danger: '#FECACA', warning: '#FED7AA', info: '#BFDBFE', success: '#BBF7D0', default: '#E5E7EB' };
const BADGE_TEXT: Record<string, string>   = { danger: C.red,     warning: C.amber,   info: C.primary, success: C.green,  default: C.textMuted };

function AlertBadge({ label, variant }: { label: string; variant: string }) {
  return (
    <View style={[s.badge, { backgroundColor: BADGE_BG[variant] ?? BADGE_BG.default }]}>
      <Text style={[s.badgeText, { color: BADGE_TEXT[variant] ?? BADGE_TEXT.default }]}>{label}</Text>
    </View>
  );
}

function AlertsOrTipCard({ alertas }: { alertas: AlertaAPI[] }) {
  if (alertas.length === 0) return null;

  return (
    <View style={s.alertsCard}>
      <Text style={s.alertsTitle}>Alertas ativos</Text>
      {alertas.map((a, i) => (
        <View key={i} style={[s.alertRow, { borderLeftColor: ALERT_ACCENT[a.tipo] ?? C.primary }]}>
          <View style={{ flex: 1 }}>
            <Text style={s.alertTitle}>{a.titulo}</Text>
            <Text style={s.alertDesc}>{a.descricao}</Text>
          </View>
          <AlertBadge
            label={String(a.quantidade)}
            variant={a.tipo === 'error' ? 'danger' : a.tipo === 'warning' ? 'warning' : 'info'}
          />
        </View>
      ))}
    </View>
  );
}

// ─── 6. ATIVIDADE RECENTE ─────────────────────────────────────────────────────
const ACT_COLOR: Record<string, string> = {
  success: C.green, info: C.primary, warning: C.amber, error: C.red,
};

const TIPO_LABEL: Record<string, string> = {
  consulta_realizada:  'Consulta realizada',
  ausencia_registrada: 'Ausência registrada',
};

function getActivityLabel(tipo: string, descricao: string): string {
  if (TIPO_LABEL[tipo]) return TIPO_LABEL[tipo];
  if (tipo === 'agendamento_criado') {
    const d = descricao.toLowerCase();
    if (d.includes('remarcado'))                               return 'Agendamento remarcado';
    if (d.includes('cancelado'))                               return 'Agendamento cancelado';
    if (d.includes('não compareceu') || d.includes('nao compareceu')) return 'Agendamento falta';
    return 'Agendamento criado';
  }
  return tipo.replace(/_/g, ' ');
}

function ActivitySection({ d }: { d: DashboardProfData }) {
  if (d.atividade_recente.length === 0) return null;
  return (
    <>
      <View style={s.sectionHeader}>
        <Text style={s.sectionTitle}>Atividade recente</Text>
      </View>
      <View style={s.listCard}>
        {d.atividade_recente.slice(0, 6).map((item, i) => {
          const color = ACT_COLOR[item.status] ?? C.textMuted;
          const last  = i === Math.min(d.atividade_recente.length, 6) - 1;
          const label = getActivityLabel(item.tipo, item.descricao);
          return (
            <View key={item.id} style={s.actItem}>
              <View style={s.actTimeline}>
                <View style={[s.actDot, { backgroundColor: color }]} />
                {!last && <View style={s.actLine} />}
              </View>
              <View style={[s.actBody, last && s.actBodyLast]}>
                <View style={s.actInner}>
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <Text style={s.actType}>{label}</Text>
                    <Text style={s.actDesc} numberOfLines={1}>{item.descricao}</Text>
                  </View>
                  <Text style={s.actTime}>{formatTime(item.timestamp)}</Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </>
  );
}

// ─── CONTEÚDO PRINCIPAL ───────────────────────────────────────────────────────
function MainContent({
  data, refreshing, onRefresh,
  onSummaryPress, onFaltasPress, onPacientesPress, onAgendaPress,
  onNovoAgendamento, onNovaConsulta, onRegistrarFalta,
}: {
  data: DashboardProfData; refreshing: boolean; onRefresh: () => void;
  onSummaryPress: () => void; onFaltasPress: () => void;
  onPacientesPress: () => void; onAgendaPress: () => void;
  onNovoAgendamento: () => void; onNovaConsulta: () => void; onRegistrarFalta: () => void;
}) {
  return (
    <ScrollView
      style={s.scroll}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={s.scrollContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh}
          colors={[C.primary]} tintColor={C.primary} />
      }
    >
      <FloatingMetrics d={data} onPacientesPress={onPacientesPress} onAgendaPress={onAgendaPress} />
      <SummaryCard d={data} onAgendamentosPress={onSummaryPress} onFaltasPress={onFaltasPress} />
      <QuickAccess
        onNovoAgendamento={onNovoAgendamento}
        onNovaConsulta={onNovaConsulta}
        onRegistrarFalta={onRegistrarFalta}
      />
      <AlertsOrTipCard alertas={[]} />
      <ActivitySection d={data} />
      <View style={{ height: 90 }} />
    </ScrollView>
  );
}

// ─── ESTADOS ──────────────────────────────────────────────────────────────────
function LoadingContent() {
  return (
    <View style={s.stateWrap}>
      <ActivityIndicator size="large" color={C.primary} />
      <Text style={s.stateText}>Carregando painel...</Text>
    </View>
  );
}

function ErrorContent({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={s.stateWrap}>
      <AlertTriangle size={48} color={C.amber} style={{ marginBottom: 16 }} />
      <Text style={s.stateTitle}>Falha ao carregar</Text>
      <Text style={s.stateText}>{message}</Text>
      <TouchableOpacity style={s.retryBtn} onPress={onRetry} activeOpacity={0.8}>
        <Text style={s.retryBtnText}>Tentar novamente</Text>
      </TouchableOpacity>
    </View>
  );
}

function SessionExpiredContent({ onLogout }: { onLogout: () => void }) {
  return (
    <View style={s.stateWrap}>
      <LockKeyhole size={48} color={C.primary} style={{ marginBottom: 16 }} />
      <Text style={s.stateTitle}>Sessão expirada</Text>
      <Text style={s.stateText}>Sua sessão expirou. Faça login novamente.</Text>
      <TouchableOpacity style={s.retryBtn} onPress={onLogout} activeOpacity={0.8}>
        <Text style={s.retryBtnText}>Ir para o login</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── TABS ─────────────────────────────────────────────────────────────────────
type TabKey = 'home' | 'pacientes' | 'agendas' | 'historico' | 'mais';

const TABS: { key: TabKey; label: string; icon: (active: boolean) => React.ReactNode }[] = [
  { key: 'home',      label: 'Início',    icon: a => <HomeIcon     color={a ? C.primary : C.textMuted} /> },
  { key: 'pacientes', label: 'Pacientes', icon: a => <UsersIcon    size={22} color={a ? C.primary : C.textMuted} /> },
  { key: 'agendas',   label: 'Agendas',  icon: a => <CalendarIcon size={22} color={a ? C.primary : C.textMuted} /> },
  { key: 'historico', label: 'Histórico', icon: a => <CalendarCheck size={22} color={a ? C.primary : C.textMuted} /> },
  { key: 'mais',      label: 'Mais',      icon: _  => <ThreeDotsIcon /> },
];

// ─── PROFISSIONAL DASHBOARD ───────────────────────────────────────────────────
export function ProfissionalDashboard() {
  const { user, clinicaAtual, logout, atualizarFotoClinica } = useAuth();
  const { clinica: clinicaDetalhe }                          = useClinica();
  const { data, loading, error, sessionExpired, refresh }    = useProfDashboard();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParams>>();
  const temMultiplasClinicas = (user?.clinicas?.length ?? 0) > 1;

  const [activeTab,         setActiveTab]         = useState<TabKey>('home');
  const [maisOpen,          setMaisOpen]          = useState(false);
  const [sidebarOpen,       setSidebarOpen]       = useState(false);
  const [refreshing,        setRefreshing]        = useState(false);
  const [pacCount,          setPacCount]          = useState(0);
  const [agendaComCount,    setAgendaComCount]    = useState(0);
  const [agendaSemCount,    setAgendaSemCount]    = useState(0);
  const [histCount,         setHistCount]         = useState(0);
  const [searchOpenPac,     setSearchOpenPac]     = useState(false);
  const [searchOpenAgendas, setSearchOpenAgendas] = useState(false);
  const [searchOpenHist,    setSearchOpenHist]    = useState(false);
  const [buscaPac,          setBuscaPac]          = useState('');
  const [buscaAgendas,      setBuscaAgendas]      = useState('');
  const [buscaHist,         setBuscaHist]         = useState('');
  const sidebarX = useRef(new Animated.Value(-SIDEBAR_W)).current;

  const openSidebar = useCallback(() => {
    setSidebarOpen(true);
    Animated.timing(sidebarX, { toValue: 0, duration: 240, useNativeDriver: true }).start();
  }, [sidebarX]);

  const closeSidebar = useCallback(() => {
    Animated.timing(sidebarX, { toValue: -SIDEBAR_W, duration: 200, useNativeDriver: true })
      .start(() => setSidebarOpen(false));
  }, [sidebarX]);

  const name        = user?.nome ?? 'Profissional';
  const clinicaNome = clinicaAtual?.nome ?? clinicaDetalhe?.nome ?? 'Clínica';
  const clinicaFoto = resolveUrl(clinicaAtual?.foto ?? clinicaDetalhe?.foto);

  useEffect(() => {
    if (clinicaDetalhe?.foto && clinicaAtual?.id && !clinicaAtual.foto) {
      atualizarFotoClinica(clinicaAtual.id, clinicaDetalhe.foto);
    }
  }, [clinicaDetalhe?.foto, clinicaAtual?.id, clinicaAtual?.foto, atualizarFotoClinica]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const handleMudarClinica = useCallback(() => {
    closeSidebar();
    navigation.replace('ClinicaSelector');
  }, [closeSidebar, navigation]);

  const handleMeuPerfil = useCallback(() => {
    closeSidebar();
    navigation.navigate('MeuPerfilProfissional');
  }, [closeSidebar, navigation]);

  const handleAlterarSenha = useCallback(() => {
    closeSidebar();
    navigation.navigate('AlterarSenha');
  }, [closeSidebar, navigation]);

  const handleFeriados = useCallback(() => {
    setMaisOpen(false);
    navigation.navigate('Feriados');
  }, [navigation]);

  // Handlers de acesso rápido — sem link por ora
  const handleNovoAgendamento = useCallback(() => {}, []);
  const handleNovaConsulta    = useCallback(() => {}, []);
  const handleRegistrarFalta  = useCallback(() => {}, []);

  const switchTab = useCallback((key: TabKey) => {
    setActiveTab(key);
    setMaisOpen(false);
    if (key !== 'pacientes') { setSearchOpenPac(false); setBuscaPac(''); }
    if (key !== 'agendas')   { setSearchOpenAgendas(false); setBuscaAgendas(''); }
    if (key !== 'historico') { setSearchOpenHist(false); setBuscaHist(''); }
  }, []);

  const handleTab = (key: TabKey) => {
    if (key === 'mais') setMaisOpen(p => !p);
    else switchTab(key);
  };

  const handleToggleSearchPac = useCallback(() => {
    setSearchOpenPac(v => { if (v) setBuscaPac(''); return !v; });
  }, []);

  const handleToggleSearchAgendas = useCallback(() => {
    setSearchOpenAgendas(v => { if (v) setBuscaAgendas(''); return !v; });
  }, []);

  const handleToggleSearchHist = useCallback(() => {
    setSearchOpenHist(v => { if (v) setBuscaHist(''); return !v; });
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'pacientes':
        // TODO: <PacientesLista buscaExterna={buscaPac} onBuscaChange={setBuscaPac} onCountChange={setPacCount} />
        return <LoadingContent />;
      case 'agendas':
        // TODO: <AgendasLista buscaExterna={buscaAgendas} onBuscaChange={setBuscaAgendas} onCountChange={...} />
        return <LoadingContent />;
      case 'historico':
        // TODO: <HistoricoLista buscaExterna={buscaHist} onBuscaChange={setBuscaHist} onCountChange={setHistCount} />
        return <LoadingContent />;
      default:
        if (loading && !refreshing) return <LoadingContent />;
        if (sessionExpired)         return <SessionExpiredContent onLogout={logout} />;
        if (error)                  return <ErrorContent message={error} onRetry={refresh} />;
        if (!data)                  return <LoadingContent />;
        return (
          <MainContent
            data={data} refreshing={refreshing} onRefresh={onRefresh}
            onSummaryPress={() => {}}    // TODO: AgendamentosHoje
            onFaltasPress={() => {}}     // TODO: FaltasHoje
            onPacientesPress={() => switchTab('pacientes')}
            onAgendaPress={() => switchTab('agendas')}
            onNovoAgendamento={handleNovoAgendamento}
            onNovaConsulta={handleNovaConsulta}
            onRegistrarFalta={handleRegistrarFalta}
          />
        );
    }
  };

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={C.headerBg} />

      <DashHeader
        name={name}
        alertCount={0}
        clinicaNome={clinicaNome}
        onMenuPress={openSidebar}
        subtitle={
          activeTab === 'pacientes'
            ? `${pacCount} paciente${pacCount !== 1 ? 's' : ''} cadastrado${pacCount !== 1 ? 's' : ''}`
            : activeTab === 'agendas'
            ? `${agendaComCount} com agenda · ${agendaSemCount} pendente${agendaSemCount !== 1 ? 's' : ''}`
            : activeTab === 'historico'
            ? `${histCount} registro${histCount !== 1 ? 's' : ''}`
            : undefined
        }
        showSearchIcon={activeTab === 'pacientes' || activeTab === 'agendas' || activeTab === 'historico'}
        searchActive={
          activeTab === 'pacientes' ? searchOpenPac :
          activeTab === 'agendas'   ? searchOpenAgendas :
          activeTab === 'historico' ? searchOpenHist : false
        }
        onSearchPress={
          activeTab === 'pacientes' ? handleToggleSearchPac :
          activeTab === 'agendas'   ? handleToggleSearchAgendas :
          handleToggleSearchHist
        }
      />

      {/* Barra de busca flutuante — pacientes */}
      {activeTab === 'pacientes' && searchOpenPac && (
        <View style={s.searchFloat}>
          <Search size={15} color="#94A3B8" />
          <TextInput
            style={s.searchFloatInput}
            value={buscaPac}
            onChangeText={setBuscaPac}
            placeholder="Buscar por nome..."
            placeholderTextColor="#94A3B8"
            autoFocus
            returnKeyType="search"
          />
          {buscaPac.length > 0 && (
            <TouchableOpacity
              onPress={() => setBuscaPac('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={s.searchFloatClear}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Barra de busca flutuante — agendas */}
      {activeTab === 'agendas' && searchOpenAgendas && (
        <View style={s.searchFloat}>
          <Search size={15} color="#94A3B8" />
          <TextInput
            style={s.searchFloatInput}
            value={buscaAgendas}
            onChangeText={setBuscaAgendas}
            placeholder="Buscar por nome..."
            placeholderTextColor="#94A3B8"
            autoFocus
            returnKeyType="search"
          />
          {buscaAgendas.length > 0 && (
            <TouchableOpacity
              onPress={() => setBuscaAgendas('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={s.searchFloatClear}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Barra de busca flutuante — histórico */}
      {activeTab === 'historico' && searchOpenHist && (
        <View style={s.searchFloat}>
          <Search size={15} color="#94A3B8" />
          <TextInput
            style={s.searchFloatInput}
            value={buscaHist}
            onChangeText={setBuscaHist}
            placeholder="Buscar no histórico..."
            placeholderTextColor="#94A3B8"
            autoFocus
            returnKeyType="search"
          />
          {buscaHist.length > 0 && (
            <TouchableOpacity
              onPress={() => setBuscaHist('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={s.searchFloatClear}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {renderContent()}

      {maisOpen && (
        <TouchableOpacity style={s.backdrop} onPress={() => setMaisOpen(false)} activeOpacity={1} />
      )}

      {maisOpen && (
        <View style={s.maisMenu}>
          <TouchableOpacity style={s.maisMenuItem} onPress={handleFeriados} activeOpacity={0.7}>
            <View style={[s.maisMenuIconWrap, { backgroundColor: '#EFF6FF' }]}>
              <Flag size={20} color={C.primary} />
            </View>
            <Text style={[s.maisMenuLabel, { color: C.primary }]}>Feriados</Text>
          </TouchableOpacity>
          <View style={s.maisMenuDivider} />
          <TouchableOpacity style={s.maisMenuItem} activeOpacity={0.7}>
            <View style={[s.maisMenuIconWrap, { backgroundColor: '#EFF6FF' }]}>
              <HelpCircle size={20} color={C.primary} />
            </View>
            <Text style={[s.maisMenuLabel, { color: C.primary }]}>Ajuda</Text>
          </TouchableOpacity>
        </View>
      )}

      {sidebarOpen && (
        <SidebarMenu
          translateX={sidebarX}
          onClose={closeSidebar}
          clinicaFoto={clinicaFoto}
          clinicaNome={clinicaNome}
          onLogout={logout}
          showMudarClinica={temMultiplasClinicas}
          onMudarClinica={handleMudarClinica}
          onMeuPerfil={handleMeuPerfil}
          onAlterarSenha={handleAlterarSenha}
        />
      )}

      <View style={s.bottomNav}>
        {TABS.map(tab => {
          const isMais = tab.key === 'mais';
          const active = isMais ? maisOpen : activeTab === tab.key;
          return (
            <TouchableOpacity key={tab.key} style={s.tabItem}
              onPress={() => handleTab(tab.key)} activeOpacity={0.7}>
              <View style={s.tabIconWrap}>{tab.icon(active)}</View>
              <Text style={[s.tabLabel, active && s.tabLabelActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

// ─── ICON STYLES ──────────────────────────────────────────────────────────────
const ic = StyleSheet.create({
  clinicaFoto:   { width: 46, height: 46, borderRadius: 23, backgroundColor: '#B8D9F0' },
  profFoto:      { width: 36, height: 36, borderRadius: 18, backgroundColor: '#B8D9F0' },
  sidebarFoto:   { width: 72, height: 72, borderRadius: 36, backgroundColor: '#B8D9F0' },
  logoOuter:     { width: 46, height: 46, borderRadius: 23, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  logoLeft:      { position: 'absolute', left: 0, top: 0, width: 23, height: 46, backgroundColor: '#1976D2' },
  logoCross:     { width: 22, height: 22, alignItems: 'center', justifyContent: 'center' },
  logoCrossV:    { position: 'absolute', width: 6, height: 22, backgroundColor: '#fff', borderRadius: 2 },
  logoCrossH:    { position: 'absolute', width: 22, height: 6, backgroundColor: '#fff', borderRadius: 2 },
  bellWrap:      { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  bellBadge:     { position: 'absolute', top: -2, right: -4, backgroundColor: '#fff', borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  bellBadgeText: { color: C.primary, fontSize: 10, fontWeight: 'bold' },
});

// ─── STYLES ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:          { flex: 1, backgroundColor: C.pageBg },
  scroll:        { flex: 1, backgroundColor: C.pageBg },
  scrollContent: { flexGrow: 1 },

  // header
  header:          { backgroundColor: C.headerBg, paddingHorizontal: 12, paddingTop: 16, paddingBottom: 32, borderBottomLeftRadius: 18, borderBottomRightRadius: 18 },
  menuBtn:         { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', marginRight: 4 },
  greetingRow:     { flexDirection: 'row', alignItems: 'flex-start' },
  greetingClinica: { fontSize: 18, fontWeight: '800', color: '#fff', marginBottom: 3 },
  greetingTitle:   { fontSize: 12, fontWeight: '500', color: 'rgba(255,255,255,0.75)' },
  headerRight:     { alignItems: 'center', gap: 8 },
  searchIconBtn:   { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },

  // floating search bar
  searchFloat:      { marginHorizontal: 16, marginTop: -20, backgroundColor: '#fff', borderRadius: 14, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 10, height: 48, borderWidth: 1, borderColor: C.border, shadowColor: C.headerBg, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.18, shadowRadius: 12, elevation: 8, zIndex: 10 },
  searchFloatInput: { flex: 1, fontSize: 14, color: C.text },
  searchFloatClear: { fontSize: 14, color: '#94A3B8' },

  // floating card
  floatingCard:       { backgroundColor: C.surface, marginHorizontal: 16, marginTop: 10, borderRadius: 18, padding: 18, borderWidth: 1, borderColor: C.border, marginBottom: 16 },
  floatingRow:        { flexDirection: 'row', justifyContent: 'space-between' },
  floatingItem:       { alignItems: 'center', flex: 1, paddingVertical: 2 },
  floatingItemBorder: { borderRightWidth: 1, borderRightColor: C.border },
  floatingIconCircle: { width: 46, height: 46, borderRadius: 23, backgroundColor: C.primaryBg, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  floatingValue:      { fontSize: 18, fontWeight: '800', color: C.text, letterSpacing: -0.5 },
  floatingLabel:      { fontSize: 9,  color: C.textSub, fontWeight: '600', textAlign: 'center', marginTop: 2 },

  // blue card
  blueCard:            { backgroundColor: C.primary, marginHorizontal: 16, borderRadius: 18, padding: 20, marginBottom: 28, shadowColor: C.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 14, elevation: 8 },
  blueCardTop:         { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  blueCardIconCircle:  { width: 62, height: 62, borderRadius: 31, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  blueCardTopLabel:    { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '600', letterSpacing: 1, marginBottom: 4, textTransform: 'uppercase' },
  blueCardMain:        { fontSize: 22, fontWeight: '900', color: '#fff', letterSpacing: -0.5, marginBottom: 4 },
  blueCardSub:         { fontSize: 13, color: 'rgba(255,255,255,0.78)', marginTop: 1 },
  blueCardArrow:       { fontSize: 30, color: 'rgba(255,255,255,0.7)' },
  blueCardDivider:     { height: 1, backgroundColor: 'rgba(255,255,255,0.22)', marginBottom: 16 },
  blueCardBottom:      { flexDirection: 'row', alignItems: 'center' },
  blueCardPersonCircle:{ width: 60, height: 60, borderRadius: 27, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  blueCardPersonName:  { fontSize: 15, fontWeight: '700', color: '#fff', marginBottom: 2 },
  blueCardPersonSub:   { fontSize: 12, color: 'rgba(255,255,255,0.72)' },
  statusBadge:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 11, paddingVertical: 6, borderRadius: 20, gap: 4 },
  statusText:          { color: '#fff', fontSize: 12, fontWeight: '600' },
  faltasBadgeRow:      { flexDirection: 'row', alignItems: 'center', gap: 4 },
  blueCardArrowSm:     { fontSize: 22, color: 'rgba(255,255,255,0.75)', marginLeft: 2 },

  // quick access
  quickCard:       { backgroundColor: C.surface, marginHorizontal: 16, marginBottom: 20, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.border },
  quickCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 20, marginBottom: 16 },
  sectionTitle:    { fontSize: 16, fontWeight: '800', color: C.text },
  seeAll:          { fontSize: 14, color: C.primary, fontWeight: '600' },
  accessRow:       { flexDirection: 'row', justifyContent: 'space-between' },
  accessItem:      { alignItems: 'center', flex: 1 },
  accessCircle:    { width: 54, height: 54, borderRadius: 27, backgroundColor: C.primaryBg, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  accessLabel:     { fontSize: 12, fontWeight: '700', color: C.text, textAlign: 'center', marginBottom: 2 },
  accessSub:       { fontSize: 11, color: C.textSub, textAlign: 'center', lineHeight: 15 },

  // alerts
  alertsCard:  { backgroundColor: C.surface, marginHorizontal: 16, marginBottom: 20, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.border },
  alertsTitle: { fontSize: 14, fontWeight: '800', color: C.text, marginBottom: 12 },
  alertRow:    { flexDirection: 'row', alignItems: 'center', borderLeftWidth: 4, paddingLeft: 12, paddingVertical: 10, gap: 10, marginBottom: 8 },
  alertTitle:  { fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 2 },
  alertDesc:   { fontSize: 12, color: C.textSub },

  // badge
  badge:     { borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
  badgeText: { fontSize: 11, fontWeight: '700' },

  // activity
  listCard:    { backgroundColor: C.surface, marginHorizontal: 16, marginBottom: 20, borderRadius: 16, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  divider:     { height: 1, backgroundColor: C.border, marginHorizontal: 16 },
  teamRow:     { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, gap: 12 },
  teamName:    { fontSize: 14, fontWeight: '600', color: C.text },
  teamRole:    { fontSize: 12, color: C.textMuted, marginTop: 1 },
  avatarSm:    { width: 36, height: 36, borderRadius: 18, backgroundColor: C.primaryBg, alignItems: 'center', justifyContent: 'center' },
  avatarText:  { fontSize: 12, fontWeight: '700', color: C.primary },

  actItem:     { flexDirection: 'row', paddingLeft: 16 },
  actTimeline: { alignItems: 'center', width: 18, paddingTop: 14 },
  actDot:      { width: 8, height: 8, borderRadius: 4 },
  actLine:     { width: 1.5, flex: 1, backgroundColor: C.border, marginTop: 4 },
  actBody:     { flex: 1, paddingTop: 10, paddingBottom: 16, paddingHorizontal: 12 },
  actBodyLast: { paddingBottom: 14 },
  actInner:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  actType:     { fontSize: 13, fontWeight: '600', color: C.text, textTransform: 'capitalize' },
  actDesc:     { fontSize: 12, color: C.textMuted, marginTop: 2 },
  actTime:     { fontSize: 11, color: C.textMuted, flexShrink: 0, marginTop: 2 },

  // states
  stateWrap:    { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingVertical: 64 },
  stateTitle:   { fontSize: 17, fontWeight: '700', color: C.text, marginBottom: 8, textAlign: 'center' },
  stateText:    { fontSize: 14, color: C.textMuted, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  retryBtn:     { backgroundColor: C.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  retryBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  // sidebar
  sidebarBackdrop:    { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 30 },
  sidebar:            { position: 'absolute', top: 0, left: 0, bottom: 0, width: SIDEBAR_W, backgroundColor: C.surface, zIndex: 40, shadowColor: '#000', shadowOffset: { width: 4, height: 0 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 24 },
  sidebarHeader:      { alignItems: 'center', paddingTop: 52, paddingBottom: 24, paddingHorizontal: 20, backgroundColor: C.headerBg },
  sidebarClinicaNome: { fontSize: 16, fontWeight: '800', color: '#fff', marginTop: 14, textAlign: 'center' },
  sidebarClinicaSub:  { fontSize: 10, color: 'rgba(255,255,255,0.75)', fontWeight: '700', letterSpacing: 2, marginTop: 2 },
  sidebarDivider:     { height: 1, backgroundColor: C.border },
  sidebarNav:         { paddingVertical: 8 },
  sidebarItem:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, gap: 14 },
  sidebarItemIcon:    { width: 36, height: 36, borderRadius: 18, backgroundColor: C.primaryBg, alignItems: 'center', justifyContent: 'center' },
  sidebarItemLabel:   { flex: 1, fontSize: 14, fontWeight: '600', color: C.text },
  sidebarLogout:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 18, gap: 14 },
  sidebarLogoutIcon:  { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center' },
  sidebarLogoutLabel: { fontSize: 14, fontWeight: '600', color: '#EF4444' },

  // mais menu
  backdrop:        { position: 'absolute', top: 0, left: 0, right: 0, bottom: 70, zIndex: 10 },
  maisMenu:        { position: 'absolute', bottom: 76, right: 12, zIndex: 20, backgroundColor: C.surface, borderRadius: 14, paddingVertical: 4, minWidth: 180, shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.12, shadowRadius: 10, elevation: 16, borderWidth: 1, borderColor: C.border },
  maisMenuItem:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  maisMenuIconWrap:{ width: 34, height: 34, borderRadius: 17, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center' },
  maisMenuLabel:   { fontSize: 15, fontWeight: '600', color: '#EF4444' },
  maisMenuDivider: { height: 1, backgroundColor: C.border, marginHorizontal: 16 },

  // bottom nav
  bottomNav:      { flexDirection: 'row', backgroundColor: C.surface, borderTopWidth: 1, borderTopColor: C.border, paddingVertical: 8, paddingHorizontal: 4, shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 10 },
  tabItem:        { flex: 1, alignItems: 'center', paddingVertical: 4 },
  tabIconWrap:    { height: 26, alignItems: 'center', justifyContent: 'center' },
  tabLabel:       { fontSize: 10, color: C.textMuted, marginTop: 3, textAlign: 'center' },
  tabLabelActive: { color: C.primary, fontWeight: '700' },
});

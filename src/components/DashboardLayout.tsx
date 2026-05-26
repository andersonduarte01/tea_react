import React, { useState, ReactNode } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Calendar, FileText, Plus, User, Heart, MapPin,
  CreditCard, MessageCircle, Users, BarChart2,
  Settings, Pill, Home, MoreHorizontal, Bell, LogOut,
} from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';

const { width } = Dimensions.get('window');

// ─────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────

export type IconRenderer    = (color: string) => ReactNode;
export type TabIconRenderer = (active: boolean) => ReactNode;

export interface DashboardAction {
  label: string;
  sub: string;
  icon: IconRenderer;
}

export interface DashboardAccess {
  label: string;
  sub: string;
  icon: IconRenderer;
}

export interface DashboardTab {
  key: string;
  label: string;
  icon: TabIconRenderer;
  badge?: number;
}

export interface DashboardCard {
  topLabel: string;
  mainText: string;
  subText: string;
  personName: string;
  personSub: string;
  statusText: string;
  statusColor?: string;
}

export interface DashboardConfig {
  actions: DashboardAction[];
  card: DashboardCard;
  access: DashboardAccess[];
  tabs: DashboardTab[];
}

// ─────────────────────────────────────────────────────────────────
// ICONS  (lucide-react-native)
// ─────────────────────────────────────────────────────────────────

export function CalendarIcon({ size = 26, color = '#1565C0' }: { size?: number; color?: string }) {
  return <Calendar size={size} color={color} />;
}
export function DocIcon({ size = 26, color = '#1565C0' }: { size?: number; color?: string }) {
  return <FileText size={size} color={color} />;
}
export function PlusIcon({ size = 26, color = '#1565C0' }: { size?: number; color?: string }) {
  return <Plus size={size} color={color} />;
}
export function PersonIcon({ size = 26, color = '#1565C0' }: { size?: number; color?: string }) {
  return <User size={size} color={color} />;
}
export function HeartIcon({ size = 26, color = '#1565C0' }: { size?: number; color?: string }) {
  return <Heart size={size} color={color} />;
}
export function LocationIcon({ size = 26, color = '#1565C0' }: { size?: number; color?: string }) {
  return <MapPin size={size} color={color} />;
}
export function CardIcon({ size = 26, color = '#1565C0' }: { size?: number; color?: string }) {
  return <CreditCard size={size} color={color} />;
}
export function ChatIcon({ size = 26, color = '#1565C0' }: { size?: number; color?: string }) {
  return <MessageCircle size={size} color={color} />;
}
export function UsersIcon({ size = 26, color = '#1565C0' }: { size?: number; color?: string }) {
  return <Users size={size} color={color} />;
}
export function ChartIcon({ size = 26, color = '#1565C0' }: { size?: number; color?: string }) {
  return <BarChart2 size={size} color={color} />;
}
export function SettingsIcon({ size = 26, color = '#1565C0' }: { size?: number; color?: string }) {
  return <Settings size={size} color={color} />;
}
export function PillIcon({ size = 26, color = '#1565C0' }: { size?: number; color?: string }) {
  return <Pill size={size} color={color} />;
}
export function HomeIcon({ size = 26, color = '#1565C0' }: { size?: number; color?: string }) {
  return <Home size={size} color={color} />;
}
export function ThreeDotsIcon({ color = '#8A9BB0' }: { color?: string }) {
  return <MoreHorizontal size={22} color={color} />;
}

function BellIcon() {
  return <Bell size={22} color="#5E7A8A" />;
}

function ExitIcon() {
  return <LogOut size={18} color="#EF4444" />;
}

function LogoCircle() {
  return (
    <View style={logo.outer}>
      <View style={logo.left} />
      <View style={logo.cross}>
        <View style={logo.crossV} />
        <View style={logo.crossH} />
      </View>
    </View>
  );
}

const logo = StyleSheet.create({
  outer:  { width: 46, height: 46, borderRadius: 23, backgroundColor: '#1565C0', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  left:   { position: 'absolute', left: 0, top: 0, width: 23, height: 46, backgroundColor: '#1976D2' },
  cross:  { width: 22, height: 22, alignItems: 'center', justifyContent: 'center' },
  crossV: { position: 'absolute', width: 6, height: 22, backgroundColor: '#fff', borderRadius: 2 },
  crossH: { position: 'absolute', width: 22, height: 6, backgroundColor: '#fff', borderRadius: 2 },
});

// ─────────────────────────────────────────────────────────────────
// LAYOUT
// ─────────────────────────────────────────────────────────────────

interface Props {
  config: DashboardConfig;
  screens?: Record<string, React.ComponentType>;
}

export function DashboardLayout({ config, screens }: Props) {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState(config.tabs[0]?.key ?? 'inicio');
  const [maisOpen, setMaisOpen] = useState(false);
  const firstName = user?.nome?.split(' ')[0] || 'Usuário';

  const homeKey = config.tabs[0]?.key ?? 'inicio';
  const ScreenComponent = activeTab !== homeKey ? screens?.[activeTab] : undefined;

  return (
    <SafeAreaView style={s.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#DFF0FA" />

      {ScreenComponent ? (
        <ScreenComponent />
      ) : (
      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>

        {/* ── HEADER ── */}
        <View style={s.header}>
          <View style={s.headerTop}>
            <View style={s.logoRow}>
              <LogoCircle />
              <View>
                <Text style={s.logoName}>Espectro</Text>
                <Text style={s.logoSub}>CLÍNICA</Text>
              </View>
            </View>
            <View style={s.notifWrap}>
              <BellIcon />
              <View style={s.notifBadge}>
                <Text style={s.notifBadgeText}>2</Text>
              </View>
            </View>
          </View>

          <View style={s.greetingRow}>
            <View style={s.greetingTexts}>
              <Text style={s.greetingTitle}>Olá, {firstName}!</Text>
              <Text style={s.greetingSub}>Como podemos cuidar de você hoje?</Text>
            </View>
            <View style={s.buildingWrap}>
              <View style={s.buildingBack}>
                {[0,1,2,3].map(r => (
                  <View key={r} style={s.buildingRow}>
                    {[0,1].map(c => <View key={c} style={s.buildingWin} />)}
                  </View>
                ))}
              </View>
              <View style={s.buildingFront}>
                {[0,1,2].map(r => (
                  <View key={r} style={s.buildingRow}>
                    {[0,1].map(c => <View key={c} style={[s.buildingWin, s.buildingWinFront]} />)}
                  </View>
                ))}
              </View>
              <View style={s.buildingBadge}>
                <View style={s.buildingCrossV} />
                <View style={s.buildingCrossH} />
              </View>
              <Text style={s.buildingLabel}>Espectro</Text>
            </View>
          </View>
        </View>

        {/* ── AÇÕES RÁPIDAS ── */}
        <View style={s.actionsCard}>
          {config.actions.map((item, i) => (
            <TouchableOpacity key={i} style={s.actionItem} activeOpacity={0.7}>
              <View style={s.actionCircle}>
                {item.icon('#1565C0')}
              </View>
              <Text style={s.actionLabel}>{item.label}</Text>
              <Text style={s.actionSub}>{item.sub}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── CARD PRINCIPAL ── */}
        <View style={s.card}>
          <View style={s.cardTop}>
            <View style={s.cardCalCircle}>
              <CalendarIcon size={30} color="#fff" />
            </View>
            <View style={s.cardInfo}>
              <Text style={s.cardTopLabel}>{config.card.topLabel}</Text>
              <Text style={s.cardMainText}>{config.card.mainText}</Text>
              <Text style={s.cardSubText}>{config.card.subText}</Text>
            </View>
            <Text style={s.cardArrow}>›</Text>
          </View>

          <View style={s.cardDivider} />

          <View style={s.cardDoctor}>
            <View style={s.cardPersonCircle}>
              <PersonIcon size={22} color="rgba(255,255,255,0.9)" />
            </View>
            <View style={s.cardPersonInfo}>
              <Text style={s.cardPersonName}>{config.card.personName}</Text>
              <Text style={s.cardPersonSub}>{config.card.personSub}</Text>
            </View>
            <View style={[s.statusBadge, { backgroundColor: config.card.statusColor ?? '#2E7D32' }]}>
              <Text style={s.statusCheck}>✓</Text>
              <Text style={s.statusText}>{config.card.statusText}</Text>
            </View>
          </View>
        </View>

        {/* ── ACESSO RÁPIDO ── */}
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>Acesso rápido</Text>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={s.seeAll}>Ver todos  ›</Text>
          </TouchableOpacity>
        </View>

        <View style={s.accessRow}>
          {config.access.map((item, i) => (
            <TouchableOpacity key={i} style={s.accessItem} activeOpacity={0.7}>
              <View style={s.accessCircle}>
                {item.icon('#1565C0')}
              </View>
              <Text style={s.accessLabel}>{item.label}</Text>
              <Text style={s.accessSub}>{item.sub}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── DICA DE SAÚDE ── */}
        <View style={s.tipCard}>
          <View style={s.tipContent}>
            <Text style={s.tipTitle}>Dica de saúde</Text>
            <Text style={s.tipText}>Pequenas escolhas hoje,{'\n'}transformam seu amanhã.</Text>
            <TouchableOpacity style={s.tipBtn} activeOpacity={0.8}>
              <Text style={s.tipBtnText}>Saiba mais</Text>
            </TouchableOpacity>
          </View>
          <View style={s.tipIllustration}>
            <View style={s.tipHeartL} />
            <View style={s.tipHeartR} />
            <View style={s.tipHeartB} />
            <View style={s.tipStethoArc} />
            <View style={s.tipStethoTube} />
          </View>
        </View>

        <View style={s.dotsRow}>
          <View style={[s.dot, s.dotActive]} />
          <View style={s.dot} />
          <View style={s.dot} />
        </View>

        <View style={{ height: 90 }} />
      </ScrollView>
      )}

      {maisOpen && (
        <TouchableOpacity
          style={s.maisBackdrop}
          onPress={() => setMaisOpen(false)}
          activeOpacity={1}
        />
      )}

      {/* ── MAIS MENU panel ── */}
      {maisOpen && (
        <View style={s.maisMenu}>
          <TouchableOpacity style={s.maisMenuItem} onPress={logout} activeOpacity={0.7}>
            <View style={s.maisMenuIconWrap}>
              <ExitIcon />
            </View>
            <Text style={s.maisMenuLabel}>Sair</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── BOTTOM NAV ── */}
      <View style={s.bottomNav}>
        {config.tabs.map((tab, i) => {
          const isMais = tab.key === 'mais';
          const active = isMais ? maisOpen : activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={s.tabItem}
              onPress={() => {
                if (isMais) {
                  setMaisOpen(prev => !prev);
                } else {
                  setActiveTab(tab.key);
                  setMaisOpen(false);
                }
              }}
              activeOpacity={0.7}
            >
              <View style={s.tabIconWrap}>
                {tab.icon(active)}
                {tab.badge != null && (
                  <View style={s.tabBadge}>
                    <Text style={s.tabBadgeText}>{tab.badge}</Text>
                  </View>
                )}
              </View>
              <Text style={[s.tabLabel, active && s.tabLabelActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  scroll: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { flexGrow: 1 },

  // header
  header: { backgroundColor: '#DFF0FA', paddingHorizontal: 20, paddingTop: 14, paddingBottom: 44, borderBottomLeftRadius: 36, borderBottomRightRadius: 36 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoName: { fontSize: 18, fontWeight: '800', color: '#1A2340', letterSpacing: 0.2 },
  logoSub: { fontSize: 10, color: '#1565C0', fontWeight: '700', letterSpacing: 2.5, marginTop: -2 },
  notifWrap: { position: 'relative', width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  notifBadge: { position: 'absolute', top: -2, right: -4, backgroundColor: '#1565C0', borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  notifBadgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  greetingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  greetingTexts: { flex: 1 },
  greetingTitle: { fontSize: 30, fontWeight: '800', color: '#1A2340', marginBottom: 6 },
  greetingSub: { fontSize: 14, color: '#5E7A8A', lineHeight: 21 },
  buildingWrap: { width: 90, height: 80, position: 'relative', marginLeft: 8 },
  buildingBack: { position: 'absolute', right: 4, top: 0, width: 52, height: 74, backgroundColor: '#93C5E8', borderRadius: 5, padding: 6, gap: 4 },
  buildingFront: { position: 'absolute', left: 0, top: 14, width: 38, height: 58, backgroundColor: '#B8D9F0', borderRadius: 4, padding: 5, gap: 3 },
  buildingRow: { flexDirection: 'row', gap: 4 },
  buildingWin: { flex: 1, height: 8, backgroundColor: 'rgba(255,255,255,0.45)', borderRadius: 1 },
  buildingWinFront: { height: 7, backgroundColor: 'rgba(255,255,255,0.5)' },
  buildingBadge: { position: 'absolute', right: 0, top: 4, width: 22, height: 22, backgroundColor: '#1565C0', borderRadius: 5, alignItems: 'center', justifyContent: 'center' },
  buildingCrossV: { position: 'absolute', width: 4, height: 14, backgroundColor: '#fff', borderRadius: 1 },
  buildingCrossH: { position: 'absolute', width: 14, height: 4, backgroundColor: '#fff', borderRadius: 1 },
  buildingLabel: { position: 'absolute', bottom: 2, left: 4, fontSize: 8, color: 'rgba(21,101,192,0.8)', fontWeight: '600' },

  // actions card
  actionsCard: { backgroundColor: '#fff', marginHorizontal: 16, marginTop: -28, borderRadius: 18, padding: 18, flexDirection: 'row', justifyContent: 'space-between', shadowColor: '#0D4B8F', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 6, marginBottom: 16 },
  actionItem: { alignItems: 'center', flex: 1 },
  actionCircle: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#EBF5FC', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  actionLabel: { fontSize: 12, fontWeight: '700', color: '#1A2340', textAlign: 'center' },
  actionSub: { fontSize: 12, color: '#6B8498', textAlign: 'center' },

  // blue card
  card: { backgroundColor: '#1565C0', marginHorizontal: 16, borderRadius: 18, padding: 20, marginBottom: 28, shadowColor: '#1565C0', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 14, elevation: 8 },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  cardCalCircle: { width: 62, height: 62, borderRadius: 31, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  cardInfo: { flex: 1 },
  cardTopLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '600', letterSpacing: 1, marginBottom: 4, textTransform: 'uppercase' },
  cardMainText: { fontSize: 21, fontWeight: '800', color: '#fff', marginBottom: 3 },
  cardSubText: { fontSize: 14, color: 'rgba(255,255,255,0.85)' },
  cardArrow: { fontSize: 30, color: 'rgba(255,255,255,0.7)' },
  cardDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.22)', marginBottom: 16 },
  cardDoctor: { flexDirection: 'row', alignItems: 'center' },
  cardPersonCircle: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  cardPersonInfo: { flex: 1 },
  cardPersonName: { fontSize: 15, fontWeight: '700', color: '#fff', marginBottom: 2 },
  cardPersonSub: { fontSize: 13, color: 'rgba(255,255,255,0.72)' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 11, paddingVertical: 6, borderRadius: 20, gap: 4 },
  statusCheck: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  statusText: { color: '#fff', fontSize: 12, fontWeight: '600' },

  // acesso rápido
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 20, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#1A2340' },
  seeAll: { fontSize: 14, color: '#1565C0', fontWeight: '600' },
  accessRow: { flexDirection: 'row', marginHorizontal: 14, justifyContent: 'space-between', marginBottom: 28 },
  accessItem: { alignItems: 'center', width: (width - 40) / 4 },
  accessCircle: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#EBF5FC', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  accessLabel: { fontSize: 12, fontWeight: '700', color: '#1A2340', textAlign: 'center', marginBottom: 2 },
  accessSub: { fontSize: 11, color: '#6B8498', textAlign: 'center', lineHeight: 15 },

  // tip card
  tipCard: { backgroundColor: '#E8F4FD', marginHorizontal: 16, borderRadius: 18, flexDirection: 'row', minHeight: 130, overflow: 'hidden', marginBottom: 14 },
  tipContent: { flex: 1, padding: 20 },
  tipTitle: { fontSize: 16, fontWeight: '800', color: '#1565C0', marginBottom: 7 },
  tipText: { fontSize: 13, color: '#3D5A70', lineHeight: 20, marginBottom: 16 },
  tipBtn: { backgroundColor: '#1565C0', paddingHorizontal: 18, paddingVertical: 11, borderRadius: 10, alignSelf: 'flex-start' },
  tipBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  tipIllustration: { width: 110, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  tipHeartL: { position: 'absolute', top: 18, right: 42, width: 28, height: 28, borderRadius: 14, backgroundColor: '#1565C0' },
  tipHeartR: { position: 'absolute', top: 18, right: 14, width: 28, height: 28, borderRadius: 14, backgroundColor: '#1565C0' },
  tipHeartB: { position: 'absolute', top: 28, right: 14, left: 14, height: 30, backgroundColor: '#1565C0', transform: [{ rotate: '45deg' }], borderBottomLeftRadius: 2, borderBottomRightRadius: 4 },
  tipStethoArc: { position: 'absolute', bottom: 14, right: 10, width: 44, height: 44, borderRadius: 22, borderWidth: 4, borderColor: '#90A4AE', borderBottomColor: 'transparent', transform: [{ rotate: '200deg' }] },
  tipStethoTube: { position: 'absolute', bottom: 8, right: 28, width: 4, height: 20, backgroundColor: '#90A4AE', borderRadius: 2, transform: [{ rotate: '30deg' }] },

  // dots
  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#C5D9E9' },
  dotActive: { backgroundColor: '#1565C0', width: 10, height: 10, borderRadius: 5 },

  // mais menu
  maisBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 70, zIndex: 10 },
  maisMenu: { position: 'absolute', bottom: 76, right: 12, zIndex: 20, backgroundColor: '#fff', borderRadius: 14, paddingVertical: 4, minWidth: 160, shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.12, shadowRadius: 10, elevation: 16, borderWidth: 1, borderColor: '#E4EEF5' },
  maisMenuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  maisMenuIconWrap: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center' },
  maisMenuLabel: { fontSize: 15, fontWeight: '600', color: '#EF4444' },

  // bottom nav
  bottomNav: { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E4EEF5', paddingVertical: 8, paddingHorizontal: 4, shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 10 },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  tabIconWrap: { position: 'relative', height: 26, alignItems: 'center', justifyContent: 'center' },
  tabBadge: { position: 'absolute', top: -4, right: -10, backgroundColor: '#1565C0', borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  tabBadgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  tabLabel: { fontSize: 10, color: '#8A9BB0', marginTop: 3, textAlign: 'center' },
  tabLabelActive: { color: '#1565C0', fontWeight: '700' },
});

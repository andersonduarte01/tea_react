import React from 'react';
import {
  DashboardLayout,
  DashboardConfig,
  ChartIcon,
  UsersIcon,
  SettingsIcon,
  PersonIcon,
  LocationIcon,
  CardIcon,
  ChatIcon,
  CalendarIcon,
  HomeIcon,
  ThreeDotsIcon,
} from '../../components/DashboardLayout';
import { MedicosLista }     from '../listas/MedicosLista';
import { FuncionarioLista } from '../listas/FuncionarioLista';
import { AgendasLista }     from '../listas/AgendasLista';

const config: DashboardConfig = {
  actions: [
    { label: 'Relatórios',    sub: 'gerenciais',   icon: c => <ChartIcon color={c} /> },
    { label: 'Usuários',      sub: 'do sistema',   icon: c => <UsersIcon color={c} /> },
    { label: 'Configurações', sub: 'do sistema',   icon: c => <SettingsIcon color={c} /> },
    { label: 'Meu',           sub: 'perfil',       icon: c => <PersonIcon color={c} /> },
  ],
  card: {
    topLabel:   'REUNIÃO DO DIA',
    mainText:   '11 de maio, 2026',
    subText:    'Segunda-feira, às 09:00',
    personName: 'Equipe Clínica',
    personSub:  'Reunião semanal',
    statusText: 'Agendada',
    statusColor: '#1565C0',
  },
  access: [
    { label: 'Clínicas',   sub: 'Gerenciar\nunidades',     icon: c => <LocationIcon color={c} /> },
    { label: 'Equipe',     sub: 'Ver\nfuncionários',       icon: c => <UsersIcon color={c} /> },
    { label: 'Financeiro', sub: 'Relatórios\nfinanceiros', icon: c => <CardIcon color={c} /> },
    { label: 'Suporte',    sub: 'Configurações\ne ajuda',  icon: c => <ChatIcon color={c} /> },
  ],
  tabs: [
    { key: 'inicio',       label: 'Início',       icon: a => <HomeIcon color={a ? '#1565C0' : '#8A9BB0'} /> },
    { key: 'medicos',      label: 'Médicos',      icon: a => <UsersIcon size={22} color={a ? '#1565C0' : '#8A9BB0'} /> },
    { key: 'funcionarios', label: 'Funcionários', icon: a => <PersonIcon size={22} color={a ? '#1565C0' : '#8A9BB0'} /> },
    { key: 'agendas',      label: 'Agendas',      icon: a => <CalendarIcon size={22} color={a ? '#1565C0' : '#8A9BB0'} /> },
    { key: 'mais',         label: 'Mais',         icon: _ => <ThreeDotsIcon /> },
  ],
};

const screens = {
  medicos:      MedicosLista,
  funcionarios: FuncionarioLista,
  agendas:      AgendasLista,
};

export function AdminDashboard() {
  return <DashboardLayout config={config} screens={screens} />;
}

import React from 'react';
import {
  DashboardLayout,
  DashboardConfig,
  CalendarIcon,
  DocIcon,
  PersonIcon,
  PillIcon,
  UsersIcon,
  PlusIcon,
  ChatIcon,
  HomeIcon,
  ThreeDotsIcon,
} from '../../components/DashboardLayout';

const config: DashboardConfig = {
  actions: [
    { label: 'Minha',     sub: 'agenda',       icon: c => <CalendarIcon color={c} /> },
    { label: 'Meus',      sub: 'pacientes',     icon: c => <UsersIcon color={c} /> },
    { label: 'Prontuários', sub: 'e laudos',   icon: c => <DocIcon color={c} /> },
    { label: 'Meu',       sub: 'perfil',        icon: c => <PersonIcon color={c} /> },
  ],
  card: {
    topLabel:   'PRÓXIMO PACIENTE',
    mainText:   '20 de maio, 2024',
    subText:    'Segunda-feira, às 14:30',
    personName: 'Ana Beatriz Silva',
    personSub:  'Retorno — Psiquiatria',
    statusText: 'Confirmada',
    statusColor: '#2E7D32',
  },
  access: [
    { label: 'Prescrições',  sub: 'Receituário\ndigital',       icon: c => <PillIcon color={c} /> },
    { label: 'Exames',       sub: 'Solicitar\ne visualizar',    icon: c => <PlusIcon color={c} /> },
    { label: 'Prontuários',  sub: 'Histórico\ndo paciente',     icon: c => <DocIcon color={c} /> },
    { label: 'Fale conosco', sub: 'Atendimento\ne suporte',     icon: c => <ChatIcon color={c} /> },
  ],
  tabs: [
    { key: 'inicio',    label: 'Início',    icon: a => <HomeIcon color={a ? '#1565C0' : '#8A9BB0'} /> },
    { key: 'agenda',    label: 'Agenda',    icon: a => <CalendarIcon size={22} color={a ? '#1565C0' : '#8A9BB0'} /> },
    { key: 'pacientes', label: 'Pacientes', icon: a => <UsersIcon size={22} color={a ? '#1565C0' : '#8A9BB0'} /> },
    { key: 'mensagens', label: 'Mensagens', icon: a => <ChatIcon size={22} color={a ? '#1565C0' : '#8A9BB0'} />, badge: 2 },
    { key: 'mais',      label: 'Mais',      icon: _ => <ThreeDotsIcon /> },
  ],
};

export function ProfissionalDashboard() {
  return <DashboardLayout config={config} />;
}

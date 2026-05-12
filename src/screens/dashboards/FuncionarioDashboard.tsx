import React from 'react';
import {
  DashboardLayout,
  DashboardConfig,
  CalendarIcon,
  DocIcon,
  PlusIcon,
  PersonIcon,
  UsersIcon,
  ChatIcon,
  LocationIcon,
  HomeIcon,
  ThreeDotsIcon,
} from '../../components/DashboardLayout';

const config: DashboardConfig = {
  actions: [
    { label: 'Check-in',  sub: 'de atendimento', icon: c => <PlusIcon color={c} /> },
    { label: 'Minhas',    sub: 'tarefas',         icon: c => <DocIcon color={c} /> },
    { label: 'Pacientes', sub: 'do dia',          icon: c => <UsersIcon color={c} /> },
    { label: 'Meu',       sub: 'perfil',          icon: c => <PersonIcon color={c} /> },
  ],
  card: {
    topLabel:   'PRÓXIMO ATENDIMENTO',
    mainText:   '11 de maio, 2026',
    subText:    'Segunda-feira, às 10:00',
    personName: 'Carlos Eduardo Souza',
    personSub:  'Triagem inicial',
    statusText: 'Aguardando',
    statusColor: '#E65100',
  },
  access: [
    { label: 'Protocolos', sub: 'Guias\nclínicos',        icon: c => <DocIcon color={c} /> },
    { label: 'Setores',    sub: 'Ver\nunidades',          icon: c => <LocationIcon color={c} /> },
    { label: 'Escala',     sub: 'Minha\nescala',         icon: c => <CalendarIcon color={c} /> },
    { label: 'Suporte',    sub: 'TI e RH\nAtendimento',  icon: c => <ChatIcon color={c} /> },
  ],
  tabs: [
    { key: 'inicio',       label: 'Início',       icon: a => <HomeIcon color={a ? '#1565C0' : '#8A9BB0'} /> },
    { key: 'tarefas',      label: 'Tarefas',      icon: a => <DocIcon size={22} color={a ? '#1565C0' : '#8A9BB0'} /> },
    { key: 'atendimentos', label: 'Atendimentos', icon: a => <UsersIcon size={22} color={a ? '#1565C0' : '#8A9BB0'} /> },
    { key: 'mensagens',    label: 'Mensagens',    icon: a => <ChatIcon size={22} color={a ? '#1565C0' : '#8A9BB0'} />, badge: 2 },
    { key: 'mais',         label: 'Mais',         icon: _ => <ThreeDotsIcon /> },
  ],
};

export function FuncionarioDashboard() {
  return <DashboardLayout config={config} />;
}

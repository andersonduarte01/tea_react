import React from 'react';
import {
  DashboardLayout,
  DashboardConfig,
  CalendarIcon,
  DocIcon,
  UsersIcon,
  PersonIcon,
  HeartIcon,
  LocationIcon,
  CardIcon,
  ChatIcon,
  HomeIcon,
  ThreeDotsIcon,
} from '../../components/DashboardLayout';

const config: DashboardConfig = {
  actions: [
    { label: 'Agendar',    sub: 'consulta',     icon: c => <CalendarIcon color={c} /> },
    { label: 'Meus',       sub: 'dependentes',  icon: c => <UsersIcon color={c} /> },
    { label: 'Resultados', sub: 'e exames',     icon: c => <DocIcon color={c} /> },
    { label: 'Meu',        sub: 'perfil',       icon: c => <PersonIcon color={c} /> },
  ],
  card: {
    topLabel:   'CONSULTA DO DEPENDENTE',
    mainText:   '20 de maio, 2024',
    subText:    'Segunda-feira, às 14:30',
    personName: 'Dr. Marcos Almeida',
    personSub:  'Psiquiatria',
    statusText: 'Confirmada',
    statusColor: '#2E7D32',
  },
  access: [
    { label: 'Especialidades', sub: 'Nossas áreas\nde atendimento', icon: c => <HeartIcon color={c} /> },
    { label: 'Unidades',       sub: 'Encontre a\nmais próxima',    icon: c => <LocationIcon color={c} /> },
    { label: 'Convênios',      sub: 'Veja os planos\natendidos',   icon: c => <CardIcon color={c} /> },
    { label: 'Fale conosco',   sub: 'Atendimento\ne suporte',     icon: c => <ChatIcon color={c} /> },
  ],
  tabs: [
    { key: 'inicio',       label: 'Início',       icon: a => <HomeIcon color={a ? '#1565C0' : '#8A9BB0'} /> },
    { key: 'agendamentos', label: 'Agendamentos', icon: a => <CalendarIcon size={22} color={a ? '#1565C0' : '#8A9BB0'} /> },
    { key: 'dependentes',  label: 'Dependentes',  icon: a => <UsersIcon size={22} color={a ? '#1565C0' : '#8A9BB0'} /> },
    { key: 'mensagens',    label: 'Mensagens',    icon: a => <ChatIcon size={22} color={a ? '#1565C0' : '#8A9BB0'} />, badge: 2 },
    { key: 'mais',         label: 'Mais',         icon: _ => <ThreeDotsIcon /> },
  ],
};

export function ResponsavelDashboard() {
  return <DashboardLayout config={config} />;
}

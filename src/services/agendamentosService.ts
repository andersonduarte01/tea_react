import { request } from './httpClient';
import { AgendamentosPage } from '../types/agendamento';

function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export async function getAgendamentosHoje(page = 1): Promise<AgendamentosPage> {
  const today  = todayISO();
  const params = `status=aguardando&data_inicio=${today}&data_fim=${today}&page=${page}&page_size=50`;
  return request<AgendamentosPage>(`/api/v1/agenda/agendamentos/?${params}`);
}

export async function getAgendamentosHojeTodos(page = 1): Promise<AgendamentosPage> {
  const today  = todayISO();
  const params = `status=todos&data_inicio=${today}&data_fim=${today}&page=${page}&page_size=50`;
  return request<AgendamentosPage>(`/api/v1/agenda/agendamentos/?${params}`);
}

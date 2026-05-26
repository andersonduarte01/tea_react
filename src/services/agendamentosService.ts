import { request } from './httpClient';
import { AgendamentosPage } from '../types/agendamento';

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
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

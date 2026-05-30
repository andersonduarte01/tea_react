import { api } from './httpClient';
import { CriarFeriadoInput, Feriado, FeriadoPage } from '../types/feriado';

export async function criarFeriado(input: CriarFeriadoInput): Promise<Feriado> {
  return api.post<Feriado>('/api/v1/agenda/feriados/', input);
}

export async function getFeriados(params?: { ano?: number; ativo?: boolean }): Promise<Feriado[]> {
  const qp = new URLSearchParams();
  if (params?.ano !== undefined) qp.set('ano', String(params.ano));
  if (params?.ativo !== undefined) qp.set('ativo', String(params.ativo));
  const qs = qp.toString();
  const raw = await api.get<FeriadoPage | Feriado[]>(`/api/v1/agenda/feriados/${qs ? `?${qs}` : ''}`);
  return Array.isArray(raw) ? raw : (raw as FeriadoPage).results ?? [];
}

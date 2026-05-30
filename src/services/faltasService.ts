import { api } from './httpClient';
import { FaltasPage, FaltaProfissional } from '../types/falta';

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export async function getFaltasHoje(): Promise<FaltaProfissional[]> {
  // Endpoint não documenta shape da resposta — pode ser array simples ou paginado
  const raw = await api.get<FaltasPage | FaltaProfissional[]>('/api/v1/agenda/faltas/?futuras=true');

  const list: FaltaProfissional[] = Array.isArray(raw)
    ? raw
    : (raw as FaltasPage).results ?? [];

  const today = todayISO();
  return list.filter(f => f.data.startsWith(today));
}

export async function deletarFalta(id: number): Promise<void> {
  await api.delete(`/api/v1/agenda/faltas/${id}/`);
}

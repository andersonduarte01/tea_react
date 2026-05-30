import AsyncStorage from '@react-native-async-storage/async-storage';
import { request, getBaseUrl, STORAGE } from './httpClient';
import { CriarFuncionarioInput, Funcionario } from '../types/funcionario';

export async function criarFuncionario(input: CriarFuncionarioInput): Promise<Funcionario> {
  return request<Funcionario>('/api/v1/funcionario/', {
    method: 'POST',
    body:   JSON.stringify(input),
  });
}

export async function atualizarFotoFuncionario(id: number, uri: string): Promise<void> {
  const [access, clinicaId] = await Promise.all([
    AsyncStorage.getItem(STORAGE.ACCESS),
    AsyncStorage.getItem(STORAGE.CLINICA),
  ]);

  const form = new FormData();
  form.append('foto', { uri, type: 'image/jpeg', name: 'foto.jpg' } as any);

  const headers: Record<string, string> = {};
  if (access)    headers['Authorization'] = `Bearer ${access}`;
  if (clinicaId) headers['X-Clinica-ID']  = clinicaId;

  const res = await fetch(`${getBaseUrl()}/api/v1/funcionario/${id}/perfil/`, {
    method: 'PATCH',
    headers,
    body: form,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.detail ?? `Falha ao enviar foto (${res.status})`);
  }
}

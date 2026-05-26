import { api } from './httpClient';
import { DashboardAdminData } from '../types/dashboard';
import { ClinicaDetalhe }     from '../types/clinica';

export interface PatchClinicaPayload {
  nome?:     string;
  telefone?: string | null;
  email?:    string | null;
  endereco?: {
    logradouro?:  string;
    numero?:      string;
    complemento?: string | null;
    bairro?:      string;
    cidade?:      string;
    estado?:      string;
    cep?:         string;
  };
}

export async function getDashboard(): Promise<DashboardAdminData> {
  return api.get<DashboardAdminData>('/api/v1/clinica/dashboard/');
}

export async function getClinica(): Promise<ClinicaDetalhe> {
  return api.get<ClinicaDetalhe>('/api/v1/clinica/');
}

export async function patchClinica(payload: PatchClinicaPayload): Promise<ClinicaDetalhe> {
  return api.patch<ClinicaDetalhe>('/api/v1/clinica/', payload);
}

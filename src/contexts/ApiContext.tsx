import React, { createContext, useContext, useEffect } from 'react';
import { configureHttpClient } from '../services/httpClient';

const BASE_URL = 'http://192.168.0.16:8000';
const V1       = `${BASE_URL}/api/v1`;

export const ENDPOINTS = {
  // Auth
  login:   `${V1}/auth/login/`,
  refresh: `${V1}/auth/refresh/`,
  logout:  `${V1}/auth/logout/`,
  me:      `${V1}/auth/me/`,

  // Clínica
  clinica:          `${V1}/clinica/`,
  clinicaDashboard: `${V1}/clinica/dashboard/`,

  // Admin
  adminPerfil: `${V1}/admin/perfil/`,

  // Profissional
  profissional:       `${V1}/profissional/`,
  profissionalPerfil: `${V1}/profissional/perfil/`,
  profissionalById:   (id: number) => `${V1}/profissional/${id}/`,

  // Funcionário
  funcionario:       `${V1}/funcionario/`,
  funcionarioPerfil: `${V1}/funcionario/perfil/`,
  funcionarioById:   (id: number) => `${V1}/funcionario/${id}/`,

  // Responsável
  responsavel:         `${V1}/responsavel/`,
  responsavelById:     (id: number) => `${V1}/responsavel/${id}/`,
  responsavelPerfil:   `${V1}/responsavel/perfil/`,
  responsavelPacientes:`${V1}/responsavel/pacientes/`,

  // Paciente
  paciente:            `${V1}/paciente/`,
  pacienteById:        (id: number) => `${V1}/paciente/${id}/`,
  pacientePerfil:      `${V1}/paciente/perfil/`,
  pacienteResponsaveis:`${V1}/paciente/responsaveis/`,

  // Agenda
  agendamentos:             `${V1}/agenda/agendamentos/`,
  agendamentoById:          (id: number) => `${V1}/agenda/agendamentos/${id}/`,
  agendamentoRemarcar:      (id: number) => `${V1}/agenda/agendamentos/${id}/remarcar/`,
  agendamentoCancelar:      (id: number) => `${V1}/agenda/agendamentos/${id}/cancelar/`,
  agendamentoConfirmar:     (id: number) => `${V1}/agenda/agendamentos/${id}/confirmar/`,
  agendamentoRealizar:      (id: number) => `${V1}/agenda/agendamentos/${id}/realizar/`,
  agendamentoNaoCompareceu: (id: number) => `${V1}/agenda/agendamentos/${id}/nao-compareceu/`,
  horariosDisponiveis:      `${V1}/agenda/horarios-disponiveis/`,
  agendaProfissionais:      `${V1}/agenda/profissionais/`,
  agendaProfissionalById:   (id: number) => `${V1}/agenda/profissionais/${id}/`,
  feriados:                 `${V1}/agenda/feriados/`,
  feriadoById:              (id: number) => `${V1}/agenda/feriados/${id}/`,
  faltas:                   `${V1}/agenda/faltas/`,
  faltaById:                (id: number) => `${V1}/agenda/faltas/${id}/`,

  // Sessão
  sessoes:          `${V1}/sessao/`,
  sessaoById:       (id: number) => `${V1}/sessao/${id}/`,
  sessaoEvolucoes:  (id: number) => `${V1}/sessao/${id}/evolucoes/`,

  // Medicação
  medicacoes:           `${V1}/medicacao/`,
  medicacaoById:        (id: number) => `${V1}/medicacao/${id}/`,
  medicacaoAlterar:     (id: number) => `${V1}/medicacao/${id}/alterar/`,
  medicacaoInterromper: (id: number) => `${V1}/medicacao/${id}/interromper/`,

  // Evento
  eventos:       `${V1}/evento/`,
  eventoById:    (id: number) => `${V1}/evento/${id}/`,

  // Formulário
  formularios:         `${V1}/formulario/`,
  formularioById:      (id: number) => `${V1}/formulario/${id}/`,
  formularioResponder: (id: number) => `${V1}/formulario/${id}/responder/`,
  formularioRespostas: `${V1}/formulario/respostas/`,

  // Timeline
  timeline: `${V1}/timeline/`,
} as const;

interface ApiContextType {
  baseUrl:   string;
  endpoints: typeof ENDPOINTS;
}

const ApiContext = createContext<ApiContextType>({
  baseUrl:   BASE_URL,
  endpoints: ENDPOINTS,
});

export function ApiProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    configureHttpClient(BASE_URL);
  }, []);

  return (
    <ApiContext.Provider value={{ baseUrl: BASE_URL, endpoints: ENDPOINTS }}>
      {children}
    </ApiContext.Provider>
  );
}

export function useApi() {
  return useContext(ApiContext);
}

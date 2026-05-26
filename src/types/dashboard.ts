// ─── Shared ────────────────────────────────────────────────────────────────────
export type AlertTipo    = 'warning' | 'error' | 'info';
export type StatusTipo   = 'success' | 'error' | 'warning' | 'info';
export type PapelEquipe  = 'PROF' | 'FUNC';

export interface AlertaAPI {
  tipo:       AlertTipo;
  titulo:     string;
  descricao:  string;
  quantidade: number;
}

export interface AtividadeAPI {
  id:        number;
  tipo:      string;
  descricao: string;
  timestamp: string;   // ISO-8601
  status:    StatusTipo;
}

export interface EquipeMembroAPI {
  id:              number;
  nome:            string;
  papel:           PapelEquipe;
  especialidade:   string | null;
  presente:        boolean;
  proximo_horario: string | null;  // "HH:MM" ou null
}

export interface ProfissionalResumo {
  id:            number;
  nome:          string;
  funcao:        string;
  data_ingresso: string | null;
  foto_url:      string | null;
}

// ─── ADMIN / FUNC ──────────────────────────────────────────────────────────────
export interface DashboardAdminData {
  consultas_hoje:           number;
  pacientes_ativos:         number;
  profissionais_presentes:  number;
  profissionais_total:      number;
  funcionarios_presentes:   number;
  agendamentos_abertos:     number;
  agendamentos_urgentes:    number;
  agendamentos_cancelados:  number;
  chamados_abertos:         number;
  faltas_pendentes:         number;
  faltas_hoje:              number;
  relatorios_pendentes:     number;
  alertas:                  AlertaAPI[];
  atividade_recente:        AtividadeAPI[];
  equipe_hoje:              EquipeMembroAPI[];
  cadastros_recentes:       ProfissionalResumo[];
}

// ─── PROF ──────────────────────────────────────────────────────────────────────
export interface DashboardProfData {
  consultas_hoje:      number;
  proxima_consulta: {
    paciente_nome: string;
    hora:          string;
    tipo:          string;
  } | null;
  pacientes_ativos:    number;
  agendamentos_abertos: number;
  faltas_pendentes:    number;
  atividade_recente:   AtividadeAPI[];
}

// ─── RESP ──────────────────────────────────────────────────────────────────────
export interface DashboardRespData {
  pacientes_vinculados: number;
  proximo_agendamento: {
    paciente_nome:     string;
    profissional_nome: string;
    data:              string;
    hora:              string;
  } | null;
  eventos_recentes:  number;
  atividade_recente: AtividadeAPI[];
}

// ─── PAC ───────────────────────────────────────────────────────────────────────
export interface DashboardPacData {
  proximo_agendamento: {
    profissional_nome: string;
    data:              string;
    hora:              string;
  } | null;
  total_sessoes:    number;
  medicacoes_ativas: number;
  atividade_recente: AtividadeAPI[];
}

// ─── Union ─────────────────────────────────────────────────────────────────────
export type DashboardData =
  | DashboardAdminData
  | DashboardProfData
  | DashboardRespData
  | DashboardPacData;

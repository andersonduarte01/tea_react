export interface VisualStatus {
  label:   string;
  classe:  string;
  icone:   string;
  alerta?: boolean;
}

export type StatusAgendamento =
  | 'aguardando'
  | 'realizado'
  | 'nao_compareceu'
  | 'cancelado'
  | 'remarcado';

export type StatusOperacional =
  | 'pendente'
  | 'confirmado'
  | 'atrasado'
  | 'em_atendimento';

export interface Agendamento {
  id:                 number;
  paciente_id:        number;
  paciente_nome:      string;
  profissional_nome:  string;
  data:               string;       // YYYY-MM-DD
  hora_inicio:        string;       // HH:MM:SS
  hora_fim:           string;       // HH:MM:SS
  status:             StatusAgendamento;
  status_operacional: StatusOperacional;
  visual_status:      VisualStatus;
}

export interface AgendamentosPage {
  count:    number;
  next:     string | null;
  previous: string | null;
  results:  Agendamento[];
}

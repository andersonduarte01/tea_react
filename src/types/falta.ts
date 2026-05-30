export interface FaltaProfissional {
  id: number;
  profissional_id: number;
  profissional_nome: string;
  profissional_funcao?: string | null;
  data: string;
  motivo: string | null;
}

export interface FaltasPage {
  count: number;
  next: string | null;
  previous: string | null;
  results: FaltaProfissional[];
}

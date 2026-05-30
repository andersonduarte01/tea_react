export interface CriarFeriadoInput {
  data: string;
  descricao: string;
  ativo?: boolean;
}

export interface Feriado {
  id: number;
  data: string;
  descricao: string;
  ativo: boolean;
}

export interface FeriadoPage {
  count: number;
  next: string | null;
  previous: string | null;
  results: Feriado[];
}

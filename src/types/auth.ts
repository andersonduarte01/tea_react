export type TipoUsuario = 'ADMIN' | 'PROF' | 'FUNC' | 'RESP' | 'PAC';

export interface ClinicaVinculo {
  id: number;
  nome: string;
  tipo_usuario: TipoUsuario;
}

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  tipo_usuario: TipoUsuario | null;
  token: string;
  clinicas: ClinicaVinculo[];
}

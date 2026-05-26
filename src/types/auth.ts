export type TipoUsuario = 'ADMIN' | 'PROF' | 'FUNC' | 'RESP' | 'PAC';

export interface ClinicaVinculo {
  id:            number;
  nome:          string;
  tipo_usuario:  TipoUsuario;
  tela_inicial?: string;
  foto?:         string | null;
}

export interface Usuario {
  id:           number;
  nome:         string;
  email:        string;
  tipo_usuario: TipoUsuario | null;
  clinica_id:   number | null;       // clínica selecionada (X-Clinica-ID)
  token:        string;              // access token
  clinicas:     ClinicaVinculo[];
}

export interface EnderecoClinica {
  id:          number;
  logradouro:  string;
  numero:      string;
  complemento: string | null;
  bairro:      string;
  cidade:      string;
  estado:      string;
  cep:         string;
}

export interface ClinicaDetalhe {
  id:                 number;
  nome:               string;
  slug:               string;
  cnpj:               string | null;
  telefone:           string | null;
  email:              string | null;
  foto:               string | null;
  endereco:           EnderecoClinica | null;
  ativa:              boolean;
  data_criacao:       string;
  meu_papel:          string;
  meu_papel_display:  string;
  tipo_usuario_atual: string;
}

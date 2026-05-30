export interface EnderecoInput {
  logradouro:   string;
  numero?:      string;
  complemento?: string;
  bairro:       string;
  cidade:       string;
  estado:       string;
  cep:          string;
}

export interface CriarProfissionalInput {
  nome:             string;
  email:            string;
  password:         string;
  cpf:              string;
  funcao:           string;
  telefone?:        string;
  data_nascimento?: string;
  endereco?:        EnderecoInput;
}

export interface Profissional {
  id:            number;
  nome:          string;
  email:         string;
  cpf:           string;
  funcao:        string;
  telefone:      string | null;
  ativo:         boolean;
  data_ingresso: string | null;
  foto_url:      string | null;
}

# PROMPT — REVISÃO E IMPLEMENTAÇÃO DE ENDPOINTS: API TEA-CE

---

## CONTEXTO DO PROJETO

Você está trabalhando no backend de um sistema clínico educacional chamado **TEA-CE**.

- **Stack backend:** Django REST Framework (inferido pela estrutura dos endpoints)
- **Base URL:** `/api/v1/`
- **Autenticação:** JWT com Bearer Token (access + refresh)
- **Header obrigatório em todas as rotas (exceto auth):** `X-Clinica-ID`
- **Papéis de usuário:** `ADMIN`, `PROF` (Profissional), `FUNC` (Funcionário), `RESP` (Responsável), `PAC` (Paciente)

O frontend é um aplicativo **React Native** que consome esta API. Foram identificadas **inconsistências críticas e endpoints ausentes** que impedem o desenvolvimento correto do app mobile. Sua missão é corrigir e implementar tudo descrito abaixo.

---

## ENDPOINTS ATUAIS (referência completa)

```
BASE URL: /api/v1/

1. AUTH
   POST   auth/login/           — CPF + senha → access token + refresh token
   POST   auth/refresh/         — Renova access token
   POST   auth/logout/          — Blacklist do refresh token
   GET    auth/me/              — Dados do usuário autenticado

2. CLÍNICA / DASHBOARD
   GET    clinica/              — Dados da clínica + papel do usuário
   GET    clinica/dashboard/    — Contadores operacionais (filtra por papel)

3. ADMIN
   GET    admin/perfil/
   PATCH  admin/perfil/

4. PROFISSIONAL
   GET    profissional/
   GET    profissional/perfil/
   PATCH  profissional/perfil/

5. FUNCIONÁRIO
   GET    funcionario/
   GET    funcionario/perfil/
   PATCH  funcionario/perfil/

6. RESPONSÁVEL
   GET    responsavel/
   GET    responsavel/<id>/
   GET    responsavel/perfil/
   PATCH  responsavel/perfil/
   GET    responsavel/pacientes/

7. PACIENTE
   GET    paciente/
   GET    paciente/<id>/
   GET    paciente/perfil/
   PATCH  paciente/perfil/
   GET    paciente/responsaveis/

8. AGENDA
   GET/POST  agenda/agendamentos/
   GET       agenda/agendamentos/<id>/
   POST      agenda/agendamentos/<id>/remarcar/
   POST      agenda/agendamentos/<id>/cancelar/
   POST      agenda/agendamentos/<id>/confirmar/
   POST      agenda/agendamentos/<id>/realizar/
   POST      agenda/agendamentos/<id>/nao-compareceu/
   GET       agenda/horarios-disponiveis/
   GET       agenda/profissionais/
   GET       agenda/profissionais/<id>/
   GET/POST  agenda/feriados/
   GET/PATCH/DELETE  agenda/feriados/<id>/
   GET/POST  agenda/faltas/
   GET/DELETE agenda/faltas/<id>/

9. SESSÃO TERAPÊUTICA
   GET/POST    sessao/
   GET/PATCH   sessao/<id>/
   GET         sessao/<id>/evolucoes/
   PUT         sessao/<id>/evolucoes/

10. MEDICAÇÃO
    GET/POST   medicacao/
    GET/PATCH  medicacao/<id>/
    POST       medicacao/<id>/alterar/
    POST       medicacao/<id>/interromper/

11. EVENTO COTIDIANO
    GET/POST        evento/
    GET/PATCH/DELETE evento/<id>/

12. FORMULÁRIO
    GET    formulario/
    GET    formulario/<id>/
    POST   formulario/<id>/responder/
    GET    formulario/respostas/

13. TIMELINE
    GET    timeline/   (parâmetro obrigatório: ?paciente_id=<id>)
```

---

## PROBLEMA 1 — CRÍTICO: `clinica/dashboard/` SEM CONTRATO DE RESPOSTA

### Situação atual
O endpoint existe mas **não documenta o shape do JSON retornado**. A documentação diz apenas:
> "Retorna contadores operacionais da clínica (agendamentos do dia, pacientes ativos, etc.)"

### O que precisa ser feito
Documentar e garantir que o endpoint retorne exatamente o seguinte contrato JSON.
Se algum campo ainda não existe no backend, deve ser implementado.

**Shape esperado para papel `ADMIN` e `FUNC`:**
```json
{
  "consultas_hoje": 12,
  "pacientes_ativos": 248,
  "profissionais_presentes": 8,
  "profissionais_total": 10,
  "funcionarios_presentes": 15,
  "agendamentos_abertos": 34,
  "agendamentos_urgentes": 8,
  "chamados_abertos": 7,
  "faltas_pendentes": 8,
  "relatorios_pendentes": 5,
  "alertas": [
    {
      "tipo": "warning" | "error" | "info",
      "titulo": "string",
      "descricao": "string",
      "quantidade": 8
    }
  ],
  "atividade_recente": [
    {
      "id": "uuid-ou-int",
      "tipo": "consulta_realizada" | "novo_cadastro" | "ausencia_registrada" | "chamado_aberto" | "agendamento_criado",
      "descricao": "string",
      "timestamp": "2024-05-24T13:40:00Z",
      "status": "success" | "info" | "warning" | "error"
    }
  ],
  "equipe_hoje": [
    {
      "id": 1,
      "nome": "string",
      "papel": "PROF" | "FUNC",
      "especialidade": "string | null",
      "presente": true,
      "proximo_horario": "14:00" | null
    }
  ]
}
```

**Shape esperado para papel `PROF`:**
```json
{
  "consultas_hoje": 5,
  "proxima_consulta": {
    "paciente_nome": "string",
    "hora": "14:00",
    "tipo": "string"
  } | null,
  "pacientes_ativos": 32,
  "agendamentos_abertos": 10,
  "faltas_pendentes": 2,
  "atividade_recente": [ ... ]
}
```

**Shape esperado para papel `RESP`:**
```json
{
  "pacientes_vinculados": 2,
  "proximo_agendamento": {
    "paciente_nome": "string",
    "profissional_nome": "string",
    "data": "2024-05-25",
    "hora": "10:00"
  } | null,
  "eventos_recentes": 3,
  "atividade_recente": [ ... ]
}
```

**Shape esperado para papel `PAC`:**
```json
{
  "proximo_agendamento": {
    "profissional_nome": "string",
    "data": "2024-05-25",
    "hora": "10:00"
  } | null,
  "total_sessoes": 12,
  "medicacoes_ativas": 2,
  "atividade_recente": [ ... ]
}
```

---

## PROBLEMA 2 — CRÍTICO: `auth/login/` — CPF ou E-MAIL?

### Situação atual
A documentação diz:
> "Autentica o usuário com **CPF** e senha"

O frontend atual envia:
```json
{ "email": "usuario@email.com", "password": "senha123" }
```

### O que precisa ser confirmado e corrigido

**Opção A** — Se o backend aceita apenas CPF:
- Confirmar que o campo é `cpf` e não `email`
- Documentar o formato aceito: `"12345678900"` (apenas números) ou `"123.456.789-00"` (formatado)
- O frontend será atualizado para enviar `cpf` ao invés de `email`

**Opção B** — Se o backend aceita e-mail:
- Corrigir a documentação para refletir isso
- Confirmar que o campo correto é `email` (não `cpf`)

**Opção C** — Se aceita os dois (CPF ou e-mail no mesmo campo):
- Documentar o nome do campo unificado (ex: `"identifier"` ou `"login"`)
- Documentar o comportamento de validação

**Ação necessária:** Escolher uma das opções, garantir que o backend implementa corretamente e documentar o campo exato com seu nome e formato.

**Shape esperado da resposta de login:**
```json
{
  "access": "eyJ...",
  "refresh": "eyJ...",
  "usuario": {
    "id": 1,
    "nome": "Anderson Silva",
    "email": "anderson@email.com",
    "cpf": "123.456.789-00"
  },
  "clinicas": [
    {
      "id": 1,
      "nome": "Clínica TEA Centro",
      "tipo_usuario": "ADMIN"
    },
    {
      "id": 2,
      "nome": "Clínica TEA Norte",
      "tipo_usuario": "FUNC"
    }
  ]
}
```

> **Atenção:** O usuário pode ter papéis diferentes em clínicas diferentes. A lista `clinicas` deve sempre ser retornada no login para que o app mobile possa exibir o seletor de clínica.

---

## PROBLEMA 3 — CRÍTICO: `auth/refresh/` — CONTRATO NECESSÁRIO

O frontend precisa implementar refresh automático de token. Para isso, o endpoint precisa estar documentado:

**Request:**
```json
POST auth/refresh/
{ "refresh": "eyJ..." }
```

**Response (sucesso):**
```json
{ "access": "eyJ..." }
```

**Response (token expirado/inválido — 401):**
```json
{ "detail": "Token is invalid or expired", "code": "token_not_valid" }
```

Confirmar se o refresh token também é rotacionado (novo refresh retornado junto com o access) ou se o mesmo refresh token permanece válido até sua expiração.

---

## PROBLEMA 4 — ALTO: ENDPOINTS AUSENTES EM `profissional/` E `funcionario/`

### Situação atual
```
GET responsavel/<id>/   ✅ existe
GET paciente/<id>/      ✅ existe
GET profissional/<id>/  ❌ ausente
GET funcionario/<id>/   ❌ ausente
```

O admin precisa visualizar o perfil completo de um profissional ou funcionário específico por ID. Esses endpoints precisam ser criados.

### Implementar

```
GET  profissional/<id>/
```
**Response:**
```json
{
  "id": 1,
  "nome": "Dr. Carlos Lima",
  "email": "carlos@email.com",
  "cpf": "123.456.789-00",
  "telefone": "85999990000",
  "especialidade": "Psiquiatra",
  "registro_profissional": "CRM-CE 12345",
  "ativo": true,
  "data_ingresso": "2023-01-15",
  "foto_url": "https://..." | null
}
```
**Permissões:** `ADMIN` e `FUNC` podem acessar qualquer ID. `PROF` só pode acessar o próprio ID.

```
GET  funcionario/<id>/
```
**Response:**
```json
{
  "id": 1,
  "nome": "Ana Santos",
  "email": "ana@email.com",
  "cpf": "987.654.321-00",
  "telefone": "85988880000",
  "cargo": "Recepcionista",
  "ativo": true,
  "data_ingresso": "2022-06-01",
  "foto_url": "https://..." | null
}
```
**Permissões:** `ADMIN` pode acessar qualquer ID.

---

## PROBLEMA 5 — ALTO: `admin/` SEM OPERAÇÕES DE GESTÃO DE USUÁRIOS

### Situação atual
O painel admin mobile precisa criar e gerenciar usuários. Os endpoints atuais só expõem o perfil do próprio admin.

### Implementar (se for escopo do app mobile — confirmar com PO)

```
POST   admin/profissional/          — Cria novo profissional na clínica
POST   admin/funcionario/           — Cria novo funcionário na clínica
POST   admin/responsavel/           — Cria novo responsável
POST   admin/paciente/              — Cria novo paciente e vincula a responsável

PATCH  admin/profissional/<id>/     — Edita profissional
PATCH  admin/funcionario/<id>/      — Edita funcionário

POST   admin/profissional/<id>/desativar/   — Desativa acesso
POST   admin/profissional/<id>/ativar/      — Reativa acesso
POST   admin/funcionario/<id>/desativar/
POST   admin/funcionario/<id>/ativar/
```

> Se essas operações são exclusivas do painel web, documentar explicitamente que o app mobile é somente leitura para gestão de usuários.

---

## PROBLEMA 6 — MÉDIO: `auth/logout/` — CONFIRMAR COMPORTAMENTO

**Request esperado:**
```json
POST auth/logout/
Authorization: Bearer <access_token>

{ "refresh": "eyJ..." }
```

**Response (sucesso — 204 No Content):**
```
(sem body)
```

Confirmar:
1. O campo do body é `"refresh"` ou `"refresh_token"`?
2. Retorna 204 ou 200?
3. Invalida apenas o refresh token ou também o access token?

---

## PROBLEMA 7 — MÉDIO: `clinica/` — CONFIRMAR SHAPE DE RESPOSTA

O frontend usa este endpoint para carregar dados da clínica selecionada. Confirmar o shape:

**Request:**
```
GET clinica/
Headers:
  Authorization: Bearer <token>
  X-Clinica-ID: 1
```

**Response esperada:**
```json
{
  "id": 1,
  "nome": "Clínica TEA Centro",
  "cnpj": "12.345.678/0001-00",
  "endereco": "Rua X, 123, Fortaleza-CE",
  "telefone": "85333330000",
  "email_contato": "contato@clinica.com",
  "logo_url": "https://..." | null,
  "tipo_usuario_atual": "ADMIN"
}
```

O campo `tipo_usuario_atual` é essencial — indica qual é o papel do usuário autenticado **nesta clínica específica**.

---

## PROBLEMA 8 — MÉDIO: PAGINAÇÃO — PADRONIZAR CONTRATO

Os endpoints de listagem (`profissional/`, `funcionario/`, `paciente/`, etc.) usam paginação, mas o contrato não está documentado.

**Confirmar e documentar o shape padrão de paginação:**
```json
{
  "count": 248,
  "next": "http://host/api/v1/paciente/?page=2" | null,
  "previous": null,
  "results": [ ... ]
}
```

Confirmar:
1. O parâmetro de página é `?page=2` ou `?offset=20&limit=20`?
2. Qual é o tamanho padrão de página (`page_size`)?
3. É possível sobrescrever com `?page_size=50`?

---

## ENTREGÁVEIS ESPERADOS

Para cada problema acima, entregar:

1. **Confirmação** do comportamento atual do backend (o que já existe)
2. **Implementação** do que está faltando (novos endpoints, campos, serializers)
3. **Documentação atualizada** no formato da API (manter o mesmo padrão do `ENDPOINTS.txt`)
4. **Exemplos de request/response** para cada endpoint novo ou corrigido
5. **Códigos de erro** possíveis para cada endpoint (400, 401, 403, 404, etc.) com o shape do body de erro

---

## FORMATO PADRÃO DE ERRO ESPERADO

O frontend precisa tratar erros de forma padronizada. Confirmar e garantir que TODOS os erros da API seguem este formato:

```json
{
  "detail": "Mensagem legível para o usuário",
  "code": "identificador_do_erro",
  "field_errors": {
    "campo": ["mensagem de validação"]
  }
}
```

Onde `field_errors` é opcional e presente apenas em erros de validação (400).

---

## PRIORIDADE DE IMPLEMENTAÇÃO

| Prioridade | Item |
|---|---|
| 🔴 P0 — Bloqueante | Contrato de resposta de `clinica/dashboard/` |
| 🔴 P0 — Bloqueante | Esclarecer CPF vs e-mail no `auth/login/` |
| 🔴 P0 — Bloqueante | Contrato de `auth/refresh/` e `auth/logout/` |
| 🟠 P1 — Alta | `GET profissional/<id>/` e `GET funcionario/<id>/` |
| 🟠 P1 — Alta | Contrato completo de `clinica/` |
| 🟠 P1 — Alta | Padronização de paginação |
| 🟡 P2 — Média | Operações de gestão de usuários em `admin/` |
| 🟡 P2 — Média | Padronização do formato de erro |

---

**Ao finalizar as implementações, fornecer o arquivo `ENDPOINTS.txt` atualizado com todas as rotas, seus shapes de request/response, códigos de erro e observações de permissão.**

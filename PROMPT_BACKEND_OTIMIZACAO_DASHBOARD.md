# PROMPT — OTIMIZAÇÃO DO DASHBOARD ADMIN: 3 AJUSTES CIRÚRGICOS

---

## CONTEXTO

O app mobile React Native consome o endpoint `GET clinica/dashboard/` para montar
o painel administrativo. Atualmente o frontend precisa fazer **chamadas extras**
para obter dados que deveriam vir diretamente no dashboard, causando desperdício
de banco de dados e latência desnecessária.

Este prompt descreve **3 ajustes pequenos e isolados**. Cada um é independente dos
outros. Não altere nenhuma outra lógica, rota, serializer ou model além do
estritamente descrito aqui.

---

## REGRA GERAL — LEIA ANTES DE IMPLEMENTAR

> **Não mexa em nada além do que está descrito neste documento.**
> Não renomeie campos existentes, não altere tipos já existentes, não mude
> comportamento de outros endpoints. Apenas adicione o que está listado abaixo.
> O objetivo é acréscimo, não refatoração.

---

## AJUSTE 1 — Adicionar campo `faltas_hoje` no response do dashboard (ADMIN/FUNC)

### Problema atual
O dashboard retorna `faltas_pendentes` que conta faltas **a partir de hoje em diante**
(hoje + futuras). O frontend precisa buscar `GET agenda/faltas/?futuras=true`
separadamente e filtrar por data no cliente só para saber quantas faltas existem
**especificamente hoje**.

### O que fazer
No endpoint `GET clinica/dashboard/`, para os papéis `ADMIN` e `FUNC`, adicionar
o campo `faltas_hoje` ao JSON de resposta.

**Definição:**
- `faltas_hoje` → inteiro — quantidade de registros em `FaltaProfissional`
  onde `data == date.today()` para a clínica atual (identificada pelo header `X-Clinica-ID`)

### Shape após a mudança (somente os campos relevantes — os demais permanecem iguais)

```json
{
  "faltas_pendentes": 8,
  "faltas_hoje": 2,
  ...
}
```

### O que NÃO fazer
- Não remover nem renomear `faltas_pendentes`
- Não alterar nenhum outro campo do dashboard
- Não alterar a lógica de `faltas_pendentes`

---

## AJUSTE 2 — Adicionar campo `data_ingresso` no endpoint de listagem de profissionais

### Problema atual
`GET profissional/` retorna `{ id, nome, email, funcao, telefone, foto }`.
O campo `data_ingresso` só existe no endpoint de detalhe `GET profissional/<id>/`.
Para mostrar a data de cadastro de 5 profissionais, o frontend é forçado a fazer
**5 chamadas individuais de detalhe**, gerando N+1 queries.

### O que fazer
Incluir o campo `data_ingresso` no serializer de listagem de `GET profissional/`.

**Definição:**
- `data_ingresso` → string ISO-8601 (`"2023-01-15T00:00:00Z"`) ou `null`

### Shape após a mudança

```json
[
  {
    "id": 1,
    "nome": "Dr. Carlos Lima",
    "email": "carlos@clinica.com",
    "funcao": "Psiquiatra",
    "telefone": "85999990000",
    "foto": "https://..." ,
    "data_ingresso": "2023-01-15T00:00:00Z"
  }
]
```

### O que NÃO fazer
- Não remover nem renomear nenhum campo existente da lista
- Não alterar o endpoint `GET profissional/<id>/`
- Não alterar permissões ou filtros existentes
- Não adicionar paginação se já é lista simples

---

## AJUSTE 3 — Adicionar campo `cadastros_recentes` no response do dashboard (ADMIN/FUNC)

### Problema atual
Para exibir os 5 profissionais cadastrados mais recentemente, o frontend precisa
chamar `GET profissional/?ordering=-id` separadamente.

### O que fazer
No endpoint `GET clinica/dashboard/`, para os papéis `ADMIN` e `FUNC`, adicionar
o campo `cadastros_recentes` com os 5 profissionais mais recentes da clínica.

**Definição:**
- Buscar os 5 profissionais ativos da clínica com maior `id` (os mais recentes)
- Ordenar do mais recente para o mais antigo

### Shape do campo

```json
{
  "cadastros_recentes": [
    {
      "id": 12,
      "nome": "Dra. Beatriz Melo",
      "funcao": "Fonoaudióloga",
      "data_ingresso": "2026-05-10T00:00:00Z"
    },
    {
      "id": 11,
      "nome": "Dr. Paulo Ramos",
      "funcao": "Psicólogo",
      "data_ingresso": "2026-04-22T00:00:00Z"
    }
  ],
  ...
}
```

### O que NÃO fazer
- Não remover `equipe_hoje` nem qualquer outro campo já existente no dashboard
- Não expor campos sensíveis como `cpf`, `email` ou `telefone` neste campo
- Não alterar o endpoint `GET profissional/`

---

## RESUMO DOS CAMPOS ADICIONADOS

| Endpoint | Campo adicionado | Tipo | Papel |
|---|---|---|---|
| `GET clinica/dashboard/` | `faltas_hoje` | `int` | ADMIN, FUNC |
| `GET clinica/dashboard/` | `cadastros_recentes` | `array[objeto]` | ADMIN, FUNC |
| `GET profissional/` | `data_ingresso` | `string ISO-8601 \| null` | ADMIN, PROF, FUNC |

---

## ENTREGÁVEIS

1. Código das alterações (serializers / views / querysets afetados)
2. Confirmação de que nenhum campo existente foi alterado ou removido
3. Atualização do `ENDPOINTS.txt` apenas nos trechos correspondentes aos 3 ajustes

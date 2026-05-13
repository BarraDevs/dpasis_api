# Integração frontend — Campo `type` (PF / PJ) na revenda

## Introdução

Foi adicionado ao modelo de **revenda** o campo obrigatório no banco `**type`**, assumindo apenas os valores `**PF**` ou `**PJ**` (literal string, mesmo padrão do campo `**type**` em **Cliente**).

O campo aparece no corpo `**POST`** (criação) e opcionalmente no `**PATCH**` (edição, partial), assim como nos objetos de revenda nas respostas (listagem paginada, detalhe).

**Referência OpenAPI:** Swagger em `/swagger`, tag **Revendas**.

**Relacionado:**

- [Nome social na revenda](./frontend-integracao-revenda-nome-social.md)

## Base URL admin

- Prefixo: `/admin/resale`
- Autenticação: JWT de **admin**
- Claims: `**RESALE_READ`** / `**RESALE_WRITE**` (conforme cada rota)

## Resumo das mudanças


| Área                   | Comportamento                                                                                                                                  |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **Breaking (criação)** | `**POST /admin/resale`** exige o campo textual `**type**` com valor `**PF**` ou `**PJ**` (via JSON ou campo de texto no `multipart/form-data`) |
| **Aditivo (edição)**   | `**PATCH /admin/resale/:id`** aceita atualização opcional de `**type**` (partial)                                                              |
| **Aditivo (leitura)**  | Respostas que devolvem a revenda passam a incluir `**type`** como `**"PF"` | `"PJ"**`                                                          |


### CPF ou CNPJ

- `**document**` continua validado apenas como CPF ou CNPJ (11 ou 14 dígitos sanitizados), **sem** regra extra no domínio que obrigue `**PF`** somente para CPF e `**PJ**` somente para CNPJ — o frontend pode alinhar a UX por convenção.

## Contrato

### Criação (`POST /admin/resale`)

`multipart/form-data` para o mesmo contrato atual; incluir campo de texto:


| Campo  | Tipo            | Obrigatório | Observação                                                              |
| ------ | --------------- | ----------- | ----------------------------------------------------------------------- |
| `type` | `"PF"` | `"PJ"` | Sim         | Trim aplicado antes da validação; valores fora da enum retornam **400** |


### Edição (`PATCH /admin/resale/:id`)


| Campo  | Tipo            | Obrigatório   |
| ------ | --------------- | ------------- |
| `type` | `"PF"` | `"PJ"` | Não (partial) |


### Respostas (lista paginada, detalhe `GET /admin/resale/:id`)


| Campo  | Tipo            |
| ------ | --------------- |
| `type` | `"PF"` | `"PJ"` |


## Erros

- `**400`** — validação (`type` ausente na criação, valor inválido, trim resultando em valor fora da enum ou mensagens de validação de outros campos no mesmo payload).
- Respostas de erro padronizadas com `**message**` quando propagadas como `**AppException**`.

## Checklist para o frontend

1. Incluir `**type**` no formulário de **criação** de revenda (obrigatório), com apenas `**PF`** / `**PJ**`.
2. Atualizar tipos/interfaces do agregado de revenda (`type: 'PF' | 'PJ'`) conforme Swagger ou cliente gerado.
3. Edição parcial: enviar `**type**` só quando o usuário alterar o campo.
4. Se o projeto usa apenas JSON em dev, garantir mesmo shape (string enum); se usa `**multipart/form-data**`, manter campo texto como nos demais.


# Integração frontend — cadastro de cliente e lookup documento + CNPJ

## Introdução

Este documento cobre:

- Novo endpoint **`POST /admin/client/lookup-document-and-cnpj`**, que combina em paralelo: verificação de **documento de cliente já cadastrado** e **consulta de dados de CNPJ** (o mesmo texto de documento é reaproveitado na chamada externa de CNPJ).
- **Breaking change** no **cadastro e edição de cliente (admin)**: o backend **deixa de rejeitar** documentos duplicados entre clientes (`409` / `DocumentAlreadyTakenError` não se aplica mais a cliente nesses fluxos).

Consulte o Swagger em `/swagger` — tag **Clientes** (`lookup-document-and-cnpj`) e demais rotas **admin** de cliente para o schema completo.

## Autenticação e URLs

- **`POST /admin/client/lookup-document-and-cnpj`**: mesma proteção das outras rotas deste controller — conta **`ADMIN`** (`@RequiredRoles`) e claim **`CLIENT_READ`** (`Claim.CLIENT_READ`), ou seja, JWT admin com permissão de leitura de cliente.
- As rotas públicas **`POST /external-apis/cep`** e **`POST /external-apis/cnpj`** não mudam e continuam **sem** `@RequiredRoles` / claims no controller; **não** existe rota combinada documento+CNPJ sob `/external-apis/*`.

## Resumo das mudanças

| Área | Antes | Depois |
|------|--------|--------|
| `POST /admin/client` (criar cliente) | Documento já existente → erro `409` com mensagem tipo *O documento … já está em uso.* | Duplicata de documento **permitida**; requisição pode concluir com sucesso. |
| `PATCH /admin/client/:id` (editar cliente) | Ao mudar `document` para um já usado por outro cliente → `409` | Mesma regra: **permitido** repetir documento de outro cliente. |
| Pré-cadastro / UX | N/A | Opcional: **`POST /admin/client/lookup-document-and-cnpj`** (admin + `CLIENT_READ`) para saber se o documento já está em uso **e** trazer dados do CNPJ na mesma resposta. |

## `POST /admin/client/lookup-document-and-cnpj`

**Content-Type:** `application/json`

### Body

| Campo | Tipo | Obrigatório | Notas |
|--------|------|-------------|--------|
| `document` | string | sim | Mesmo conceito do cadastro de cliente (CPF/CNPJ); normalização interna (ex.: `09.748.165/0001-10` → dígitos). Esse valor é usado **tanto** para checar duplicidade em cliente **quanto** como parâmetro da consulta de CNPJ (equivalente ao campo `cnpj` de `POST /external-apis/cnpj`). Não há campo `cnpj` separado no payload. |

Validações geram **400** com mensagens em pt-BR no padrão do `ValidationPipe`.

### Resposta 200

| Campo | Tipo | Descrição |
|--------|------|------------|
| `documentInUse` | boolean | `true` se já existir cliente com o **documento normalizado**; `false` caso contrário. |
| `cnpjLookup` | objeto ou `null` | Quando a consulta de CNPJ **bem-sucedida**, mesmo formato conceitual que `POST /external-apis/cnpj` (`fantasyName`, `companyName`, `address` com `zipCode`, `street`, `number`, `complement`, `neighborhood`, `city`, `state`). |
| `cnpjErrorMessage` | string ou `null` | Preenchido quando a consulta de CNPJ **falha** (ex.: serviço externo indisponível ou valor não tratável como CNPJ); **não** impede o retorno de `documentInUse`. |

**Importante:** falha **somente** na consulta de CNPJ resulta em **`200`** com `cnpjLookup: null` e `cnpjErrorMessage` preenchido — o processo **não** é encerrado com erro HTTP por causa do CNPJ.

### Erros

- **400**: payload inválido (validação).
- **401 / 403**: quando aplicável — rota admin autenticada (credencial ausente ou sem papel/claim).
- Outros códigos seguem o filter global apenas se algo fora do caso acima falhar (ex.: erro não previsto).

## Breaking change — cliente admin

1. **Não** assumir mais que o backend bloqueia documento duplicado em `POST /admin/client` ou `PATCH /admin/client/:id`.
2. Se o produto precisar alertar “documento já cadastrado”, usar **`POST /admin/client/lookup-document-and-cnpj`** (campo `documentInUse`) ou outra estratégia de UX — apenas leitura; não cria cliente.
3. Ajustar tratamento de erro: remover UX que dependa exclusivamente de `409` + mensagem de documento em uso **nesse** contexto de cliente.

## Checklist frontend

1. Chamar `POST /admin/client/lookup-document-and-cnpj` com header/session admin e claim de leitura de cliente; body só `{ document: string }`.
2. Tipar resposta com `documentInUse`, `cnpjLookup | null`, `cnpjErrorMessage | null`.
3. Tratar `cnpjErrorMessage` sem falhar a tela de cadastro — exibir aviso e seguir com dados manuais se necessário.
4. Revisar fluxo de criação/edição de cliente: duplicata de documento passa a ser aceita pela API.
5. Atualizar mocks E2E e textos de erro esperados nos testes de cliente.

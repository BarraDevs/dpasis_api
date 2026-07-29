# Integração frontend — Endereços de cliente (`/admin/client-address`)

## Introdução

Este documento cobre mudanças no fluxo de **código IBGE do município** (`cityCodeIbge`) em endereços de cliente e na consulta de CEP.

**Referência OpenAPI:** Swagger em `/swagger`, tags **Clientes - Endereços** e **APIs Externas**.

Não há rotas novas nem alteração de claims. O contrato de request dos endpoints de endereço permanece o mesmo; o que muda é o **comportamento em segundo plano** e um **campo adicional** na resposta de `POST /external-apis/cep`.

## Resumo das mudanças

| Área | Antes | Depois |
|------|-------|--------|
| `POST /external-apis/cep` — resposta | `zipCode`, `street`, `complement`, `neighborhood`, `city`, `state` | **Aditivo:** `cityCodeIbge` (`string \| null`) |
| `POST /admin/client-address` — body | `cityCodeIbge` opcional | **Inalterado** — se omitido ou `null`, a API resolve o IBGE em background |
| `PATCH /admin/client-address/:id` — body | `cityCodeIbge` opcional | **Inalterado** — se o endereço ficar sem IBGE após a edição, a API reenfileira a resolução |
| `GET /admin/client-address` / `GET /admin/client-address/:id` | `cityCodeIbge` pode ser `null` | **Comportamento:** após create/edit sem IBGE, o campo pode permanecer `null` por alguns segundos até o job concluir |

**Breaking change:** nenhum nos payloads de entrada. A resposta de CEP ganha campo novo (compatível com clientes que ignoram propriedades extras).

## Base URL

| Recurso | Prefixo | Autenticação |
|---------|---------|--------------|
| Endereços de cliente | `/admin/client-address` | Admin + claims `CLIENT_ADDRESS_READ` / `CLIENT_ADDRESS_WRITE` |
| Consulta de CEP | `/external-apis/cep` | Conforme configuração atual do módulo (sem claim de endereço) |

## Consulta de CEP (`POST /external-apis/cep`)

### Request (inalterado)

```json
{
  "zipCode": "01310100"
}
```

### Response (campo novo)

```json
{
  "zipCode": "01310100",
  "street": "Avenida Paulista",
  "complement": "lado ímpar",
  "neighborhood": "Bela Vista",
  "city": "São Paulo",
  "state": "SP",
  "cityCodeIbge": "3550308"
}
```

| Campo | Tipo | Observação |
|-------|------|------------|
| `cityCodeIbge` | `string \| null` | Código IBGE de 7 dígitos retornado pelo ViaCEP; `null` se a API externa não trouxer o valor |

**Recomendação:** ao preencher o formulário de endereço via CEP, enviar `cityCodeIbge` no create/edit do endereço. Com o valor presente, a API **não** dispara job de resolução assíncrona.

## Endereços de cliente — campo `cityCodeIbge`

### Create (`POST /admin/client-address`)

`cityCodeIbge` continua **opcional** (máx. 7 caracteres).

| Cenário no body | Comportamento da API |
|-----------------|----------------------|
| `cityCodeIbge` informado (ex.: vindo do CEP) | Persiste o valor; **sem** job em background |
| `cityCodeIbge` omitido ou `null` | Persiste o endereço com `cityCodeIbge: null` e enfileira resolução automática pelo CEP salvo |

Resposta imediata permanece `{ "id": number }` — **não** aguarda a resolução do IBGE.

### Edit (`PATCH /admin/client-address/:id`)

Body parcial (mesmos campos do create, exceto `clientId`).

| Cenário após a edição | Comportamento da API |
|-----------------------|----------------------|
| `cityCodeIbge` presente no endereço salvo | **Sem** job |
| `cityCodeIbge` ausente (`null`) — inclusive se o usuário limpou o campo ou só alterou outro campo com IBGE já vazio | Enfileira job com o `zipCode` atual do endereço |

Resposta imediata: `{ "message": "Edição realizada com sucesso" }`.

### Leitura (`GET /admin/client-address`, `GET /admin/client-address/:id`)

O DTO de saída já expõe `cityCodeIbge: string | null`. Após create/edit sem IBGE:

- O primeiro `GET` pode retornar `cityCodeIbge: null`.
- Após o job em background (consulta ViaCEP + persistência), um novo `GET` deve trazer o código preenchido, se o CEP for válido e o serviço externo responder.

A resolução só atualiza o registro se o **CEP ainda for o mesmo** do momento em que o job foi enfileirado (evita sobrescrever após o usuário trocar o CEP).

## Autenticação e claims

| Endpoint | Claim |
|----------|-------|
| `POST`, `PATCH`, `DELETE`, activate/deactivate em `/admin/client-address` | `CLIENT_ADDRESS_WRITE` |
| `GET` em `/admin/client-address` | `CLIENT_ADDRESS_READ` |

Sem mudanças em relação ao que já existia.

## Erros / UX

| Situação | HTTP | Ação sugerida no frontend |
|----------|------|---------------------------|
| Validação de body (CEP, campos obrigatórios, etc.) | `400` | Exibir `message` do payload |
| Endereço não encontrado | `404` | Tratar em edit/get/delete |
| ViaCEP indisponível no **lookup síncrono** (`POST /external-apis/cep`) | `503` | Mensagem ao usuário; não preencher endereço automaticamente |
| Falha na resolução assíncrona do IBGE | — | Não bloqueia create/edit; `cityCodeIbge` pode permanecer `null` até retry do job ou nova edição |

Não há endpoint de status do job exposto ao frontend.

## Checklist prático para o frontend

1. Atualizar tipo da resposta de `POST /external-apis/cep` com `cityCodeIbge?: string | null`.
2. Ao autocompletar endereço pelo CEP, mapear `cityCodeIbge` para o formulário e enviá-lo no create/edit quando disponível.
3. Tratar `cityCodeIbge: null` na listagem/detalhe como estado válido (pendente ou indisponível), não como erro de validação.
4. Se a tela exige IBGE preenchido antes de prosseguir, após salvar sem o campo: **refetch** do endereço (`GET /admin/client-address/:id`) com pequeno delay ou ao reabrir o registro — não esperar o valor na resposta do `POST`/`PATCH`.
5. Se o usuário limpar `cityCodeIbge` na edição, a API tentará resolver de novo em background; manter o mesmo comportamento de refetch se necessário.
6. Regenerar tipos OpenAPI / mocks E2E para incluir `cityCodeIbge` na resposta de CEP.
7. Claims `CLIENT_ADDRESS_READ` / `CLIENT_ADDRESS_WRITE` — sem alteração.

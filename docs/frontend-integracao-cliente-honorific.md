# Integração frontend — Cliente × pronome de tratamento (`honorificId`)

## Introdução

Cada **cliente** pode ter **no máximo um** pronome de tratamento vinculado (relação N:1: muitos clientes → um `Honorific`). O vínculo é **opcional** (`null`). O mesmo pronome pode ser reusado por vários clientes.

**Referência OpenAPI:** Swagger em `/swagger`, tag **Clientes** (payloads `CreateClient` / edição parcial).

**Relacionado:** [CRUD de pronomes de tratamento](./frontend-integracao-honorific.md) — lista e manutenção do catálogo; exclusão pode falhar quando ainda há clientes vinculados.

## Base URL admin

- Prefixo: `/admin/client`
- Autenticação e claims de cliente: **`CLIENT_READ`**, **`CLIENT_WRITE`** (mesmas rotas já existentes; não há nova claim só por este vínculo).

## Resumo das mudanças

| Área | Comportamento |
|------|----------------|
| **Aditivo** | Campo opcional `honorificId` (`number \| null`) no body de **criação** e **edição** parcial |
| **Aditivo** | Respostas que retornam `Client` incluem `honorificId` e objeto aninhado `honorific` (`{ id, name, active } \| null`) |
| **Regra** | Somente pronomes **ativos** podem ser **atribuídos** em create/edit; manter vínculo com pronome **inativo** já existente não é bloqueado se o frontend não enviar `honorificId` no PATCH |
| **Exclusão de pronome** | `DELETE /admin/honorific/:id` retorna **409** se ainda existir cliente com aquele `honorificId` |

## Contrato — criação (`POST /admin/client`)

| Campo | Tipo | Obrigatório | Observação |
|-------|------|-------------|------------|
| `honorificId` | `number` | Não | Positivo inteiro; pronome deve existir e estar **ativo** |
| `honorificId` | `null` | Não | Equivalente a sem pronome |

Omitir o campo continua válido (cliente sem pronome).

## Contrato — edição (`PATCH /admin/client/:id`)

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| `honorificId` | `number` | Não — atribui ou troca o pronome (deve estar **ativo**) |
| `honorificId` | `null` | Não — **remove** o vínculo (`skipNullProperties: false` no partial, permitindo `null` explícito) |

## Contrato — respostas (lista, detalhe, buscas que retornam `Client`)

| Campo | Tipo | Observação |
|-------|------|------------|
| `honorific` | `{ id: number; name: string; active: boolean } \| null` | `null` quando `honorificId` é `null` |

## Erros (UX)

| Situação | HTTP | Notas |
|----------|------|--------|
| `honorificId` inválido (validação) | 400 | Inteiro positivo (ex.: 0 rejeitado) |
| Pronome inexistente ou **inativo** ao **atribuir** | 404 | Mesma classe de erro que “não encontrado” (`HonorificNotFoundError`) |
| Excluir pronome ainda em uso | 409 | Mensagem: *Este pronome de tratamento está associado a um ou mais clientes e não pode ser excluído.* |

## Checklist para o frontend

1. Tipar `Client` com `honorificId` e `honorific` nas respostas.
2. Formulário: seletor de pronome alimentado por `GET /admin/honorific` (filtrar `active: true` na UX se desejado).
3. PATCH: enviar `honorificId: null` para limpar o campo.
4. Tela de exclusão de pronome: tratar **409** com mensagem amigável e sugerir reatribuição ou remoção do vínculo nos clientes.

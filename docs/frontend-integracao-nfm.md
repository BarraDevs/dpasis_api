# Integração frontend — NFM (geradas + elegíveis + emissão NFS-e)

## Introdução

Este documento cobre as rotas admin de **NFM**:
- `GET /admin/nfm` — NFMs persistidas com NFS-e vinculada (filtro por período)
- `GET /admin/nfm/elegible` — clientes/grupos elegíveis para emissão
- `GET /admin/nfm/:id` — detalhe de uma NFM gerada (com NFS-e vinculada)
- `POST /admin/nfm` — salva NFMs e dispara emissão de NFS-e (1:1)
- `POST /admin/nfm/:id/cancel` — cancela a NFS-e vinculada à NFM (síncrono, Giss)

**Referência OpenAPI:** Swagger em `/swagger`, tag **NFM**.

Config fiscal da empresa: [frontend-integracao-company-nfs-config.md](./frontend-integracao-company-nfs-config.md).  
ItemListaServico (LC 116) na correspondência CNAE/NBS/INDOP: [frontend-integracao-cnae-nbs-indop.md](./frontend-integracao-cnae-nbs-indop.md).

## Base URL

| Recurso | Prefixo | Autenticação |
|---------|---------|--------------|
| NFM | `/admin/nfm` | Admin (mesmo padrão das demais rotas NFM) |

---

## Resumo das mudanças (breaking)

| Antes | Depois |
|-------|--------|
| `GET /admin/nfm` → elegíveis (`NfmDto[]`) | `GET /admin/nfm` → NFMs geradas (paginado, `NfmWithNfseDto`) |
| — | `GET /admin/nfm/elegible` → elegíveis (`NfmDto[]`, contrato antigo) |
| — | `GET /admin/nfm/:id` → detalhe (`NfmWithNfseDto`) — **aditivo** |
| `POST /admin/nfm` | Sem mudança |
| `POST /admin/nfse` (emissão avulsa, claim `NFSE_WRITE`) | **Removido.** Emissão só via `POST /admin/nfm` (e demais módulos) |
| `GET /admin/nfse/:id` (claim `NFSE_READ`) | **Removido.** Detalhe da NFS-e vem em `GET /admin/nfm/:id` (`nfse`) |
| `POST /admin/nfse/:id/cancel` (`:id` = NFS-e, claim `NFSE_WRITE`) | `POST /admin/nfm/:id/cancel` (`:id` = **NFM**, claim `NFM_WRITE`) — **breaking** |
| `GET /admin/nfm/invoices` | **Removido.** Consulta de NFS-e no Giss saiu da API. Listar notas via `GET /admin/nfm`. |

### Fluxo sugerido na UI

1. **Tela lista** — `GET /admin/nfm?dateStart&dateEnd` exibe NFMs com NFS-e vinculada no intervalo.
2. Clique no item → `GET /admin/nfm/:id` para tela/detalhe.
3. Se NFS-e `ISSUED` → botão cancelar → `POST /admin/nfm/:id/cancel` com `cancelReasonCode`.
4. Botão **Gerar NFMs** → abre tela de elegíveis.
5. **Tela elegíveis** — `GET /admin/nfm/elegible`; botão confirmar → `POST /admin/nfm`.

---

## Listar NFMs geradas (`GET /admin/nfm`)

Retorna apenas NFMs com `nfseId` preenchido (já dispararam emissão no Giss).  
Filtro de data usa `createdAt` da NFM (UTC, dias inclusivos).

### Query

| Campo | Obrigatório | Tipo | Observação |
|-------|-------------|------|------------|
| `dateStart` | não | string `YYYY-MM-DD` | `createdAt >= início do dia` |
| `dateEnd` | não | string `YYYY-MM-DD` | `createdAt <= fim do dia` |
| `page` | não | number | Paginação |
| `size` | não | number | Paginação |

`dateStart` e `dateEnd` são **independentes**. Se ambos e `dateStart > dateEnd` → **400**.

### Response (200)

Paginação (`data`, `totalItems`, `itemsPerPage`, `totalPages`, `currentPage`).

Cada item em `data` é `NfmWithNfseDto`:
- `id`, `clientId`, `clientDocument`, `companyName`, `status`
- `referenceMonth`, `referenceYear`, `totalValueInCents`, `cnaeNbsIndopId`
- `createdAt`, `updatedAt`
- `nfse` — objeto `NfseDto` completo (`nfseNumber`, `status`, `issuedAt`, `bankPaymentProvider`, `bankPaymentRequestCode`, etc.)

**Nota:** `nfse.issuedAt` pode ser `null` enquanto a fila Giss processa. A presença de `nfse` já indica que a emissão foi enfileirada.

**Campos aditivos em `nfse` (boleto Inter):**
- `bankPaymentProvider` — provedor do boleto (ex.: `INTER`); `null` enquanto a emissão do boleto não concluiu
- `bankPaymentRequestCode` — código da cobrança no Inter; `null` enquanto a fila/Inter estiver pendente

Não há endpoint novo: os campos vêm em `GET /admin/nfm` e `GET /admin/nfm/:id` dentro de `nfse`. Não é breaking.

### Erros

| Status | Quando |
|--------|--------|
| 400 | Formato de data inválido ou `dateStart > dateEnd` |

---

## Buscar NFM por ID (`GET /admin/nfm/:id`)

**Aditivo** (sem breaking). Mesmo shape de item da lista: `NfmWithNfseDto`.

Claim: `NFM_READ` (igual às demais leituras NFM).

### Path

| Campo | Tipo | Observação |
|-------|------|------------|
| `id` | number (inteiro positivo) | ID da NFM |

### Response (200)

`NfmWithNfseDto`:
- `id`, `clientId`, `clientDocument`, `companyName`
- `referenceMonth`, `referenceYear`, `totalValueInCents`, `cnaeNbsIndopId`
- `createdAt`, `updatedAt`
- `nfse` — objeto `NfseDto` completo

### Erros

| Status | Quando |
|--------|--------|
| 400 | `id` inválido (não numérico / não positivo) |
| 404 | NFM não encontrada |

---

## Listar elegíveis (`GET /admin/nfm/elegible`)

Mesmo contrato que o antigo `GET /admin/nfm`.

Retorna **um item por grupo fiscal** `(cliente + cnaeNbsIndop)`, não um por cliente.

Se o cliente tem itens com 2 tributações diferentes → **2** objetos no array (mesmo `client`, `clientItems` só do grupo).

### Response (200)

Array de `NfmDto`:
- `client` — inclui `company: { id, name }`
- `clientInvoiceConfig` — inclui `issWithheld: boolean`
- `clientItems[]` — itens do **mesmo** `cnaeNbsIndop`; cada item traz `cnaeNbsIndop` completo (incl. `serviceListItemCode`)

---

## Cancelar NFS-e da NFM (`POST /admin/nfm/:id/cancel`)

**Breaking:** a rota antiga `POST /admin/nfse/:id/cancel` foi removida.  
Use o **id da NFM** (o mesmo de `GET /admin/nfm` / `GET /admin/nfm/:id`), não o id da NFS-e.

Claim: `NFM_WRITE`.

Chamada **síncrona** ao Giss Online. Só funciona se a NFS-e vinculada estiver `ISSUED`.

### Path

| Campo | Tipo | Observação |
|-------|------|------------|
| `id` | number (inteiro positivo) | ID da **NFM** |

### Body

| Campo | Obrigatório | Tipo | Valores |
|-------|-------------|------|---------|
| `cancelReasonCode` | sim | number | `1` (erro na emissão), `2` (serviço não prestado), `4` (duplicidade). Códigos `3` e `5` são rejeitados (restritos à Administração Tributária). |

Exemplo:

```json
{ "cancelReasonCode": 2 }
```

### Response (200)

```json
{
  "id": 42,
  "status": "CANCELED",
  "canceledAt": "2026-07-29T12:00:00.000Z"
}
```

| Campo | Significado |
|-------|-------------|
| `id` | ID da **NFM** (igual ao path) |
| `status` | Status da NFS-e após o cancelamento (`CANCELED`) |
| `canceledAt` | Data/hora confirmada pelo provedor |

### Erros

| Status | Quando |
|--------|--------|
| 400 | `id` inválido; `cancelReasonCode` inválido; NFS-e não emitida / já cancelada |
| 404 | NFM não encontrada |
| 503 | Giss / provedor indisponível |

Após sucesso, recarregar o detalhe com `GET /admin/nfm/:id` — `nfse.status` deve ser `CANCELED`.

---

## Salvar elegíveis e emitir (`POST /admin/nfm`)

Sem body. Para cada grupo elegível do mês corrente:
1. Persiste NFM (se ainda não existir)
2. Chama emissão NFS-e (`IssueNfse`) — fila GISS assíncrona
3. Vincula `nfseId` (relação 1:1)

Reexecução no mesmo mês:
- Já tem `nfseId` → **skip**
- Existe NFM sem `nfseId` (falha anterior) → **retry** da emissão

### Response (201)

```json
{
  "created": 2,
  "skipped": 1,
  "failed": 1,
  "errors": [
    {
      "clientId": 10,
      "cnaeNbsIndopId": 3,
      "message": "Correspondência CNAE/NBS/INDOP 3 sem ItemListaServico (LC 116)."
    }
  ]
}
```

| Campo | Significado |
|-------|-------------|
| `created` | Vinculou `nfseId` nesta execução |
| `skipped` | Já tinha NFS-e |
| `failed` | Erro (NFM fica sem `nfseId`, status `FAILED`) |
| `errors[]` | Detalhe por grupo que falhou |

HTTP **não** espera a GISS. Só persistência + enqueue.

### Falhas comuns em `errors[].message`

- Sem `serviceListItemCode` na correspondência CNAE/NBS/INDOP
- Sem alíquota ISS / config NFS-e da empresa
- Sem código de tributação municipal (`municipalTaxCode`) na config NFS-e da empresa
- Cliente sem endereço BILLING/MAIN com `cityCodeIbge`

---

## Autenticação e claims

| Rota | Claim |
|------|-------|
| `GET /admin/nfm`, `GET /admin/nfm/elegible`, `GET /admin/nfm/:id` | `NFM_READ` |
| `POST /admin/nfm`, `POST /admin/nfm/:id/cancel` | `NFM_WRITE` |

---

## Checklist frontend

1. **Breaking:** migrar tela de elegíveis de `GET /admin/nfm` → `GET /admin/nfm/elegible`.
2. Nova tela lista: `GET /admin/nfm?dateStart&dateEnd&page&size` — resposta **paginada** (`data[]` de `NfmWithNfseDto`).
3. Detalhe: `GET /admin/nfm/:id` — mesmo `NfmWithNfseDto`; tratar **404**.
4. **Breaking:** parar `POST /admin/nfse`, `GET /admin/nfse/:id` e `POST /admin/nfse/:id/cancel`. Claims `NFSE_READ` / `NFSE_WRITE` saíram. Emissão via `POST /admin/nfm`; detalhe via `GET /admin/nfm/:id`; cancelamento via `POST /admin/nfm/:id/cancel` (id da **NFM**, claim `NFM_WRITE`).
5. Cancelar só quando `nfse.status === 'ISSUED'`; body `{ cancelReasonCode: 1 | 2 | 4 }`; após 200, refrescar detalhe.
6. Botão gerar → tela elegíveis → confirmar com `POST /admin/nfm`.
7. `POST /admin/nfm`: exibir resumo `created` / `skipped` / `failed` + lista de `errors`.
8. Garantir cadastro fiscal antes de emitir: LC 116 na correspondência, ISS/Simples/`municipalTaxCode` na config da empresa, `issWithheld` no invoice config do cliente.
9. **Breaking:** `GET /admin/nfm/invoices` saiu. Parar de chamar a rota; regenerar tipos OpenAPI.
10. Atualizar mocks/tipos E2E (`GET /admin/nfm/:id`, `POST /admin/nfm/:id/cancel`).

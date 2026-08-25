# Integração frontend — NFM (geradas + elegíveis + emissão NFS-e)

## Introdução

Este documento cobre as rotas admin de **NFM**:
- `GET /admin/nfm` — NFMs persistidas com NFS-e vinculada (filtro por período)
- `GET /admin/nfm/elegible` — clientes/grupos elegíveis para emissão
- `POST /admin/nfm` — salva NFMs e dispara emissão de NFS-e (1:1)

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
| `POST /admin/nfm` | Sem mudança |
| `GET /admin/nfm/invoices` | **Removido.** Consulta de NFS-e no Giss saiu da API. Listar notas via `GET /admin/nfm`. |

### Fluxo sugerido na UI

1. **Tela lista** — `GET /admin/nfm?dateStart&dateEnd` exibe NFMs com NFS-e vinculada no intervalo.
2. Botão **Gerar NFMs** → abre tela de elegíveis.
3. **Tela elegíveis** — `GET /admin/nfm/elegible`; botão confirmar → `POST /admin/nfm`.

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
- `nfse` — objeto `NfseDto` completo (`nfseNumber`, `status`, `issuedAt`, etc.)

**Nota:** `nfse.issuedAt` pode ser `null` enquanto a fila Giss processa. A presença de `nfse` já indica que a emissão foi enfileirada.

### Erros

| Status | Quando |
|--------|--------|
| 400 | Formato de data inválido ou `dateStart > dateEnd` |

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

## Checklist frontend

1. **Breaking:** migrar tela de elegíveis de `GET /admin/nfm` → `GET /admin/nfm/elegible`.
2. Nova tela lista: `GET /admin/nfm?dateStart&dateEnd&page&size` — resposta **paginada** (`data[]` de `NfmWithNfseDto`).
3. Botão gerar → tela elegíveis → confirmar com `POST /admin/nfm`.
4. `POST /admin/nfm`: exibir resumo `created` / `skipped` / `failed` + lista de `errors`.
5. Garantir cadastro fiscal antes de emitir: LC 116 na correspondência, ISS/Simples/`municipalTaxCode` na config da empresa, `issWithheld` no invoice config do cliente.
6. **Breaking:** `GET /admin/nfm/invoices` saiu. Parar de chamar a rota; regenerar tipos OpenAPI.
7. Atualizar mocks/tipos E2E das rotas.

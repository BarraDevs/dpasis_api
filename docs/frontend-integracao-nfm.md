# Integração frontend — NFM (elegíveis + emissão NFS-e + invoices Giss)

## Introdução

Este documento cobre as rotas admin de **NFM**:
- `GET /admin/nfm` — clientes/grupos elegíveis
- `POST /admin/nfm` — salva NFMs e dispara emissão de NFS-e (1:1)
- `GET /admin/nfm/invoices` — consulta NFS-e no Giss Online

**Referência OpenAPI:** Swagger em `/swagger`, tag **NFM**.

Config fiscal da empresa: [frontend-integracao-company-nfs-config.md](./frontend-integracao-company-nfs-config.md).  
ItemListaServico (LC 116) na correspondência CNAE/NBS/INDOP: [frontend-integracao-cnae-nbs-indop.md](./frontend-integracao-cnae-nbs-indop.md).

## Base URL

| Recurso | Prefixo | Autenticação |
|---------|---------|--------------|
| NFM | `/admin/nfm` | Admin (mesmo padrão das demais rotas NFM) |

---

## Listar elegíveis (`GET /admin/nfm`)

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
- Cliente sem endereço BILLING/MAIN com `cityCodeIbge`

---

## Listar NFS-e no Giss (`GET /admin/nfm/invoices`)

Consulta **NFS-e de serviço prestado** no Giss (`ConsultarNfseServicoPrestado`).

### Query

| Campo | Obrigatório | Tipo | Observação |
|-------|-------------|------|------------|
| `companyId` | sim | number | Empresa prestadora (credenciais Giss) |
| `page` | não | number | Default `1` (até 50 itens/página) |
| `dateFrom` | condicional | string `YYYY-MM-DD` | Com `dateTo`: período |
| `dateTo` | condicional | string `YYYY-MM-DD` | Com `dateFrom` |
| `nfseNumber` | condicional | string | Exclusivo com o período |
| `recipientDocument` | não | string | CPF/CNPJ do tomador |

Regras: período **ou** `nfseNumber` — nunca ambos, nunca nenhum.

### Response (200)

Array de `NfsNoteDto` (`nfseNumber`, `verificationCode`, `issueDate`, `rpsNumber`, `rpsSeries`, `takerDocument`, `takerName`, `serviceAmount`, `status` `Normal`|`Cancelada`).

### Erros

| Status | Quando |
|--------|--------|
| 400 | Query inválida |
| 404 | Empresa ou config NFS-e não encontrada |
| 503 | Giss indisponível |

---

## Checklist frontend

1. `GET /admin/nfm`: UI trata **N grupos por cliente** (não assume 1 linha/cliente).
2. `POST /admin/nfm`: exibir resumo `created` / `skipped` / `failed` + lista de `errors`.
3. Garantir cadastro fiscal antes de emitir: LC 116 na correspondência, ISS/Simples na config da empresa, `issWithheld` no invoice config do cliente.
4. `GET /admin/nfm/invoices`: `companyId` + período ou `nfseNumber`.
5. Atualizar mocks E2E das três rotas.

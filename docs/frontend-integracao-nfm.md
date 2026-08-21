# Integração frontend — NFM (geradas + elegíveis + emissão NFS-e + invoices Giss)

## Introdução

Este documento cobre as rotas admin de **NFM**:
- `GET /admin/nfm` — NFMs persistidas com NFS-e vinculada (filtro por período)
- `GET /admin/nfm/elegible` — clientes/grupos elegíveis para emissão
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

## Resumo das mudanças (breaking)

| Antes | Depois |
|-------|--------|
| `GET /admin/nfm` → elegíveis (`NfmDto[]`) | `GET /admin/nfm` → NFMs geradas (paginado, `NfmWithNfseDto`) |
| — | `GET /admin/nfm/elegible` → elegíveis (`NfmDto[]`, contrato antigo) |
| `POST /admin/nfm` | Sem mudança |
| `GET /admin/nfm/invoices` | **Aditivo** (não breaking): campos de lista antigos permanecem; a resposta agora inclui dados para a tela de detalhe da nota (ver seção abaixo) |

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
- Cliente sem endereço BILLING/MAIN com `cityCodeIbge`

---

## Listar NFS-e no Giss (`GET /admin/nfm/invoices`)

Consulta **NFS-e de serviço prestado** no Giss (`ConsultarNfseServicoPrestado`).  
A mesma resposta serve para **lista** e **detalhe** (não há `GET` por id).

### Query

| Campo | Obrigatório | Tipo | Observação |
|-------|-------------|------|------------|
| `companyId` | sim | number | Empresa prestadora (credenciais Giss) |
| `page` | não | number | Default `1` (até 50 itens/página) |
| `dateFrom` | condicional | string `YYYY-MM-DD` | Com `dateTo`: período |
| `dateTo` | condicional | string `YYYY-MM-DD` | Com `dateFrom` |
| `nfseNumber` | condicional | string | Exclusivo com o período |
| `recipientDocument` | não | string | CPF/CNPJ do tomador |

Regras: período **ou** `nfseNumber` — nunca ambos, nunca nenhum. `dateFrom` e `dateTo` vêm **juntos**.

### Response (200) — o que mudou

**Não é breaking.** Campos que a lista já usa continuam no root. O que entra é complemento para visualizar a nota.

| Área | Antes | Depois |
|------|-------|--------|
| Lista | `nfseNumber`, `verificationCode`, `issueDate`, `rpsNumber`, `rpsSeries`, `takerDocument`, `takerName`, `serviceAmount`, `status` | Iguais (mesmo nome/tipo) |
| Cabeçalho extra | — | `competence`, `rpsType`, `rpsIssueDate`, `liquidAmount`, `simpleNationalOptant`, `fiscalIncentive`, `generatorMunicipalityCode`, `generatorUf` |
| Prestador / tomador | só documento e nome do tomador no root | objetos `provider` e `taker` (sempre presentes; campos internos podem ser `null`) |
| Valores | só `serviceAmount` | `liquidAmount` no root + objeto `values` |
| Serviço | — | objeto `service` (discriminação, LC 116, NBS, ISS, etc.) |

`provider`, `taker`, `values` e `service` **sempre vêm no JSON**. `taker.address` / `provider.address` podem ser `null` se o Giss não mandou endereço.

Campos de lista no root (`takerDocument`, `takerName`, `serviceAmount`) repetem o essencial de `taker` / `values` — use o root na tabela; use os objetos no detalhe.

### Campos do root (`NfsNoteDto`)

| Campo | Tipo | Observação |
|-------|------|------------|
| `nfseNumber` | string | Número da NFS-e |
| `verificationCode` | string | Código de verificação |
| `issueDate` | string | Data/hora de emissão (ISO do Giss, ex. `2026-07-16T10:08:02.297-03:00`) |
| `competence` | string \| null | Competência. O Giss pode devolver `2026-07-15-03:00` (**não** é ISO). Para exibir o mês, usar os 10 primeiros caracteres `YYYY-MM-DD` |
| `rpsNumber` | number | Número do RPS (`0` se o Giss não mandou) |
| `rpsSeries` | string | Série do RPS (pode ser `"1"`) |
| `rpsType` | number \| null | `1` RPS, `2` Nota fiscal conjugada, `3` Cupom |
| `rpsIssueDate` | string \| null | Mesmo formato estranho de `competence` |
| `takerDocument` | string \| null | CPF (11 dígitos) ou CNPJ (14 dígitos), só números, **com zero à esquerda** |
| `takerName` | string \| null | Razão social do tomador |
| `serviceAmount` | string \| null | Valor dos serviços. Se o Giss omitir, cai no líquido. **String**, não number |
| `liquidAmount` | string \| null | Valor líquido da NFS-e (`null` se o Giss omitir). **String** |
| `status` | string | `Normal` ou `Cancelada` |
| `simpleNationalOptant` | boolean \| null | `true` = optante Simples Nacional |
| `fiscalIncentive` | boolean \| null | `true` = incentivo fiscal |
| `generatorMunicipalityCode` | string \| null | IBGE do órgão gerador (7 dígitos) |
| `generatorUf` | string \| null | UF do órgão gerador |
| `provider` | object | Prestador (ver abaixo) |
| `taker` | object | Tomador (ver abaixo) |
| `values` | object | Detalhamento de valores |
| `service` | object | Serviço / tributação |

### `provider` / `taker` (`NfsNotePartyDto`)

| Campo | Tipo | Observação |
|-------|------|------------|
| `document` | string \| null | CPF 11 / CNPJ 14, zero à esquerda |
| `name` | string \| null | Razão social |
| `municipalRegistration` | string \| null | Inscrição municipal (prestador costuma vir; tomador nem sempre) |
| `email` | string \| null | |
| `phone` | string \| null | Só dígitos (o XML do Giss vira número) |
| `address` | object \| null | `null` se o Giss não enviou `Endereco` |

`address` (`NfsNoteAddressDto`):

| Campo | Tipo |
|-------|------|
| `street` | string \| null |
| `number` | string \| null |
| `complement` | string \| null |
| `neighborhood` | string \| null |
| `cityCodeIbge` | string \| null (7 dígitos) |
| `state` | string \| null |
| `zipCode` | string \| null (8 dígitos, zero à esquerda) |

### `values` (`NfsNoteValuesDto`)

Todos os valores monetários e a alíquota são **`string | null`** (espelho do XML). Não parsear como number na API — converter na UI.

| Campo | Significado |
|-------|-------------|
| `serviceAmount` | Valor dos serviços **cru**. Sem fallback: `null` se o Giss omitiu `ValorServicos` (o root `serviceAmount` ainda pode ter o líquido) |
| `liquidAmount` | Valor líquido |
| `calculationBase` | Base de cálculo |
| `issRate` | Alíquota **como o Giss mandou** (ex. `"3"` = 3%, **não** `0.03`). Diferente de `issRate` em `/admin/company-nfs-config` (lá `0.05` = 5%) |
| `issAmount` | Valor do ISS |
| `deductionsAmount` | Deduções |
| `inssAmount` / `irAmount` / `csllAmount` | Retenções federais |
| `otherWithholdingsAmount` | Outras retenções |
| `unconditionalDiscount` / `conditionalDiscount` | Descontos |

### `service` (`NfsNoteServiceDto`)

| Campo | Tipo | Observação |
|-------|------|------------|
| `description` | string \| null | Discriminação (texto longo, pode ter `\n`) — campo principal do detalhe |
| `serviceListItemCode` | string \| null | Subitem LC 116 (ex. `"1.07"`) |
| `municipalTaxCode` | string \| null | Código de tributação municipal |
| `municipalTaxCodeDescription` | string \| null | Descrição do código municipal |
| `nbsCode` | string \| null | Ex. `"1.1501.30.00"` |
| `municipalityCode` | string \| null | IBGE do município da prestação (7 dígitos) |
| `countryCode` | string \| null | País (4 dígitos, Brasil = `"0076"`) |
| `incidenceMunicipalityCode` | string \| null | IBGE do município de incidência do ISS |
| `issWithheld` | boolean \| null | `true` = ISS retido |
| `issExigibility` | number \| null | `1`–`7` (iguais à config NFS-e da empresa): 1 Exigível, 2 Não incidência, 3 Isenção, 4 Exportação, 5 Imunidade, 6 Suspensa decisão judicial, 7 Suspensa processo administrativo |

### Exemplo (200)

Campos de lista no root + detalhe. Valores e documentos como a API realmente devolve (strings, CNPJ/CEP com zero).

```json
[
  {
    "nfseNumber": "55267",
    "verificationCode": "OUPFLTII4",
    "issueDate": "2026-07-16T10:08:02.297-03:00",
    "competence": "2026-07-15-03:00",
    "rpsNumber": 73046,
    "rpsSeries": "1",
    "rpsType": 1,
    "rpsIssueDate": "2026-07-15-03:00",
    "takerDocument": "35083999000164",
    "takerName": "ALL IS LOVE IND E COM DE ROUPAS E ACES LTDA",
    "serviceAmount": "202.09",
    "liquidAmount": "202.09",
    "status": "Normal",
    "simpleNationalOptant": true,
    "fiscalIncentive": false,
    "generatorMunicipalityCode": "3529401",
    "generatorUf": "SP",
    "provider": {
      "document": "02099923000178",
      "name": "DPA TEC EQUIPAMENTOS DE PONTO LTDA",
      "municipalRegistration": "16895",
      "email": "nfe@dpatec.com.br",
      "phone": "1145143522",
      "address": {
        "street": "Distrito Vice-Presidente Francisco Silviano Alves Brandão",
        "number": "615",
        "complement": "CASA 01",
        "neighborhood": "Parque São Vicente",
        "cityCodeIbge": "3529401",
        "state": "SP",
        "zipCode": "09371160"
      }
    },
    "taker": {
      "document": "35083999000164",
      "name": "ALL IS LOVE IND E COM DE ROUPAS E ACES LTDA",
      "municipalRegistration": null,
      "email": "faturamento@alls.com.br",
      "phone": "1133370230",
      "address": {
        "street": "RUA DA GRACA, 856",
        "number": "856",
        "complement": null,
        "neighborhood": "BOM RETIRO",
        "cityCodeIbge": "3550308",
        "state": "SP",
        "zipCode": "05016081"
      }
    },
    "values": {
      "serviceAmount": "202.09",
      "liquidAmount": "202.09",
      "calculationBase": "202.09",
      "issRate": "3",
      "issAmount": "0",
      "deductionsAmount": "0",
      "inssAmount": "0",
      "irAmount": "0",
      "csllAmount": "0",
      "otherWithholdingsAmount": "0",
      "unconditionalDiscount": "0",
      "conditionalDiscount": "0"
    },
    "service": {
      "description": "01039 - SUP.TEC.MAN.OUTROS SERV TI WEB-100",
      "serviceListItemCode": "1.07",
      "municipalTaxCode": "2250",
      "municipalTaxCodeDescription": "Revisao,Manut.,Cons.E Rest.De Equips. Informatica",
      "nbsCode": "1.1501.30.00",
      "municipalityCode": "3529401",
      "countryCode": "0076",
      "incidenceMunicipalityCode": "3529401",
      "issWithheld": false,
      "issExigibility": 1
    }
  }
]
```

Sugestão de UI:
- **Tabela:** `nfseNumber`, `issueDate`, `takerName`, `serviceAmount`, `status`
- **Detalhe / drawer:** `verificationCode`, RPS, competência, `provider` + `taker` (endereço/contato), `service.description`, `values`, flags Simples / ISS retido / cancelada

### Erros

Exibir `message` do body (`{ "message": "..." }`).

| Status | Quando |
|--------|--------|
| 400 | Query inválida (`dateFrom`/`dateTo` incompletos; período e `nfseNumber` juntos; nenhum dos dois) |
| 404 | Empresa ou config NFS-e não encontrada |
| 503 | Giss indisponível |

---

## Checklist frontend

1. **Breaking:** migrar tela de elegíveis de `GET /admin/nfm` → `GET /admin/nfm/elegible`.
2. Nova tela lista: `GET /admin/nfm?dateStart&dateEnd&page&size` — resposta **paginada** (`data[]` de `NfmWithNfseDto`).
3. Botão gerar → tela elegíveis → confirmar com `POST /admin/nfm`.
4. `POST /admin/nfm`: exibir resumo `created` / `skipped` / `failed` + lista de `errors`.
5. Garantir cadastro fiscal antes de emitir: LC 116 na correspondência, ISS/Simples na config da empresa, `issWithheld` no invoice config do cliente.
6. `GET /admin/nfm/invoices`: query igual (`companyId` + período **ou** `nfseNumber`). Regenerar tipos OpenAPI — `NfsNoteDto` ganhou campos e objetos `provider` / `taker` / `values` / `service`.
7. Lista pode ignorar os novos campos. Tela de detalhe: usar `service.description`, `values`, endereços e `status === "Cancelada"`.
8. Monetário e alíquota da consulta Giss são **string**. `values.issRate` `"3"` = 3% (não tratar como a `issRate` decimal da config da empresa).
9. `competence` / `rpsIssueDate` podem não ser ISO; não passar direto em `new Date()` sem normalizar.
10. Atualizar mocks/tipos E2E das rotas.

# Integração frontend — Listagem de NFS-e NFM (`GET /admin/nfm/invoices`)

## Introdução

A rota `GET /admin/nfm/invoices` deixou de consultar o **NFeMail** e passou a listar **NFS-e de serviço prestado** no **Giss Online** (`ConsultarNfseServicoPrestado`).

**Referência OpenAPI:** Swagger em `/swagger`, tag **NFM**.

Config de certificado/município por empresa: ver [frontend-integracao-company-nfs-config.md](./frontend-integracao-company-nfs-config.md).

## Base URL

| Recurso | Prefixo | Autenticação |
|---------|---------|--------------|
| NFM | `/admin/nfm` | Admin (mesmo padrão das demais rotas NFM) |

## Resumo das mudanças

| Área | Antes | Depois |
|------|-------|--------|
| Fonte dos dados | NFeMail (`nf-generation`) | Giss Online (`nfs-generation`) |
| Query | `page`, `limit`, `orderNumber`, `nfeNumber`, `recipientDocument`, `processCode` | **`companyId` obrigatório** + (`dateFrom`+`dateTo`) **ou** `nfseNumber` + `page?` + `recipientDocument?` |
| Response | `NfDto` (NFeMail) | **`NfsNoteDto`** (shape novo — **breaking**) |

**Breaking change:** query e response mudaram. Atualizar tipos, formulários de filtro e tabela de listagem.

## Listar NFS-e (`GET /admin/nfm/invoices`)

### Query

| Campo | Obrigatório | Tipo | Observação |
|-------|-------------|------|------------|
| `companyId` | sim | number | Empresa prestadora (credenciais Giss) |
| `page` | não | number | Default `1` (Giss pagina; até 50 itens/página) |
| `dateFrom` | condicional | string `YYYY-MM-DD` | Com `dateTo`: período de emissão |
| `dateTo` | condicional | string `YYYY-MM-DD` | Com `dateFrom`: período de emissão |
| `nfseNumber` | condicional | string | Número da NFS-e; **exclusivo** com o período |
| `recipientDocument` | não | string | CPF/CNPJ do tomador |

Regras:
1. Enviar **período** (`dateFrom` + `dateTo`) **ou** `nfseNumber` — nunca ambos, nunca nenhum.
2. `dateFrom` e `dateTo` devem vir juntos.

### Exemplos

```http
GET /admin/nfm/invoices?companyId=10&dateFrom=2026-08-01&dateTo=2026-08-31&page=1
```

```http
GET /admin/nfm/invoices?companyId=10&nfseNumber=1000
```

```http
GET /admin/nfm/invoices?companyId=10&dateFrom=2026-08-01&dateTo=2026-08-31&recipientDocument=98765432000111
```

### Response (200)

```json
[
  {
    "nfseNumber": "1000",
    "verificationCode": "ABC123",
    "issueDate": "2026-08-10T10:00:00",
    "rpsNumber": 7,
    "rpsSeries": "NFSE",
    "takerDocument": "98765432000111",
    "takerName": "Cliente Teste",
    "serviceAmount": "200",
    "status": "Normal"
  }
]
```

| Campo | Tipo | Observação |
|-------|------|------------|
| `nfseNumber` | string | Número da NFS-e |
| `verificationCode` | string | Código de verificação |
| `issueDate` | string | Data/hora de emissão (ISO do Giss) |
| `rpsNumber` | number | Número do RPS |
| `rpsSeries` | string | Série do RPS |
| `takerDocument` | string \| null | CPF/CNPJ do tomador |
| `takerName` | string \| null | Razão social do tomador |
| `serviceAmount` | string \| null | Valor dos serviços (ou líquido, se ValorServicos ausente) |
| `status` | `"Normal"` \| `"Cancelada"` | Situação da NFS-e |

Campos antigos (`rowId`, `orderNumber`, `externalId`, `processCode`, `nfeKey`, etc.) **não existem mais**.

## Erros / UX

| Status | Quando | Ação sugerida |
|--------|--------|---------------|
| 400 | Query inválida (sem período/`nfseNumber`, ambos, ou só um de `dateFrom`/`dateTo`); validação de formato | Exibir `message` do body |
| 404 | Empresa ou config NFS-e da empresa não encontrada | Orientar cadastro em company-nfs-config |
| 503 | Giss indisponível / erro de integração | Retry + mensagem de serviço indisponível |

Sempre exibir `message` do payload padronizado (`AppException`).

## Checklist prático para o frontend

1. Atualizar tipos OpenAPI / `NfDto` → `NfsNoteDto` na tela de invoices NFM.
2. Exigir seleção de `companyId` antes de listar.
3. Trocar filtros: período (`dateFrom`/`dateTo`) **ou** número da NFS-e; remover `limit`, `orderNumber`, `processCode`.
4. Ajustar colunas da tabela para o novo shape (`status` `Normal`/`Cancelada`, sem `processDescription`).
5. Tratar 404 de config NFS-e (empresa sem certificado/`municipioSlug`).
6. Atualizar mocks E2E da rota `GET /admin/nfm/invoices`.

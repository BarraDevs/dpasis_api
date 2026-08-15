# Integração frontend — Config NFS-e de empresa (`/admin/company-nfs-config`)

## Introdução

CRUD de configuração de NFS-e por empresa (relação 1-1). A config **não** vem embutida em `GET /admin/company/:id`.

**Referência OpenAPI:** Swagger em `/swagger`, tag **Empresas - Config NFS-e**.

## Base URL

| Recurso | Prefixo | Autenticação |
|---------|---------|--------------|
| Config NFS-e de empresa | `/admin/company-nfs-config` | Admin + claims `COMPANY_NFS_CONFIG_READ` / `COMPANY_NFS_CONFIG_WRITE` |

## Breaking — campos fiscais novos

Obrigatórios no **POST** (e disponíveis no GET/PATCH):

| Campo | Tipo | Observação |
|-------|------|------------|
| `simpleNationalOptant` | boolean | Optante Simples Nacional |
| `fiscalIncentive` | boolean | Incentivo fiscal |
| `issRate` | number | Alíquota ISS (ex.: `0.05` = 5%). Obrigatório na criação; emissão NFM falha se `null` |
| `issExigibility` | number | `1`–`7` (mesmos códigos do Issue NFS-e; default `1` = Exigível) |

## Buscar por empresa (`GET /admin/company-nfs-config/company/:companyId`)

### Response (200)

```json
{
  "id": 1,
  "companyId": 10,
  "vendor": "giss",
  "municipalRegistration": "12345",
  "municipalCodeIbge": "3529401",
  "serieRps": "NFSE",
  "environment": "DEMONSTRATION",
  "certFilePath": "/certs/empresa.pfx",
  "certPasswordEnvVar": "COMPANY_CERT_PASSWORD",
  "vendorConfig": {
    "municipioSlug": "demonstracao"
  },
  "simpleNationalOptant": false,
  "fiscalIncentive": false,
  "issRate": 0.05,
  "issExigibility": 1
}
```

| Campo | Tipo | Observação |
|-------|------|------------|
| `environment` | `string` | `PRODUCTION`, `DEMONSTRATION` ou `FICTITIOUS` |
| `vendorConfig` | `object` | GISS exige `municipioSlug` |
| `certPasswordEnvVar` | `string` | Nome da env var da senha — **não** enviar a senha |

**404** se a empresa ainda não tem config.

## Criar (`POST /admin/company-nfs-config`)

Uma empresa = uma config. Segundo POST → **409**.

### Request

```json
{
  "companyId": 10,
  "vendor": "giss",
  "municipalRegistration": "12345",
  "municipalCodeIbge": "3529401",
  "serieRps": "NFSE",
  "environment": "DEMONSTRATION",
  "certFilePath": "/certs/empresa.pfx",
  "certPasswordEnvVar": "COMPANY_CERT_PASSWORD",
  "vendorConfig": {
    "municipioSlug": "demonstracao"
  },
  "simpleNationalOptant": false,
  "fiscalIncentive": false,
  "issRate": 0.05,
  "issExigibility": 1
}
```

### Response (201)

```json
{ "id": 1 }
```

## Editar (`PATCH /admin/company-nfs-config/:id`)

`companyId` **não** pode ser alterado. Envie só os campos que mudam (inclui os fiscais).

### Response (200)

```json
{ "message": "Configuração de NFS-e atualizada com sucesso" }
```

## Fluxo recomendado na UI

1. Aba NFS-e da empresa → `GET .../company/:companyId`
2. **404** → formulário de criação (`POST`) com os 4 campos fiscais
3. **200** → edição (`PATCH /:id`)
4. Claims: `COMPANY_NFS_CONFIG_READ` / `COMPANY_NFS_CONFIG_WRITE`

## Erros comuns

| Status | Situação |
|--------|----------|
| `404` | Empresa sem config (GET) ou `id` inválido no PATCH |
| `409` | Empresa já possui config (POST) |
| `400` | Validação / `environment` ou `issExigibility` inválido |

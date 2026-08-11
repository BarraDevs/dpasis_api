# Integração frontend — Config NFS-e de empresa (`/admin/company-nfs-config`)

## Introdução

Este documento cobre o CRUD de configuração de NFS-e por empresa (relação 1-1). A config **não** vem embutida em `GET /admin/company/:id`; o front deve usar a aba dedicada com as rotas abaixo.

**Referência OpenAPI:** Swagger em `/swagger`, tag **Empresas - Config NFS-e**.

## Base URL

| Recurso | Prefixo | Autenticação |
|---------|---------|--------------|
| Config NFS-e de empresa | `/admin/company-nfs-config` | Admin + claims `COMPANY_NFS_CONFIG_READ` / `COMPANY_NFS_CONFIG_WRITE` |

## Buscar por empresa (`GET /admin/company-nfs-config/company/:companyId`)

Retorna a config existente ou **404** se a empresa ainda não tem config (aba vazia → fluxo de criação).

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
  }
}
```

| Campo | Tipo | Observação |
|-------|------|------------|
| `environment` | `string` | `PRODUCTION`, `DEMONSTRATION` ou `FICTITIOUS` |
| `vendorConfig` | `object` | Campos livres do provedor (ex.: GISS exige `municipioSlug`) |
| `certPasswordEnvVar` | `string` | Nome da variável de ambiente com a senha do certificado — **não** enviar a senha no body |

## Criar (`POST /admin/company-nfs-config`)

Uma empresa só pode ter uma config. Segundo POST para o mesmo `companyId` → **409**.

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
  }
}
```

### Response (201)

```json
{
  "id": 1
}
```

## Editar (`PATCH /admin/company-nfs-config/:id`)

`companyId` **não** pode ser alterado (omitido do body). Envie apenas campos que mudam.

### Request (exemplo)

```json
{
  "serieRps": "NFSE2",
  "vendorConfig": {
    "municipioSlug": "maua"
  }
}
```

### Response (200)

```json
{
  "message": "Configuração de NFS-e atualizada com sucesso"
}
```

## Fluxo recomendado na UI

1. Abrir aba NFS-e da empresa com `companyId` conhecido.
2. `GET /admin/company-nfs-config/company/:companyId`
   - **404** → exibir formulário de criação (`POST`).
   - **200** → exibir formulário de edição; salvar com `PATCH /:id` (usar `id` da resposta).
3. Garantir que admins tenham claims `COMPANY_NFS_CONFIG_READ` e `COMPANY_NFS_CONFIG_WRITE`.

## Erros comuns

| Status | Situação |
|--------|----------|
| `404` | Empresa sem config (GET) ou `id` inválido no PATCH |
| `409` | Empresa já possui config (POST) |
| `400` | Validação de campos ou `environment` inválido |

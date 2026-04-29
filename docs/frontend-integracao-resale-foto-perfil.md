# Integração frontend — revenda: foto de perfil e `multipart/form-data`

Este documento descreve as **mudanças nos endpoints administrativos de revenda (`Resale`)**: criação e edição passam a aceitar **`multipart/form-data`** (corpo + arquivo opcional), a leitura passa a expor **`profilePictureUrl`**, e a criação permite um **`id` explícito opcional** (alinhamento com legado / sistema externo), com as mesmas regras de sequência já usadas em outros agregados do projeto.

Recursos relacionados seguem nos guias [frontend-integracao-cliente-resale.md](./frontend-integracao-cliente-resale.md), [frontend-integracao-resale-department-contact.md](./frontend-integracao-resale-department-contact.md) e [frontend-integracao-cliente-domain-subcliente.md](./frontend-integracao-cliente-domain-subcliente.md).

**Base URL admin:** `POST` e `PATCH` em `…/admin/resale` (papel **ADMIN** + claims **`RESALE_WRITE`** na mutação; **`RESALE_READ`** nas leituras).

---

## 1. Resumo das mudanças

| Área | Antes | Depois |
|------|-------|--------|
| **`POST /admin/resale`** | Corpo JSON (`application/json`) | **`multipart/form-data`**: campos de texto/número/boolean como em formulário + part opcional **`file`** |
| **`PATCH /admin/resale/:id`** | Corpo JSON | **`multipart/form-data`** com os mesmos padrões |
| **`GET /admin/resale` e `GET /admin/resale/:id`** | `ResaleDto` sem URL de imagem | Inclusão de **`profilePictureUrl: string \| null`** |
| **`POST /admin/resale` — identificador** | Apenas ID gerado pela sequência interna | Campo opcional **`id`** (inteiro positivo): se enviado, a revenda usa esse ID (desde que livre) e a sequência é ajustada; se omitido, o ID continua sendo o próximo da sequência |
| **Foto** | Não suportada | Arquivo opcional no create; no edit, envio de novo arquivo **substitui** a foto anterior (o backend agenda exclusão do arquivo antigo no storage) |

**Breaking change principal para o frontend:** deixar de enviar JSON puro nesses dois métodos e passar a montar **`FormData`** (ou equivalente) com os campos escalares e, quando houver, o binário.

---

## 2. Contrato `multipart/form-data`

### 2.1 Nome da part do arquivo

- **Campo do formulário:** `file` (mesmo padrão de outros uploads do projeto que combinam DTO + `UploadSingleInputDto`).
- **Obrigatoriedade:** opcional no **create** e no **edit**. Sem arquivo, a revenda é criada/atualizada só com os demais campos; no edit, a foto existente **não é removida** se o PATCH não trouxer `file`.

### 2.2 Demais campos

Todos os campos que antes iam no JSON passam a ser **campos de formulário** (strings). No backend, booleanos e números continuam aceitos via decorators **`StringToBoolean`** / **`StringToNumber`** — na prática, enviar como string (`"true"`, `"false"`, `"123"`) está alinhado ao restante da API admin.

Consulte o **Swagger** atualizado (tag **Revendas**) para a lista exata e exemplos; o decorator `mergeRequestBody` documenta `CreateResaleInputDto` + parte binária no create e `EditResaleInputDto` + binária no patch.

### 2.3 Criação — `POST /admin/resale`

| Campo | Observação |
|-------|------------|
| `id` | Opcional. Inteiro positivo. Se já existir revenda com esse ID → erro de negócio (`ResaleIdAlreadyTakenError`). |
| `code` | Continua **obrigatório** no DTO de criação (validação da API). |
| `file` | Opcional. Imagem da foto de perfil. |

**Resposta (201):** `{ id: number }` (inalterada em forma).

### 2.4 Edição — `PATCH /admin/resale/:id`

O body é **`PartialType`** do create **exceto** `id` (o ID da revenda vem só da URL). Ou seja, **qualquer** campo do create pode ser omitido; apenas os enviados são aplicados sobre o registro atual, com a mesma semântica de merge que o backend já aplicava.

| Campo | Observação |
|-------|------------|
| `file` | Opcional. Se presente, substitui `profilePictureUrl`; URL antiga é enfileirada para exclusão no storage. |

**Resposta:** envelope `SuccessMessage` (`{ message: string }`), como nos demais PATCHs admin de revenda.

---

## 3. Leitura — `ResaleDto`

Incluir nos tipos do frontend:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `profilePictureUrl` | `string \| null` | URL pública (ou URL assinada, conforme configuração do gateway de upload) da foto de perfil; `null` se nunca houve upload. |

Os demais campos de `ResaleDto` permanecem; use listagem e detalhe para exibir avatar, preview e links.

---

## 4. Validação do arquivo (foto)

O use case **`UploadSingle`** aplica:

| Regra | Valor |
|-------|--------|
| Tamanho máximo | **20 MB** |
| MIME permitidos | `image/jpeg`, `image/jpg`, `image/png`, `image/webp`, `application/octet-stream` (caso iOS / cliente envie assim) |

Em caso de rejeição, o backend responde com os erros de domínio já padronizados (`FileTooBigError`, `InvalidFileError`, etc.), tratados pelo filtro global — exibir a **`message`** ao usuário.

**Pasta no bucket (informacional):** `resales/{resaleId}/profile-picture` — útil só para debug; o frontend usa diretamente `profilePictureUrl` retornada pela API.

---

## 5. Autenticação e claims

Sem alteração em relação ao módulo de revendas:

| Operação | Claim típica |
|----------|----------------|
| `POST`, `PATCH` em `/admin/resale` | `RESALE_WRITE` |
| `GET` | `RESALE_READ` |

Headers de autenticação (JWT, etc.) seguem o padrão já utilizado no painel admin.

---

## 6. Checklist prático para o frontend

1. **Create:** trocar `fetch`/`axios` de `Content-Type: application/json` + `JSON.stringify` por **`FormData`**, anexando cada campo escalar e, se houver imagem, a part **`file`** (nome do campo exatamente `file`).
2. **Edit:** idem; enviar apenas campos alterados é válido (patch parcial); incluir `file` somente quando o usuário escolher nova imagem.
3. **Tipos / OpenAPI:** regenerar cliente a partir do Swagger e incluir **`profilePictureUrl`** em `ResaleDto` (listagem e detalhe).
4. **UI:** componente de upload (preview, limite 20 MB, formatos de imagem); tratamento de erro de MIME/tamanho.
5. **Opcional — `id` na criação:** expor somente se o produto integrar com legado; validar mensagem quando ID já estiver em uso.
6. **Testes E2E / mocks:** ajustar payloads para `multipart` e expectativas de resposta com `profilePictureUrl`.

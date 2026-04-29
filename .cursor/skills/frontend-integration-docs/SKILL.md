---
name: frontend-integration-docs
description: >-
  Produz documentação em docs/ para o time frontend após mudanças na API
  admin: alinha tom e estrutura com frontend-integracao-*.md, resume breaking
  changes, payloads, claims CASL, erros e checklist. Use quando o usuário pedir
  doc/guia/nota de integração para o frontend, documentar mudanças de
  contrato HTTP, OpenAPI/Swagger, multipart, novos campos DTO, novos endpoints,
  ou após implementar feature que exija ajuste no app admin.
---

# Documentação de integração frontend (`docs/frontend-integracao-*.md`)

## Objetivo

Escrever **um arquivo markdown** em `docs/` que explique **o que mudou na API** e **o que o frontend deve fazer**, no mesmo estilo dos guias existentes — sem substituir o Swagger, mas traduzindo impacto prático, breaking changes e passos de migração.

## Quando aplicar

- Pedido explícito de doc para integração frontend / app admin.
- Implementação terminou (ou está em revisão) e há **mudança de contrato** (path, método, body, query, resposta, content-type, claims, erros).

**Não** criar arquivo em `docs/` por conta própria se o usuário não pediu documentação ou fluxo de “nota de integração”.

## Referência obrigatória antes de escrever

1. Ler **pelo menos um** dos arquivos abaixo para copiar **ritmo, seções e tabelas** (raiz do repo):
   - `docs/frontend-integracao-cliente-resale.md` — exemplo curto (breaking change + checklist).
   - `docs/frontend-integracao-resale-department-contact.md` — exemplo longo (endpoints, tabelas, erros).
   - `docs/frontend-integracao-resale-foto-perfil.md` — multipart + novos campos.
2. Se a mudança envolve **upload / multipart / S3**, cruzar com a skill **`upload-file-flow`** (nome do campo `file`, `ApiConsumes`, limites MIME/tamanho).

## Convenções de arquivo

| Item | Regra |
|------|--------|
| **Pasta** | `docs/` na raiz do repositório |
| **Nome** | `frontend-integracao-<contexto>.md` (kebab-case, contexto em português ou termo de domínio estável, ex.: `cliente-resale`, `resale-foto-perfil`) |
| **Título (H1)** | Frase clara em português + escopo entre parênteses se precisar (ex.: recurso, módulo) |
| **Links relativos** | Para outros `docs/*.md` quando houver continuidade de tema |

## Estrutura sugerida do documento

Ordem típica (ajustar ao tamanho da mudança):

1. **Introdução** — O que o doc cobre; **links** para guias relacionados em `docs/`.
2. **`Base URL admin`** — Prefixo de rotas afetadas (ex.: `…/admin/resale`) e menção a JWT/admin quando relevante.
3. **Resumo das mudanças** — Tabela **Antes / Depois** ou **Área / O que mudou** (breaking vs aditivo explícito).
4. **Detalhe por área** — Payloads, query params, respostas, `Content-Type` (JSON vs `multipart/form-data`), nomes de parts de arquivo.
5. **Autenticação e claims** — Tabela recurso × `RESALE_READ` / `CLIENT_WRITE` / etc., se mudou ou se é feature nova.
6. **Erros / UX** — Quando esperar 400/404/409/422; lembrar de exibir `message` do payload padronizado (`AppException`).
7. **Checklist prático para o frontend** — Lista numerada curta (tipos OpenAPI, FormData, mocks E2E, visibilidade por claim).

Eliminar seções que não se aplicam; **não** inflar com implementação interna (Prisma, nomes de classes) salvo se for necessário para evitar mal-entendido.

## Fluxo de trabalho (agente)

1. **Escopo** — Identificar rotas/DTOs alterados (diff, arquivos tocados, pergunta ao usuário se ambíguo).
2. **Contrato** — Confirmar no código: controller, DTOs, decorators Swagger, guards/claims.
3. **Redigir** — Seguir estrutura acima e o tom dos exemplos em `docs/`.
4. **Revisar** — URLs e nomes de campos **literais** como na API; sem inventar endpoints; se algo for interno e não exposto, não documentar como contrato público.

## Anti-padrões

- Documentar só no chat sem persistir quando o usuário pediu **documento no repositório**.
- Duplicar o Swagger campo a campo sem valor acrescentado — preferir tabelas das **exceções** e **breaking changes**.
- Misturar inglês e português sem necessidade no título; corpo pode usar termos de API em inglês (`PATCH`, `FormData`, nomes de propriedades).

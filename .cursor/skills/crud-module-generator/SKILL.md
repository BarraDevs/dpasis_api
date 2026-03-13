---
name: crud-module-generator
description: >-
  Guides development of CRUD modules for NestJS/Prisma projects. Use when
  creating new CRUD modules, implementing resources with persistence, or when
  the user asks to create a module based on FAQ or similar patterns.
---

# CRUD Module Generator

Gera módulos CRUD genéricos para NestJS/Prisma. O usuário informa os requisitos no prompt; informações faltantes são solicitadas via formulário estruturado.

## Formulário de Requisitos (Plan Mode)

Quando o usuário solicitar um novo CRUD, **solicite as informações faltantes** usando este formulário. Se estiver em Plan Mode, use-o para coletar requisitos antes de gerar o plano.

```markdown
## Formulário: Novo Módulo CRUD

Preencha os campos abaixo. Use este bloco no prompt ou responda às perguntas do agente.

### 1. Nome do módulo
- **Nome em português:** (ex: anexos, departamentos) (deve ser traduzido pro ingles)

**Nome em inglês (kebab-case):** (ex: client-attachment, client-department) é gerado automaticamente com base no nome em portugues

### 2. Campos obrigatórios
| Campo | Tipo | Observações |
|-------|------|-------------|
| (ex: clientId) | (number) | FK, relação |
| (ex: description) | (string) | @db.Text, max 8192 |
| (ex: link) | (string) | max 2048 |
| (ex: active) | (boolean) | default true |

### 3. Campos opcionais
| Campo | Tipo | Default |
|-------|------|---------|
| (ou: nenhum) | | |

### 4. Relacionamentos
- **Entidade pai:** (ex: Client)
- **Cardinalidade:** (ex: 1 cliente → N anexos)
- **onDelete:** (Cascade | SetNull | Restrict)

### 5. Use cases
- [ ] Create
- [ ] Edit
- [ ] Delete
- [ ] FindAll (paginação, busca, filtros)
- [ ] FindById
- [ ] UpdateStatus (inverter active) — opcional
- [ ] (outros customizados)

### 6. Observações
- Módulo de referência: (FAQ | client-item | client-department | outro)
- Filtros obrigatórios em FindAll: (ex: clientId)
- Campos de busca: (ex: description, link)
- Outros: ___
```

## Fluxo de Coleta

1. **Se o usuário já preencheu o formulário no prompt** → use os dados e gere o plano/implementação.
2. **Se faltar informação** → apresente o formulário e pergunte item a item, em formato de checklist ou perguntas diretas.
3. **Em Plan Mode** → pesquise o codebase (FAQ, client-item, etc.), faça as perguntas do formulário e só então gere o plano em Markdown.

## Padrão de Implementação (genérico)

### Estrutura de pastas

```
src/app/{context}/{module-name}/
├── {module-name}.module.ts
├── domain/errors/{module-name}-not-found.error.ts
├── application/
│   ├── dtos/{module-name}.dto.ts
│   ├── persistence/
│   │   ├── {module-name}-persistence.module.ts
│   │   └── dao/{module-name}-dao.interface.ts
│   └── usecases/
│       ├── create-{module-name}/
│       ├── edit-{module-name}/
│       ├── delete-{module-name}/
│       ├── find-all-{module-name}/
│       ├── find-{module-name}-by-id/
│       └── update-{module-name}-status/  (se aplicável)
└── infra/
    ├── drivers/http/admin/ e user/
    └── driven/persistence/prisma/
```

### Schema Prisma

- Model `{PascalCase}` com campos do formulário + `createdAt`, `updatedAt`
- Relação com entidade pai e `onDelete` conforme especificado
- Incluir relação inversa no model pai (ex: `attachments Entity[]`)
- **Truncate:** adicionar `{camelCase}.deleteMany()` no `PrismaService.truncate()`

### DTOs

- `Create{Entity}InputDto`: campos obrigatórios do formulário
- `Edit{Entity}InputDto`: `PartialType(Create{Entity}InputDto)` + campos opcionais
- `FindAll{Entity}QueryDto`: extends `Queries` + filtros obrigatórios (ex: clientId)
- Validação: `class-validator`, `StringToNumber`, `StringToBoolean`, `Trim`, `@MaxLength`

### DAO Interface

- `findAll`, `findById`, `save`, `edit`, `delete`
- `updateStatus(id, active)` se o use case existir
- FindAll: filtros do formulário, busca nos campos indicados, paginação

### Rotas HTTP

- **Admin:** POST, GET, GET/:id, PATCH/:id/status (antes de PATCH/:id, se houver UpdateStatus), PATCH/:id, DELETE/:id
- **User:** GET (listagem somente leitura)

### Testes

1. **Sem mocks:** testes de integração com banco real
2. **DAO:** `*.dao.spec.ts` – verificar persistência nas tabelas corretas
3. **Use cases:** `*.service.spec.ts` – integração com banco real
4. **DTOs:** `*.dto.spec.ts` – validação via `ValidationPipe`
5. **Nomenclatura:** `*.spec.ts` (sem sufixo "integration")
6. **Unique constraint:** em helpers de teste, usar `Date.now()` e `Math.random()` para evitar colisões
7. **Concorrência:** preferir chamadas sequenciais em vez de `Promise.all` ao criar múltiplas entidades relacionadas

### Integrações

- Token `{Entity}Dao` em `token.ts`
- Importar `{Entity}Module` no módulo pai correspondente

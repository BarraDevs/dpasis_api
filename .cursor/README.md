# `.cursor/` — Skills, Rules e Contexto Arquitetural do dpasis_api

Esta pasta concentra a **memória arquitetural** do projeto para uso por agentes de IA (Cursor, Claude Code) e onboarding de pessoas. Tudo aqui foi gerado a partir de uma análise estática do código real e deve ser mantido **em sincronia** com a evolução da arquitetura.

## Estrutura

```
.cursor/
├── README.md                       # Você está aqui
├── context.md                      # Passaporte arquitetural (resumo)
├── commands/
│   ├── nova-feature.md             # /nova-feature — pipeline completo de implementação
│   └── feature-checklist.md        # /feature-checklist — apenas a regra de checklist (RULES.md)
├── rules/
│   └── RULES.md                    # 11 regras arquiteturais ABSOLUTAS
└── skills/
    ├── architecture-overview/SKILL.md
    ├── module-structure/SKILL.md
    ├── use-case-creation/SKILL.md
    ├── dao-pattern/SKILL.md
    ├── repository-pattern/SKILL.md
    ├── domain-modeling/SKILL.md
    ├── dto-and-validation/SKILL.md
    ├── dependency-injection/SKILL.md
    ├── error-handling/SKILL.md
    ├── authentication-and-authorization/SKILL.md
    ├── controllers-and-swagger/SKILL.md
    ├── testing-strategy/SKILL.md
    ├── gateway-adapters/SKILL.md
    ├── prisma-conventions/SKILL.md
    ├── naming-conventions/SKILL.md
    ├── queue-bullmq/SKILL.md
    ├── audit-flow/SKILL.md
    └── adding-new-feature/SKILL.md
```

## Como usar

### 1) Slash command para nova funcionalidade (recomendado)

Para qualquer feature nova (CRUD, use case, rota), invoque:

```
/nova-feature
```

Esse comando (definido em `.cursor/commands/nova-feature.md`) **força** o agente a:
1. Ler `context.md`, `rules/RULES.md` e `skills/adding-new-feature/SKILL.md` antes de qualquer ação
2. Coletar requisitos via formulário estruturado
3. Apresentar plano detalhado de arquivos a criar/modificar
4. Aguardar sua aprovação antes de codificar
5. Carregar as skills específicas a cada passo
6. Validar com lint/test ao final

É a forma **mais segura** de garantir que a feature siga 100% do padrão.

### 2) Para o agente / IA (uso livre)

As skills carregam automaticamente quando o usuário menciona um tópico relacionado (a `description` em frontmatter é deliberadamente "pushy").

Para forçar carregamento explícito numa nova sessão, abra com:

> "Leia `.cursor/context.md` e siga as regras de `.cursor/rules/RULES.md` antes de qualquer implementação. Use as skills em `.cursor/skills/` conforme o tópico."

### 3) Para humanos (onboarding e referência)

| Quero entender… | Leia primeiro |
|---|---|
| Visão geral do projeto | `context.md` → `skills/architecture-overview/SKILL.md` |
| Como criar um módulo CRUD novo | `skills/adding-new-feature/SKILL.md` (checklist mestre) |
| Como criar um use case | `skills/use-case-creation/SKILL.md` |
| Quando usar DAO vs Repository | `skills/dao-pattern/SKILL.md` + `skills/repository-pattern/SKILL.md` |
| Como modelar entidade rica | `skills/domain-modeling/SKILL.md` |
| Como proteger uma rota | `skills/authentication-and-authorization/SKILL.md` |
| Como fazer testes | `skills/testing-strategy/SKILL.md` |
| Como integrar serviço externo (S3, Redis, ViaCEP) | `skills/gateway-adapters/SKILL.md` |
| Convenções de nome | `skills/naming-conventions/SKILL.md` |
| Schema Prisma e migrations | `skills/prisma-conventions/SKILL.md` |
| Regras absolutas | `rules/RULES.md` (11 regras) |
| Filas com BullMQ | `skills/queue-bullmq/SKILL.md` |
| Fluxo de auditoria (interceptor + audit_logs) | `skills/audit-flow/SKILL.md` |

### 4) Slash command apenas checklist (`/feature-checklist`)

Para **revisar** um PR ou **validar** o que falta contra o checklist oficial de feature — sem formulário nem plano do `/nova-feature`:

```
/feature-checklist
```

Definição em `.cursor/commands/feature-checklist.md`. O agente deve ler **`rules/RULES.md`** e usar a seção **«Checklist para Nova Funcionalidade»** ou, como fallback estável, a **última `## Rule …` antes de `## Referências`** (o número da rule pode mudar).

### 5) Para revisão de código (PR review)

Use esse **checklist da última Rule** em `rules/RULES.md` como guia de revisão para features novas. Cobre arquitetura, persistência, autorização, testes e build.

## Anatomia de uma SKILL.md

Cada skill tem o mesmo template:

```yaml
---
name: <nome-kebab-case>
description: >-
  Quando usar esta skill. Inclui sinônimos e variações do que o usuário
  pode dizer, para que o agente acione automaticamente.
---

# <Título>

## Contexto
## Estrutura e Localização
## Como Fazer
## Convenções Obrigatórias
## Anti-Padrões (Nunca Faça)
## Exemplo Completo
```

## Convenções de manutenção

- **Skills evoluem com a arquitetura**: ao mudar um padrão estabelecido, atualize a skill correspondente no mesmo PR
- **Não duplique regras** entre `rules/RULES.md` e skills: rules são absolutas e curtas; skills explicam o "como" com exemplos
- **Use code references reais** (`src/app/...`) com line ranges, não pseudo-código
- **Idioma**: pt-BR para conteúdo, en-US para identificadores e nomes de arquivos das skills
- **Versionamento**: a pasta `.cursor/` é versionada com o código (commitada)
- **Ao introduzir novo padrão**: gere uma nova skill via prompt-gerador (ver tópico abaixo) ou siga o template manualmente

## Quando regenerar tudo

Rode novamente o prompt em `architecture-skill-generator-prompt.md` (que originou esta pasta) após:
- Mudanças arquiteturais grandes (ex.: introduzir CQRS, Event Sourcing, etc.)
- Refatoração transversal (ex.: trocar Prisma por outro ORM)
- Reorganização significativa de pastas
- Adição de novas categorias de gateway

Para edições pontuais, prefira atualizar a(s) skill(s) específica(s) afetadas.

## Mapa rápido de conceitos para localização

| Conceito | Lugar canônico no código | Skill que documenta |
|---|---|---|
| Bootstrap | `src/main.ts` | `architecture-overview` |
| Composição do app | `src/app.module.ts` | `architecture-overview` |
| Tokens DI | `src/core/di/token.ts` | `dependency-injection` |
| AppException | `src/core/filters/app.exception.ts` | `error-handling` |
| HttpExceptionFilter | `src/core/filters/http-exception/http-exception.filter.ts` | `error-handling` |
| AuditInterceptor | `src/app/audit/infra/interceptors/audit.interceptor.ts` | `audit-flow` |
| PrismaService | `src/infra/database/prisma/prisma.service.ts` | `prisma-conventions` |
| ValidationPipe config | `src/infra/validators/class/config.ts` | `dto-and-validation` |
| @Swagger decorator | `src/infra/openapi/swagger.ts` | `controllers-and-swagger` |
| @RequiredRoles | `src/app/authentication/infra/decorators/required-role.decorator.ts` | `authentication-and-authorization` |
| @RequiredClaims | `src/app/authentication/infra/decorators/required-claims.decorator.ts` | `authentication-and-authorization` |
| CaslAbilityFactory | `src/app/authentication/application/authorization/casl-ability.factory.ts` | `authentication-and-authorization` |
| Catálogo Claim | `src/app/authentication/domain/authorization/claim.ts` | `authentication-and-authorization` |
| Pagination VO | `src/shared/value-objects/pagination/pagination.vo.ts` | `domain-modeling` + `use-case-creation` |
| Queries DTO base | `src/infra/validators/class/dtos/queries/queries.dto.ts` | `dto-and-validation` |
| Params DTO base | `src/infra/validators/class/dtos/params/params.dto.ts` | `dto-and-validation` |
| Decorators custom | `src/infra/validators/class/decorators/{trim,string-number,string-boolean}/...` | `dto-and-validation` |
| Módulo CRUD simples (referência) | `src/app/faq/` | `module-structure` |
| Módulo DDD (referência) | `src/app/admin/` | `module-structure` + `domain-modeling` + `repository-pattern` |
| Módulo agregador (referência) | `src/app/client/client-module.module.ts` | `module-structure` |
| CLI gerador interno | `scripts/cli.ts` + `scripts/templates/` | `adding-new-feature` |

# Docker — dpasis_api

Como executar a API NestJS (dpasis_api) com Docker e Docker Compose.

## Pré-requisitos

- Docker 20.10+
- Docker Compose 2.0+

## Arquivos

| Arquivo | Uso |
|---------|-----|
| `Dockerfile` | Imagem de produção (multi-stage) |
| `Dockerfile.dev` | Desenvolvimento (hot reload) |
| `docker-compose.yml` | Produção (API + Postgres + Redis) |
| `docker-compose.dev.yml` | Desenvolvimento (+ Dozzle e tail dos logs Winston) |
| `.dockerignore` | Exclusões no build |

## Serviços

### PostgreSQL 16

- Porta host: `5432` (via `POSTGRES_PORT`)
- Banco padrão: `dpasis` (`POSTGRES_DB`)
- Volume: `postgres_data` / `postgres_dev_data`

### Redis 8

- Porta host: `6379` (`REDIS_PORT`)
- Volume: `redis_data` / `redis_dev_data`
- Usado por cache, filas BullMQ e rate limiting

### API

- Porta: `3000` (`PORT`)
- Swagger: `http://localhost:3000/swagger`
- Schema Prisma: `prisma/schema` (pasta); no container de produção o schema é aplicado com `prisma db push` na subida

### Dozzle (somente dev)

- `http://localhost:9999` (`DOZZLE_PORT`)
- Logs dos containers e dos arquivos em `./logs` (contextos Winston: `http`, `ws`, `cache`, `cep-lookup`, `cnpj-lookup`, `smtp`, `upload-file`, `nf-generation`, `nfs-generation`)

## Desenvolvimento

### Variáveis

1. Copie e preencha o ambiente de desenvolvimento (o app carrega `.env.development` quando `NODE_ENV=development`):

   ```bash
   cp .env.example .env.development
   ```

2. Ajuste `DATABASE_URL` e `REDIS_URL` no arquivo **ou** deixe o compose sobrescrever (recomendado no Docker):

   - `DATABASE_URL` → host `postgres`
   - `REDIS_URL` → `redis://redis:6379`

3. Crie a pasta de logs na raiz do projeto (Winston grava em `logs/`):

   ```bash
   mkdir -p logs
   ```

### Só dependências (API no host)

```bash
docker compose -f docker-compose.dev.yml up postgres redis -d
npm install
npm run db:migration
npm run db:seed   # opcional
npm run start:dev
```

### Stack completa com hot reload

```bash
docker compose -f docker-compose.dev.yml up -d --build
docker compose -f docker-compose.dev.yml exec api npx prisma db push
docker compose -f docker-compose.dev.yml exec api npm run db:seed   # opcional
```

Debug Node: porta `9229` exposta no serviço `api`.

## Produção

1. Configure `.env` na raiz (o Compose usa essas variáveis na interpolação e no serviço `api`). Use `.env.example` como base.

2. **HTTPS:** o `main.ts` atual sobe HTTP mesmo com `NODE_ENV=production`. Os campos `SSL_*` ainda são obrigatórios na validação Joi — preencha caminhos válidos no `.env`. Quando reativar `httpsOptions` no `main.ts`, monte os certificados no container (ex.: volume `/etc/letsencrypt`).

3. Suba os serviços:

   ```bash
   docker compose up -d --build
   ```

4. Seed (opcional), se ainda não rodou:

   ```bash
   docker compose exec api npm run db:seed
   ```

O comando de entrada da API já executa `npx prisma db push` antes de `node dist/src/main`.

## Comandos úteis

```bash
# Logs (dev)
docker compose -f docker-compose.dev.yml logs -f api

# Parar
docker compose -f docker-compose.dev.yml down
docker compose down

# Parar e apagar volumes (apaga dados do Postgres/Redis)
docker compose down -v

# Shell na API
docker compose exec api sh

# psql
docker compose exec postgres psql -U postgres -d dpasis

# Redis CLI
docker compose exec redis redis-cli

# Rebuild da API
docker compose build --no-cache api
docker compose up -d --build api

# Prisma Studio (dentro do container)
docker compose exec api npx prisma studio
```

### Backup Postgres

```bash
docker compose exec postgres pg_dump -U postgres dpasis > backup.sql
docker compose exec -T postgres psql -U postgres -d dpasis < backup.sql
```

## Variáveis relevantes

Obrigatórias na validação (`src/core/config/config.module.ts`):

- `PORT`, `JWT_SECRET`, `CORS_ORIGIN`, `DATABASE_URL`, `REDIS_URL`
- `SSL_KEY`, `SSL_CERT`, `SSL_CA` (caminhos; HTTPS no bootstrap está comentado)
- `AWS_*`, `SMTP_*`
- `QUEUE_DASHBOARD_USERNAME`, `QUEUE_DASHBOARD_PASSWORD`
- `CNPJA_API_URL`, `VIACEP_API_URL`
- `NFEMAIL_API_URL`, `NFEMAIL_CNPJ`, `NFEMAIL_API_KEY`

Opcionais: `THROTTLE_LIMIT`, `THROTTLE_TTL_MS`, `GISS_CERT_PASSWORD` (NFS/Giss).

No Compose de produção, defina também `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` se não usar os padrões.

## Troubleshooting

- **Porta em uso:** altere `PORT`, `POSTGRES_PORT`, `REDIS_PORT` no `.env`.
- **API não sobe:** `docker compose logs api` — confira `.env` / `.env.development` e se Postgres/Redis estão healthy.
- **Log watchers sem saída:** confirme `mkdir -p logs` e que a API já escreveu nos arquivos `.log`.

## Imagem de produção

- Build multi-stage, Node 20 Alpine
- `dumb-init`, usuário não-root
- Apenas dependências de produção no estágio final
- `prisma generate` no build; `resources/` copiado para templates de e-mail e arquivos estáticos

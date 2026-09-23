# dpasis_api

API NestJS do DPASIS — back-office de prestador de serviço (cadastro, NFM, NFS-e via Giss, boleto Banco Inter, fluxo de caixa).

**Onboarding:** leia [docs/onboarding.md](docs/onboarding.md). Docker: [README.Docker.md](README.Docker.md). Arquitetura para agentes e PRs: [.cursor/context.md](.cursor/context.md) e [.cursor/rules/architecture-dpasis.mdc](.cursor/rules/architecture-dpasis.mdc).

## Subir em desenvolvimento

```bash
cp .env.example .env.development
cp .env.example .env.test          # DATABASE_URL com banco cujo nome termina em `_test`
mkdir -p logs
npm run docker:dev:deps            # Postgres 16 + Redis 8
npm install
npm run db:migration
npm run db:seed
npm run start:dev
```

Swagger: `http://localhost:3000/swagger`. Login local após o seed: `admin@email.com` / `123456`.

## Comandos do dia a dia

```bash
npm run start:dev
npm run lint
npm test                           # precisa do Postgres de teste
npm run test:e2e                   # fluxo NFS-e (Postgres + Redis, QUEUE_E2E=true)
npm run build
npm run db:migration               # prisma migrate dev
npm run db:deploy                  # prisma migrate deploy (produção)
```

Schema em `prisma/schema/` (migrations versionadas). O índice parcial `nfses_one_active_per_nfm` só existe no SQL da migration — todo ambiente sobe com `migrate deploy`, nunca `db push`. Detalhe em [docs/onboarding.md](docs/onboarding.md#8-banco-de-dados).

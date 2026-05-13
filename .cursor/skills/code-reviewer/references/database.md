# Referência: Revisão de Banco de Dados / SQL / ORM

## SQL

### Segurança
- **SQL Injection**: concatenação de string com input do usuário → sempre use parâmetros/prepared statements
- Query retornando mais colunas do que o necessário (`SELECT *`) → expõe campos sensíveis desnecessariamente
- Sem `LIMIT` em queries que podem retornar muitos resultados → DoS acidental

### Performance
- **N+1**: loop que executa uma query por iteração → use JOIN ou eager loading
- Sem índice em coluna usada em `WHERE`, `JOIN ON`, `ORDER BY` de tabela grande
- `SELECT *` carregando colunas não usadas
- `LIKE '%termo%'` não usa índice (full table scan)
- `COUNT(*)` em tabela enorme sem filtro
- Transação muito longa mantendo lock → bloqueia outras operações
- Missing `EXPLAIN`/`ANALYZE` em queries críticas de performance

### Corretude
- `NULL` em comparações: `col = NULL` sempre false → use `IS NULL`
- `NOT IN (subquery)` com NULL no subquery retorna sempre vazio
- `JOIN` vs `LEFT JOIN`: ausência de `LEFT` descarta linhas sem correspondência silenciosamente
- Race condition: read-modify-write sem `SELECT FOR UPDATE` ou transação
- `ON DELETE CASCADE` não intencional → deleção em cascata inesperada
- `TRUNCATE` vs `DELETE`: truncate não dispara triggers e não pode ser usado com WHERE

### Migrações
- `ALTER TABLE` em tabela grande sem estratégia → lock por minutos em produção
- Migração irreversível sem backup/plano de rollback
- Adicionar coluna `NOT NULL` sem default em tabela com dados existentes → erro
- Renomear coluna/tabela sem atualizar todas as queries da aplicação

---

## ORM (Django ORM, Hibernate, Prisma, ActiveRecord, etc.)

- `.all()` ou equivalente sem filtro → carrega tabela inteira em memória
- Lazy loading em loop → N+1 query (use `select_related`/`include`/`eager`)
- `.save()` dentro de loop → uma query por iteração em vez de bulk
- Transação ausente em operações que devem ser atômicas
- `raw()` / `query()` com interpolação de string → SQL injection mesmo no ORM
- Cache de query ORM desatualizado → dados stale servidos

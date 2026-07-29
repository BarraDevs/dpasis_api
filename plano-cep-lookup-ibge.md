## Plano para `cep-lookup-ibge` (versão híbrida)

**Tipo:** extensão de endpoint existente + fallback assíncrono (não é CRUD novo)
**Módulo de referência:** `src/infra/cep-lookup` (padrão cnpj-lookup) + `src/app/tax-invoice/nfse` (padrão BullMQ producer/consumer)

### Contexto
`ClientAddress.cityCodeIbge` é obrigatório hoje no WIP (create/edit já exigem). Decisão: **relaxar pra opcional/nullable** e não depender só do frontend/ViaCEP síncrono, já que:
- `city`/`state` têm fallback manual (usuário edita texto se API cair); `cityCodeIbge` não tem input visível — se ViaCEP falhar na hora do cadastro, não há como o usuário preencher.
- Campo é crítico pra emissão de NFS-e/GISS (erro dedicado `ClientAddressForNfseNotFoundError` já existe pra esse caso).

**Caminho principal (síncrono, rápido):** ViaCEP já retorna `ibge` na mesma chamada que preenche city/state — passthrough direto, sem custo extra.
**Fallback (assíncrono, só quando falha):** se `cityCodeIbge` chegar vazio/nulo no create/edit, disparar job em fila (reusa BullMQ já usado por NFM/NFS-e) que tenta resolver via ViaCEP de novo, com retry/backoff — sem introduzir nova API (IBGE), sem tabela local de cidades.

### 1. Schema Prisma
- `prisma/schema/client.prisma:137` — `cityCodeIbge String @db.VarChar(7)` → `cityCodeIbge String? @db.VarChar(7)`
- Gerar migration (`npm run db:migration`)

### 2. Contrato de entrada (relaxar)
- `create-client-address.dto.ts` / `edit-client-address.dto.ts` — `cityCodeIbge` deixa de ser `@IsNotEmpty` obrigatório → `@IsOptional()` + `@IsString()` + `@MaxLength(7)` (mesmo padrão de outros campos opcionais no projeto)
- `client-address.entity.ts` (`ClientAddressCreateProps`) — `cityCodeIbge: string` → `cityCodeIbge: string | null`
- `client-address.factory.ts` — `create()`/`edit()`/`load()` repassam `cityCodeIbge` como está (aceitar `null`)
- Conferir `create-client.dto.ts` (reusa `CreateClientAddressInputDto` pro endereço aninhado) — mesma relaxação se aplica automaticamente

### 3. Passthrough do ViaCEP (caminho principal, já no plano anterior)
1. `src/infra/cep-lookup/dtos/cep-lookup.dto.ts` — adicionar `cityCodeIbge: string | null`
2. `src/infra/cep-lookup/adapters/viacep/cep-lookup-viacep.gateway.ts` — mapear `cityCodeIbge: result.data.ibge || null`
3. `src/infra/cep-lookup/adapters/fake/cep-lookup-fake.gateway.ts` — retornar `cityCodeIbge: cep`
4. `src/infra/cep-lookup/adapters/viacep/cep-lookup-viacep.gateway.spec.ts` — atualizar mocks/expects

### 4. Fallback assíncrono (novo)
Padrão a seguir: `src/app/tax-invoice/nfse/{application/queue,infra/driven/queue/bullmq,infra/drivers/queue/bullmq}` (producer + consumer + module `.register()`).

1. `src/infra/queue/enums/queue-name.enum.ts` — adicionar `ClientAddress = 'client-address'`
2. `src/infra/queue/enums/job-name.enum.ts` — adicionar `ResolveClientAddressIbgeCode = 'resolve-client-address-ibge-code'`
3. Novo módulo `src/app/client/client-address/application/queue/client-address-queue.module.ts` — `BullModule.registerQueue({ name: QueueName.ClientAddress, defaultJobOptions: { attempts: 5, backoff: { type: 'exponential', delay: 30_000 }, removeOnComplete: true, removeOnFail: false } })` (mantém job falho pra inspeção/alerta, diferente do nfse que remove — decidir junto com o time se quer DLQ manual ou alerta)
4. Job DTO: `resolve-client-address-ibge-code-job.dto.ts` — `{ clientAddressId: number; zipCode: string }`
5. Producer interface + adapters (`IClientAddressQueueProducer`, `ClientAddressQueueBullmqAdapterProducer`, `ClientAddressQueueFakeAdapterProducer`) — método `addResolveIbgeCodeJob(data)`
6. Consumer `ClientAddressBullmqConsumer` (`@Processor(QueueName.ClientAddress)`) → chama use case `ProcessResolveClientAddressIbgeCode`
7. Use case `ProcessResolveClientAddressIbgeCode.execute({ clientAddressId, zipCode })`:
   - chama `ICepLookupGateway.lookup(zipCode)` (mesmo gateway do passthrough)
   - se retornar `cityCodeIbge`, faz `UPDATE` direto do campo no `ClientAddress` (via DAO/repository já existentes — não passar pelo `edit-client-address` use case completo pra não reabrir validações de negócio alheias)
   - se falhar, deixa o BullMQ reprocessar (retries já configurados); se esgotar tentativas, job fica em failed pra alerta/observabilidade (não pode falhar silenciosamente dado impacto em NFS-e)
8. `create-client-address.service.ts` / `edit-client-address.service.ts` — após salvar, se `data.cityCodeIbge` vier vazio, chamar `clientAddressQueueProducer.addResolveIbgeCodeJob({ clientAddressId: id, zipCode: data.zipCode })`

### 5. Não é necessário
- Nova dependência de API do IBGE
- Tabela local de cidades/municípios

### 6. Testes
- `cep-lookup-viacep.gateway.spec.ts` — passthrough do `ibge`
- `create-client-address.service.spec.ts` / `edit-client-address.service.spec.ts` — cenário "cityCodeIbge vazio → dispara job na fila" (mock do producer)
- `process-resolve-client-address-ibge-code.service.spec.ts` (novo) — sucesso, falha do gateway, update do endereço
- Integration test do fluxo (se módulo NFS-e tiver precedente de integration test de fila, seguir o mesmo)

### Pontos de atenção
- **Campo nullable é mudança de contrato pra baixo em toda a stack que hoje assume `cityCodeIbge: string` não-nulo** (consumidores NFS-e/GISS) — precisa checar cada leitura desse campo e tratar `null` (ex.: `ClientAddressForNfseNotFoundError` já cobre "sem IBGE cadastrado", só confirmar que dispara também pro caso `null` e não só "endereço não encontrado")
- Job de fallback precisa ser **idempotente**: se endereço for editado de novo (novo CEP) antes do job antigo rodar, job antigo não pode sobrescrever com IBGE do CEP velho — usar `zipCode` capturado no momento do enqueue e, no update, revalidar que o `zipCode` do endereço ainda bate com o do job (senão, no-op)
- Alertar/observar jobs que esgotam retries — endereço sem IBGE bloqueia emissão de nota, precisa ficar visível pro time, não só "silenciosamente sem nota"
- Confirmar com o time se faz sentido também expor no admin (painel) um indicador "endereço sem código IBGE" pra correção manual, já que job pode falhar definitivamente (CEP inválido cadastrado)

### Checagens manuais sugeridas
- [ ] Criar endereço com CEP válido, ViaCEP no ar → `cityCodeIbge` preenchido de forma síncrona (sem passar pela fila)
- [ ] Simular ViaCEP fora do ar (mock/derrubar) no momento do cadastro → endereço salvo com `cityCodeIbge: null`, job enfileirado, e ao voltar ViaCEP, job resolve e atualiza o registro
- [ ] Editar endereço pra novo CEP antes do job antigo processar → confirmar que não há sobrescrita com dado desatualizado
- [ ] `npm test` nos specs de cep-lookup, client-address (create/edit) e do novo use case de fila

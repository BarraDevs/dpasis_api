# Integração frontend — NFM (clientes elegíveis para emissão de NF-e)

## Introdução

Este documento descreve o endpoint administrativo que lista **clientes elegíveis** para o fluxo de **NF-e (NFM)** no dia da consulta. A resposta agrega cliente, configuração de fatura/boleto e itens ativos do cliente.

**Referência OpenAPI:** Swagger em `/swagger`, tag **NFM**.

**Relacionado:** [Configuração de NF e boleto (`ClientInvoiceConfigDto`)](./frontend-integracao-cliente-config-nf-boleto.md)

## Base URL admin

| Método | Caminho | Descrição |
|--------|---------|-----------|
| `GET` | `/admin/nfm` | Lista `NfmDto[]` (sem paginação) |

## Resumo das mudanças

| Área | Comportamento |
|------|----------------|
| **Aditivo** | Nova rota **`GET /admin/nfm`** dedicada ao painel / automações de NF-e |
| **Formato** | Corpo da resposta: **array JSON** (`Content-Type: application/json`), não envelope paginado |

## Contrato — resposta (`NfmDto[]`)

Cada elemento do array segue o schema **`NfmDto`**:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `client` | objeto | Dados do cliente (`ClientDto`), alinhados ao restante da API de clientes |
| `clientInvoiceConfig` | objeto | Configuração de NF/boleto (`ClientInvoiceConfigDto`) — ver [guia de config NF/boleto](./frontend-integracao-cliente-config-nf-boleto.md) para formato de `billingAddress` e `bank` nas respostas |
| `clientItems` | array | Itens do cliente (`ClientItemDto[]`), apenas **ativos** |

Lista **vazia** (`[]`) quando nenhum cliente satisfaz os critérios abaixo no momento da chamada.

### Regras de elegibilidade (visão de produto)

O backend monta a lista quando **todas** as condições abaixo se aplicam ao mesmo cliente:

1. Existe **configuração de invoice** com **`generateNf: true`** e **`dueDateDay`** igual ao **dia do mês atual** (1–31, conforme data do servidor).
2. O cliente está **`active: true`**, com **`invoiceType`** de **contrato**, **`generateInvoice: true`** e seu `id` aparece entre os das configs filtradas no passo anterior.
3. Há **pelo menos um** `clientItem` **`active: true`** para esse cliente.

Útil para o frontend explicar por que um cliente esperado não aparece (ex.: dia de vencimento diferente do dia corrente, NF não marcada para gerar, sem itens ativos).

## Autenticação e autorização

- **Padrão do projeto:** rotas sob `/admin/*` costumam exigir JWT Bearer e papel **admin**, com claims específicas por recurso.
- **Verificação obrigatória:** confira no Swagger desta rota se constam **401/403** e **Bearer Auth**. No código-fonte atual deste controller não há decorators `@RequiredRoles` / `@RequiredClaims`; alinhar com o time backend se a proteção será aplicada antes do uso em produção.

## Erros e UX

- Respostas de erro seguem o payload padrão `{ "message": string }` quando lançado `AppException`.
- Para **`GET`** sem query body, falhas tendem a ser infraestrutura ou configuração de auth no gateway — validar mensagem exibida ao usuário administrativo.

## Checklist prático para o frontend

1. Gerar ou atualizar tipos a partir do OpenAPI (`NfmDto`, `ClientDto`, `ClientInvoiceConfigDto`, `ClientItemDto`).
2. Tratar array vazio como estado válido (“nenhum cliente elegível hoje”).
3. Considerar refresh manual ou agendado: o resultado depende do **dia atual** no servidor.
4. Cruzar com o doc de **`ClientInvoiceConfigDto`** para campos aninhados de NF/boleto nas respostas.

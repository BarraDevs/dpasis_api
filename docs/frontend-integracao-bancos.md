# Multa e mora no cadastro de bancos

Guia de integração para o app admin: **multa** e **mora** percentuais no recurso de bancos, enviadas na emissão de boleto (Inter Bolepix v3), inclusive no fluxo NFM/NFS-e.

**Breaking:** o campo `discounts` (descontos do boleto) foi **removido** do cadastro de banco, do `bank` aninhado na invoice config e do `POST /admin/bank-payment`. Não enviar esse campo. Desconto comercial do cliente (`client-discount`) **não mudou**.

Claims e rotas de bancos **não mudaram**.

## Base URL admin

- Bancos: `…/admin/bank`
- Cobrança / boleto: `…/admin/bank-payment`
- Configuração de NF e boleto do cliente: objeto aninhado `bank` em `GET` de invoice config traz os mesmos campos de multa/mora

Autenticação: JWT de admin + claims `BANK_READ` / `BANK_WRITE` nas rotas de banco; claims de cobrança nas rotas de `bank-payment`.

## Resumo das mudanças

| Área | O que mudou |
|---|---|
| `POST /admin/bank` e `PATCH /admin/bank/:id` | Body aceita `fineRate` e `moraRate` (opcionais). `discounts` **não existe mais** (whitelist ignora; não persiste) |
| `GET /admin/bank` e `GET /admin/bank/:id` | Resposta inclui `fineRate` e `moraRate` (`null` se não cadastrados). Sem `discounts` |
| Invoice config (`bank` aninhado) | Mesmos campos no objeto `bank` |
| `POST /admin/bank-payment` | Body aceita `fineRate` e `moraRate` opcionais na emissão manual. Sem `discounts` |
| Emissão via NFM/NFS-e | Sem body novo: lê `fineRate`/`moraRate` do banco do cliente (`ClientInvoiceConfig.bank`) no momento da emissão |

**Atenção no PATCH:** `EditBank` reenvia o cadastro completo (não é `Partial`). Omitir `fineRate` / `moraRate` **zera** o valor no banco, no mesmo padrão de `paymentLocation`.

## Unidade e formato

Percentual em pontos percentuais, **não** fração:

- `2` = 2% de multa após o vencimento
- `1` = 1% ao mês (mora)

Faixa: `0` a `100`, até 2 casas decimais.

Exemplo de body (`POST` / `PATCH` banco):

```json
{
  "drawer": "Empresa XYZ Ltda",
  "wallet": "123",
  "account": "12345-6",
  "agency": "0001",
  "bankCode": "077",
  "bankName": "Banco Inter",
  "paymentLocation": "Pagável em qualquer banco até o vencimento",
  "fineRate": 2,
  "moraRate": 1
}
```

Para não enviar encargos ao Inter: `null` ou omitir no create. Para limpar no PATCH: enviar `null` (ou omitir, o que também zera).

## Autenticação e claims

Não há claims novas.

| Recurso | Leitura | Escrita |
|---|---|---|
| Bancos | `BANK_READ` | `BANK_WRITE` |

## Erros / UX

Exibir `message` do payload (`AppException`).

- `400` — validação (`fineRate`/`moraRate` fora de 0–100 ou mais de 2 casas decimais)
- `404` — banco não encontrado (já existente)
- `409` — `bankCode` + `agency` + `account` já em uso (já existente)

## Checklist prático para o frontend

1. Formulário de banco: campos opcionais multa (%) e mora % a.m. **Remover** a lista de descontos do boleto.
2. Tipar OpenAPI: `2` = 2%, nunca `0.02`.
3. No `PATCH`, reenviar `fineRate`/`moraRate` atuais se o usuário não alterou (senão zera).
4. Atualizar mocks E2E e o objeto `bank` da tela de configuração de faturamento: sem `discounts`.
5. Emissão NFM/retry de boleto não pede esses campos no body: usa o cadastro do banco vinculado ao cliente.
6. `POST /admin/bank-payment` (emissão avulsa) pode enviar `fineRate`/`moraRate`; se omitidos, o Inter recebe cobrança sem multa/mora.

# Integração frontend — pagamento do boleto (NFS-e / NFM)

O que mudou na API para o portal acompanhar **pago / cancelado / expirado** do Bolepix. Continuidade
do fluxo NFM: [guia-fluxo-nfm-portal-web.md](guia-fluxo-nfm-portal-web.md) §8.3 e §8.4.

## Base URL

Rotas de **consulta** do boleto no admin **ganharam `bankId` obrigatório** (credenciais Inter agora
são por banco, não por `.env`):

- `GET /admin/nfm` e `GET /admin/nfm/:id` — JWT admin, claims de NFM (inalteradas)
- `POST /admin/bank-payment` — body com `bankId`
- `GET /admin/bank-payment` — query `bankId`
- `GET /admin/bank-payment/:codigoSolicitacao` — query `provider` + `bankId`
- `GET /admin/bank-payment/:codigoSolicitacao/pdf` — query `provider` + `bankId`
- `POST /admin/bank-payment/:codigoSolicitacao/cancel` — body com `bankId`

Há uma rota **pública** só para o Banco Inter (não usar no app):

- `POST /webhooks/inter/cobranca/:token`

Cadastro das keys/certificado: [frontend-integracao-bancos.md](frontend-integracao-bancos.md).

## Resumo das mudanças

| Área | O que mudou | Breaking? |
|---|---|---|
| `NfseDto` / `NfmWithNfseDto.nfse` | Campos novos `bankPaymentSettledAt` e `bankPaymentNextSettlementAt` | Não (aditivo) |
| `bankPaymentStatus` | Continua sendo atualizado depois da confirmação (pago, cancelado, expirado) | Não — o valor antigo `EMITTED` ainda existe enquanto a cobrança está em aberto |
| Rotas admin de boleto | `bankId` **obrigatório** no emit/list/find/pdf/cancel | **Sim** — sem `bankId` a validação responde 400 |
| Claims CASL | Nenhuma claim nova | Não |

## Campos novos na NFS-e

Vêm no mesmo objeto `nfse` de `NfmWithNfseDto`:

| Campo | Tipo | Quando preenche |
|---|---|---|
| `bankPaymentSettledAt` | `string` ISO UTC ou `null` | Preenchido quando a cobrança saiu do aberto: `PAID`, `RECEIVED`, `MARKED_RECEIVED`, `CANCELLED` ou `EXPIRED` |
| `bankPaymentNextSettlementAt` | `string` ISO UTC ou `null` | Agenda interna da varredura. **Não exibir** na UI |

`PAID`, `RECEIVED` e `MARKED_RECEIVED` contam todos como **pago** na UI (o Inter usa `RECEBIDO` /
`MARCADO_RECEBIDO` para boleto pago). `ATRASADO` no Inter permanece `EMITTED` (ainda em aberto).

Pago-like **não** é sobrescrito depois por cancelado ou expirado.

## O que o portal deve fazer

1. Tratar `bankPaymentSettledAt` + `bankPaymentStatus` como a fonte de “o cliente pagou?” — não
   precisa consultar o Inter na hora só para pintar o estado.
2. Atualizar a derivação de estado do boleto (snippet em [guia §8.3](guia-fluxo-nfm-portal-web.md#83-estados-do-boleto-na-ui)): depois de `confirmando`, distinguir `emitido` / `pago` / `cancelado` / `expirado`.
3. Continuar usando `GET /admin/bank-payment/:codigoSolicitacao` só no **detalhe** (PDF, linha
   digitável, conferência pontual). Não pollar lista.
4. **Não** chamar `POST /webhooks/inter/cobranca/:token`. Token no path, sem JWT; o Inter é quem
   posta. 401 = token errado; 503 = Inter fora na confirmação GET (o próprio Inter retenta).

## Erros / UX

Mensagens continuam em `message` do payload `{ message: string }`. Sem `bankId` nas rotas admin de
cobrança → 400. Banco da config de fatura sem keys/certificado → 400
(`Banco sem credenciais de integração configuradas.`).

Na lista/detalhe da NFM, se `bankPaymentSettledAt` estiver nulo e `bankPaymentConfirmedAt`
preenchido, mostrar “em aberto” (`emitido`), não “pago”.

## Checklist

1. Tipar `bankPaymentSettledAt` e `bankPaymentNextSettlementAt` a partir do OpenAPI.
2. Ajustar a derivação de estado do boleto (pago / cancelado / expirado).
3. Não exibir `bankPaymentNextSettlementAt`.
4. Enviar `bankId` em emit/list/find/pdf/cancel.
5. Mocks E2E: nota emitida em aberto (`EMITTED` + `bankPaymentSettledAt: null`) vs paga (`PAID` +
   `bankPaymentSettledAt` preenchido).

# Integração frontend — itens da NFM gerada (`clientItems`)

A lista e o detalhe da NFM **já emitida** passam a trazer os itens de serviço congelados no
fechamento. Continuidade do fluxo: [guia-fluxo-nfm-portal-web.md](guia-fluxo-nfm-portal-web.md)
(§5 elegíveis, §6 fechamento, apêndice 16.A).

Não substitui `GET /admin/nfm/elegible` (cadastro **atual**). Não muda rotas, claims nem query.

## Base URL admin

JWT admin. Rotas **inalteradas**:

- `GET /admin/nfm` — claim `NFM_READ`
- `GET /admin/nfm/:id` — claim `NFM_READ`

## Resumo das mudanças

| Área | O que mudou | Breaking? |
|---|---|---|
| `NfmWithNfseDto` | Campo novo `clientItems` | Não (aditivo) |
| Rotas / claims | Inalteradas | Não |
| `nfse.data` | Continua snapshot interno da NFS-e. **Não** é a lista de itens | Não — não usar como fonte da tabela |

## Campo novo

Vem no objeto da NFM (mesmo nível de `totalValueInCents` e `nfse`), **não** dentro de `nfse`:

| Campo | Tipo | Quando preenche |
|---|---|---|
| `clientItems` | array de `ClientItemDto` | Snapshot do fechamento. Sempre presente. Sem itens no JSON antigo → `[]` |

Shape de cada item = o mesmo de `GET /admin/nfm/elegible` (`id`, `description`, `quantity`,
`unitValueInCents`, `totalValueInCents`, `cnaeNbsIndop`, …). Datas vêm ISO UTC.

É o que **entrou na nota**, não o cadastro vivo do cliente. Item desativado depois do fechamento
continua na NFM.

Não vem o JSON bruto da NFM (`client`, `clientInvoiceConfig`). Só `clientItems`.

## Erros / UX

Inalterados: `404` NFM inexistente; `500` NFM sem NFS-e vinculada. Exibir `message` do payload.

## Checklist prático para o frontend

1. Tipar `clientItems` em `GET /admin/nfm` e `GET /admin/nfm/:id` (OpenAPI / `NfmWithNfseDto`).
2. Tela de detalhe: montar a tabela a partir de `clientItems`, não de `nfse.data.input.service.description`.
3. Tratar `[]` (NFM antiga ou snapshot vazio) — empty state, não erro.
4. Não misturar com `GET /admin/nfm/elegible`: um é snapshot da competência; o outro é o cadastro atual.

# Integração frontend — listar NFS-e no Giss

Consulta das NFS-e **direto no Giss Online**, sem passar pelo cadastro local de NFM/NFS-e. Serve para
o operador ver o que a prefeitura já emitiu (inclusive notas fora do portal) sem abrir o painel do
Giss. Continuidade do fluxo: [guia-fluxo-nfm-portal-web.md](guia-fluxo-nfm-portal-web.md).

Não substitui `GET /admin/nfm` (lista local) nem `POST /admin/nfm/reconcile-period` (conciliação).

## Base URL admin

JWT admin. Recurso novo:

- `GET /admin/nfse/issued-at-provider` — claim `NFM_READ`

Não existe rota `user/`.

## Resumo das mudanças

| Área | O que mudou | Breaking? |
|---|---|---|
| Rotas admin | `GET /admin/nfse/issued-at-provider` | Não (aditivo) |
| Claims CASL | Reusa `NFM_READ` (subject NFM). Sem claim nova | Não — admin que já lista NFM acessa |
| `GET /admin/nfm` | Inalterado | Não |
| `POST /admin/nfm/reconcile-period` | Inalterado (não devolve a lista do Giss) | Não |

## Query

| Campo | Tipo | Obrigatório | Notas |
|---|---|---|---|
| `companyId` | number | sim | Prestador. Uma chamada SOAP por empresa |
| `startDate` | string `yyyy-MM-dd` | sim | Inclusivo. Emissão no Giss, fuso Brasília |
| `endDate` | string `yyyy-MM-dd` | sim | Inclusivo. Não pode ser anterior a `startDate` |
| `page` | number | não | Default **1**. Página do Giss, **não** o `size` do portal |

Não há `search`, `size` nem `total`. Cada página tem no máximo **50** notas (`pageSize` na resposta).

## Resposta `200`

```json
{
  "companyId": 1,
  "page": 1,
  "pageSize": 50,
  "endOfPages": false,
  "notes": [
    {
      "rpsNumber": 41,
      "rpsSeries": "NFSE",
      "nfseNumber": "9041",
      "verificationCode": "ABC123",
      "issueDate": "2026-09-03T10:00:00",
      "competence": "2026-09-01",
      "takerDocument": "12345678000199",
      "takerName": "Cliente Exemplo LTDA",
      "servicesValue": 1500.5,
      "netValue": 1425.48,
      "description": "Manutenção predial mensal",
      "canceled": false,
      "cancellationDate": null,
      "cancellationReasonCode": null
    }
  ]
}
```

Campos opcionais do XML do Giss vêm `null` quando o provedor não manda — a página não falha por isso.

`canceled: true` quando existe cancelamento no XML (`cancellationDate` / `cancellationReasonCode`
podem acompanhar).

## Paginação

O Giss não devolve total. Loop:

1. Começar em `page=1`.
2. Renderizar `notes`.
3. Se `endOfPages === true`, parar. Senão `page += 1` e repetir.

`endOfPages` é `true` na página incompleta (< 50) ou quando o Giss responde que não há mais notas
(código interno `E212`). **Não** tratar lista vazia + `endOfPages: true` como erro — período sem
notas.

Há throttle (metade do limite padrão), igual a `GET /admin/nfm/:id/provider-status`. Não prefetch
dezenas de páginas de uma vez.

## Autenticação e claims

| Recurso | Claim |
|---|---|
| `GET /admin/nfse/issued-at-provider` | `NFM_READ` |
| JWT / role | admin |

Admin sem `NFM_READ` fica fail-closed (403).

## Erros / UX

Payload padronizado `{ message: string }`. Exibir `message`.

| Status | Quando |
|---|---|
| 400 | Query inválida (`companyId`, datas `yyyy-MM-dd`) ou `startDate` posterior a `endDate` |
| 404 | Empresa inexistente **ou** empresa sem configuração NFS (`certificado` / inscrição municipal) |
| 503 | Giss fora, timeout, ou erro de negócio do provedor (ex. período acima do permitido) |

Não confundir com `GET /admin/nfm`: esta rota **não** devolve `nfseId` local. Casa com o portal só
por RPS (`rpsNumber` + `rpsSeries`) se a tela precisar cruzar.

## Checklist

1. Tipar a resposta a partir do OpenAPI (`ListIssuedNfseFromProviderOutputDto`).
2. Exigir empresa + período na UI antes de chamar.
3. Paginar com `endOfPages`, sem `size`/`total`.
4. Mostrar tomador, valor, descrição e badge de cancelada quando `canceled`.
5. Tratar 503 com retry/backoff; 404 de config NFS com CTA para cadastrar certificado da empresa.
6. Mocks E2E: página cheia (`endOfPages: false`, 50 notas) vs última (`endOfPages: true`) vs período vazio.

# Integração frontend — listar NFS-e no Giss

Consulta das NFS-e **direto no Giss Online**, sem passar pelo cadastro local de NFM/NFS-e. Serve para
o operador ver o que a prefeitura já emitiu (inclusive notas fora do portal) sem abrir o painel do
Giss. Continuidade do fluxo: [guia-fluxo-nfm-portal-web.md](guia-fluxo-nfm-portal-web.md).

Não substitui `GET /admin/nfm` (lista local) nem `POST /admin/nfm/reconcile-period` (conciliação).

A classificação NFM/NFS é **só deste ERP**. O Giss não guarda o tipo. A listagem devolve `kind`
depois de cruzar a página do provedor com a tabela interna.

## Base URL admin

JWT admin:

- `GET /admin/nfse/issued-at-provider` — claim `NFM_READ`
- `POST /admin/nfse/classifications` — claim `NFM_WRITE`

Não existe rota `user/`.

## Resumo das mudanças

| Área | O que mudou | Breaking? |
|---|---|---|
| Rotas admin | `GET /admin/nfse/issued-at-provider` e `POST /admin/nfse/classifications` | Não (aditivo) |
| Resposta da listagem | Cada nota ganha `kind`: `"NFM"`, `"NFS"` ou `null` | Aditivo. Tipar o campo; nota sem classificação vem `null` |
| Claims CASL | Listagem reusa `NFM_READ`. Classificação reusa `NFM_WRITE` | Não — admin que já escreve NFM classifica |
| `GET /admin/nfm` | Inalterado | Não |
| `POST /admin/nfm/reconcile-period` | Inalterado (não devolve a lista do Giss) | Não |

## Query da listagem

| Campo | Tipo | Obrigatório | Notas |
|---|---|---|---|
| `companyId` | number | sim | Prestador. Uma chamada SOAP por empresa |
| `startDate` | string `yyyy-MM-dd` | sim | Inclusivo. Emissão no Giss, fuso Brasília |
| `endDate` | string `yyyy-MM-dd` | sim | Inclusivo. Não pode ser anterior a `startDate` |
| `page` | number | não | Default **1**. Página do Giss, **não** o `size` do portal |

Não há `search`, `size` nem `total`. Cada página tem no máximo **50** notas (`pageSize` na resposta).

## Resposta `200` da listagem

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
      "cancellationReasonCode": null,
      "kind": "NFM"
    }
  ]
}
```

`kind` é classificação interna (`NFM` ou `NFS`). `null` quando aquele RPS ainda não foi classificado.

Campos opcionais do XML do Giss vêm `null` quando o provedor não manda — a página não falha por isso.

`canceled: true` quando existe cancelamento no XML (`cancellationDate` / `cancellationReasonCode`
podem acompanhar).

## Classificação em massa

`POST /admin/nfse/classifications`

Não envia nada ao Giss. Upsert na chave empresa + série + número do RPS. Reclassificar é mandar o
mesmo RPS com outro `kind`. Remover classificação não existe nesta etapa.

Teto de **200** itens. Série com até **5** caracteres (limite do Giss). A API grava a série em
maiúsculas; `"nfse"` e `"NFSE"` são o mesmo RPS.

### Body

```json
{
  "companyId": 1,
  "items": [
    { "rpsNumber": 41, "rpsSeries": "NFSE", "kind": "NFM" },
    { "rpsNumber": 42, "rpsSeries": "NFSE", "kind": "NFS" }
  ]
}
```

| Campo | Tipo | Obrigatório | Notas |
|---|---|---|---|
| `companyId` | number | sim | Mesma empresa da listagem |
| `items` | array | sim | 1 a 200 |
| `items[].rpsNumber` | number | sim | Número do RPS no Giss |
| `items[].rpsSeries` | string | sim | Série do RPS, até 5 caracteres |
| `items[].kind` | `"NFM"` \| `"NFS"` | sim | Tipo interno |

### Resposta `200`

```json
{ "message": "NFS-e classificadas com sucesso" }
```

Depois do POST, a próxima `GET /admin/nfse/issued-at-provider` já devolve `kind` preenchido para
esses RPS.

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
| `POST /admin/nfse/classifications` | `NFM_WRITE` |
| JWT / role | admin |

Admin sem a claim fica fail-closed (403).

## Erros / UX

Payload padronizado `{ message: string }`. Exibir `message`.

| Status | Quando |
|---|---|
| 400 | Query/body inválido, `startDate` posterior a `endDate`, mais de 200 itens, `kind` fora de `NFM`/`NFS`, ou RPS repetido na mesma carga |
| 404 | Empresa inexistente **ou** empresa sem configuração NFS (`certificado` / inscrição municipal) — só na listagem |
| 503 | Giss fora, timeout, ou erro de negócio do provedor (ex. período acima do permitido) — só na listagem |

Não confundir com `GET /admin/nfm`: a listagem do Giss **não** devolve `nfseId` local. Casa com o
portal só por RPS (`rpsNumber` + `rpsSeries`) se a tela precisar cruzar.

## Checklist

1. Tipar a resposta a partir do OpenAPI (`ListIssuedNfseFromProviderOutputDto`). Incluir `kind`.
2. Exigir empresa + período na UI antes de listar.
3. Paginar com `endOfPages`, sem `size`/`total`.
4. Mostrar tomador, valor, descrição, badge de cancelada quando `canceled`, e badge NFM/NFS quando `kind` vier preenchido.
5. Classificar em massa com `POST /admin/nfse/classifications` (lote ≤ 200). Recarregar a página do Giss depois.
6. Tratar 400 de RPS duplicado na carga; 503 da listagem com retry/backoff; 404 de config NFS com CTA para cadastrar certificado da empresa.
7. Mocks E2E: página cheia (`endOfPages: false`, 50 notas) vs última (`endOfPages: true`) vs período vazio; nota com `kind: "NFM"` vs `kind: null`.

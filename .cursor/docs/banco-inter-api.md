# Glossário — API Banco Inter Empresas

> Índice de lookup para o agente. Consultar **antes** de implementar qualquer integração Pix, boleto, banking, webhook ou token Inter.
>
> **Portal:** [https://developers.inter.co](https://developers.inter.co)  
> **Coleta:** 2026-08-25 (rotas Docusaurus + specs Redoc em `/redocusaurus/*.yaml`)  
> **Escopo:** guias + referências business (token, bolepix, banking, pix, pix-automático, fórum) + FAQ/erros. Sem crédito imobiliário/empresas.

## Bases e autenticação (resumo)

| Ambiente | Base URL |
|---|---|
| Produção | `https://cdpj.partners.bancointer.com.br` |
| Sandbox | `https://cdpj-sandbox.partners.uatinter.co` |

- **mTLS obrigatório** (certificado `.crt` + chave `.key` da integração) — ver [Autenticação mTLS](#autenticacao-mtls).
- **OAuth 2.0 client_credentials** — `POST /oauth/v2/token` — ver [Token](#token) e [OAuth 2.0](#oauth-20).
- Token válido por **~60 minutos**; reutilizar; escopos por API (ex.: `cob.write`, `boleto-cobranca.read`, `extrato.read`).
- APIs exclusivas para **conta PJ** (não MEI/PF) — ver [FAQ](#duvidas-frequentes).

---

## Mapa rápido (fluxo → onde ler)

| Quero… | Começar em | Depois |
|---|---|---|
| Criar app / baixar cert / renovar | [Introdução](#guias--introducao) | [Token](#token) · [Postman](#guias--postman) |
| Emitir boleto + Pix (v3) | [Cobrança Bolepix](#cobranca-bolepix-v3) | [Webhooks](#guias--webhooks) · [FAQ migração v2→v3](#duvidas-frequentes) |
| Pix cobrança imediata (Cob) | [API Pix — cob](#pix--cob-cobranca-imediata) | [Sandbox](#guias--sandbox) · [Webhook Pix](#pix--webhook) |
| Pix cobrança com vencimento (CobV) | [API Pix — cobv](#pix--cobv-cobranca-com-vencimento) | [Lotes](#pix--lotecobv) |
| Pix recorrente / automático | [Pix Automático](#pix-automatico) | Webhooks `webhookrec` / `webhookcobr` |
| Saldo / extrato / pagar boleto / Pix out | [Banking](#banking) | [Webhooks banking](#banking--webhooks) |
| Receber callbacks de pagamento | [Guias Webhooks](#guias--webhooks) | Spec da API correspondente |
| Testar sem produção | [Sandbox](#guias--sandbox) · [Postman](#guias--postman) | Endpoints `*Sandbox` nas specs |
| Remessa/retorno arquivo | [CNAB](#guias--cnab) | [FAQ CNAB](#duvidas-frequentes) |
| Status HTTP estranho | [Erros](#erros-status-code) | [Token](#token) · escopos |

---

## Guias — Introdução

Categoria: [https://developers.inter.co/docs/category/introdução](https://developers.inter.co/docs/category/introdu%C3%A7%C3%A3o)

### Sobre este portal

- URL: https://developers.inter.co/docs/introducao/sobre-este-portal
- O que tem: visão geral do portal de desenvolvedor Inter Empresas; ponto de partida da documentação.
- Relacionado: [Nossas APIs](#nossas-apis) · [Como criar uma integração](#como-criar-uma-integracao)

### Nossas APIs

- URL: https://developers.inter.co/docs/introducao/nossas-apis
- O que tem: o que é API no contexto Inter; panorama dos produtos (Pix, cobrança, banking, etc.).
- Relacionado: [Referências](#referencias-openapi) · [Mapa rápido](#mapa-rapido-fluxo--onde-ler)

### Como criar uma integração

- URL: https://developers.inter.co/docs/introducao/como-criar-uma-aplicacao
- O que tem: acesso exclusivo PJ; fluxo no Internet Banking (Soluções → Nova Integração); permissões/escopos; download de chaves e certificado.
- Relacionado: [Como renovar](#como-renovar-uma-integracao) · [mTLS](#autenticacao-mtls) · [OAuth 2.0](#oauth-20) · [Sandbox: criar integração](#como-criar-uma-integracao-no-sandbox)

### Como renovar uma integração

- URL: https://developers.inter.co/docs/introducao/como-renovar-uma-integracao
- O que tem: certificado da integração vale **1 ano**; passos de renovação.
- Relacionado: [Como criar uma integração](#como-criar-uma-integracao) · [Erros 401](#erros-status-code)

### Diagrama de funcionamento

- URL: https://developers.inter.co/docs/introducao/diagrama-de-funcionamento
- O que tem: diagrama mTLS + OAuth para autorizar chamadas às APIs.
- Relacionado: [mTLS](#autenticacao-mtls) · [OAuth 2.0](#oauth-20) · [Token](#token)

### Autenticação mTLS

- URL: https://developers.inter.co/docs/introducao/autenticacao-mtls
- O que tem: o que é mTLS; uso do certificado/chave cliente em todas as chamadas (incluindo token).
- Relacionado: [OAuth 2.0](#oauth-20) · [Postman: certificado](#como-adicionar-o-certificado) · [Erros 401](#erros-status-code)

### OAuth 2.0

- URL: https://developers.inter.co/docs/introducao/oauth-2.0
- O que tem: grant client_credentials; escopos; como o token autoriza as APIs.
- Relacionado: [Token (OpenAPI)](#token) · [Postman: gerar token](#como-gerar-um-token-oauth) · [mTLS](#autenticacao-mtls) · [FAQ duração do token](#duvidas-frequentes)

---

## Guias — Postman

Categoria: [https://developers.inter.co/docs/category/configurando-postman-para-testes](https://developers.inter.co/docs/category/configurando-postman-para-testes)

### Collection para importação

- URL: https://developers.inter.co/docs/configurando-postman-testes/import_collection
- O que tem: collection com endpoints para importar no Postman e facilitar testes.
- Relacionado: [Sandbox](#guias--sandbox) · [Como gerar token](#como-gerar-um-token-oauth)

### Como adicionar o certificado

- URL: https://developers.inter.co/docs/configurando-postman-testes/como-add-certificado
- O que tem: configurar certificado SSL por domínio no Postman (mTLS).
- Relacionado: [mTLS](#autenticacao-mtls) · [Como gerar token](#como-gerar-um-token-oauth)

### Como gerar um token OAuth

- URL: https://developers.inter.co/docs/configurando-postman-testes/como-gerar-um-token-oauth
- O que tem: gerar token com credenciais + certificado da integração no Postman.
- Relacionado: [Token](#token) · [OAuth 2.0](#oauth-20) · [Como utilizar o token](#como-utilizar-o-token-nas-apis-inter)

### Como utilizar o token nas APIs Inter

- URL: https://developers.inter.co/docs/configurando-postman-testes/como-utilizar-token-apis-inter
- O que tem: após gerar o token, como enviar `Authorization: Bearer` nas demais requisições.
- Relacionado: [Como gerar token](#como-gerar-um-token-oauth) · [Referências](#referencias-openapi)

---

## Guias — Webhooks

Categoria: [https://developers.inter.co/docs/category/webhooks](https://developers.inter.co/docs/category/webhooks)

### O que é um Webhook

- URL: https://developers.inter.co/docs/webhooks/o-que-e-webhooks
- O que tem: conceito — Inter notifica o sistema parceiro em eventos (pago, cancelado, etc.).
- Relacionado: [Como configurar](#como-configurar-um-webhook) · webhooks em [Bolepix](#bolepix--webhook) · [Pix](#pix--webhook) · [Banking](#banking--webhooks)

### Como configurar um webhook

- URL: https://developers.inter.co/docs/webhooks/como-config-webhooks
- O que tem: passos para cadastrar webhook na integração.
- Relacionado: [Validar URL](#validar-webhook-pela-url) · [Callback server](#criando-um-servidor-para-receber-os-callbacks) · specs PUT webhook

### Validar webhook pela URL

- URL: https://developers.inter.co/docs/webhooks/validar-url-do-webhook
- O que tem: ferramenta do portal para validar se a URL do webhook recebe callbacks corretamente.
- Relacionado: [Como configurar](#como-configurar-um-webhook) · [Erros](#erros-status-code)

### Criando um servidor para receber os callbacks

- URL: https://developers.inter.co/docs/webhooks/callback-webhook
- O que tem: exemplo de servidor que recebe callbacks do Inter.
- Relacionado: [Servidor Webhook Java](#servidor-webhook-dedicado-java) · [Como configurar](#como-configurar-um-webhook)

### Servidor Webhook dedicado Java

- URL: https://developers.inter.co/docs/webhooks/servidor-webhook-dedicado-java
- O que tem: projeto de referência de servidor webhook dedicado em Java.
- Relacionado: [SDKs](#apendice--sdks) · [Callbacks](#criando-um-servidor-para-receber-os-callbacks)

---

## Guias — CNAB

Categoria / manuais: [https://developers.inter.co/docs/cnab/manuais](https://developers.inter.co/docs/cnab/manuais)

### Manuais CNAB

- URL: https://developers.inter.co/docs/cnab/manuais
- O que tem: manuais FEBRABAN/CNAB (ex.: Pagamentos CNAB 240); montagem de remessa/retorno.
- Relacionado: [Validador](#validador-de-layout-cnab) · [FAQ CNAB](#duvidas-frequentes)

### Validador de layout CNAB

- URL: https://developers.inter.co/docs/cnab/validador
- O que tem: upload/validação de arquivo CNAB; aponta campos incorretos do layout.
- Relacionado: [Manuais](#manuais-cnab) · [FAQ: validar layout](#duvidas-frequentes)

---

## Guias — Sandbox

Categoria: [https://developers.inter.co/docs/sandbox](https://developers.inter.co/docs/sandbox)

### O que é Sandbox

- URL: https://developers.inter.co/docs/sandbox/sobre-este-portal
- O que tem: ambiente de testes; disponível **8h–20h, seg–sex**; dados fictícios.
- Relacionado: [Como criar no Sandbox](#como-criar-uma-integracao-no-sandbox) · [Como testar](#como-realizar-uma-integracao-no-sandbox) · bases sandbox nas [Referências](#referencias-openapi)

### Como criar uma integração no Sandbox

- URL: https://developers.inter.co/docs/sandbox/como-criar-uma-aplicacao
- O que tem: criar integração de teste no Sandbox (mesmo modelo de credenciais/cert).
- Relacionado: [Criar em produção](#como-criar-uma-integracao) · [Postman](#guias--postman)

### Como realizar uma integração no Sandbox

- URL: https://developers.inter.co/docs/sandbox/como-testar-aplicacao
- O que tem: fluxo de teste ponta a ponta no Sandbox.
- Relacionado: endpoints `*Sandbox` em [Pix](#pix) · [Bolepix](#cobranca-bolepix-v3) · [Pix Automático](#pix-automatico)

UI auxiliar do portal (não é doc MDX):

- https://developers.inter.co/sandbox/ — entrada do ambiente
- https://developers.inter.co/sandbox/create-integration/ — criar integração
- https://developers.inter.co/sandbox/my-integrations/ — listar integrações

---

## Referências OpenAPI

Páginas Redoc no portal. Specs espelho (YAML): `https://developers.inter.co/redocusaurus/<arquivo>.yaml`.

### Token

- URL: https://developers.inter.co/references/token
- YAML: https://developers.inter.co/redocusaurus/swagger-token-yaml.yaml
- Title: Autenticação OAuth
- Servers: `…/oauth/v2` (prod + sandbox)

| Method | Path | Summary |
|---|---|---|
| POST | `/token` | Obter token oAuth |

- Relacionado: [OAuth 2.0](#oauth-20) · [mTLS](#autenticacao-mtls) · [Postman token](#como-gerar-um-token-oauth) · [Erros 401/403](#erros-status-code)

---

### Cobrança Bolepix (v3)

- URL: https://developers.inter.co/references/cobranca-bolepix
- YAML: https://developers.inter.co/redocusaurus/swagger-cobranca-bolepix-yaml.yaml
- Title: API Cobrança (Boleto com Pix)
- Servers: `…/cobranca/v3` (prod + sandbox)
- **Usar esta** para boleto+Pix. Boleto v2 descontinuado — ver [Legado cobranca v2](#aviso-legado--api-cobranca-boleto-v2) e changelog [18/05/2026](https://developers.inter.co/changelog/18/05/2026).

#### Bolepix — cobranças

| Method | Path | Summary |
|---|---|---|
| GET | `/cobrancas` | Recuperar coleção de cobranças |
| POST | `/cobrancas` | Emitir cobrança |
| GET | `/cobrancas/{codigoSolicitacao}` | Recuperar cobrança |
| PATCH | `/cobrancas/{codigoSolicitacao}` | Editar cobrança |
| GET | `/cobrancas/edicao/{codigoEdicao}` | Consultar status da edição da cobrança |
| GET | `/cobrancas/{codigoSolicitacao}/pdf` | Recuperar cobrança em PDF |
| POST | `/cobrancas/{codigoSolicitacao}/cancelar` | Cancelar cobrança |
| GET | `/cobrancas/sumario` | Recuperar sumário de cobranças |
| POST | `/cobrancas/{codigoSolicitacao}/pagar` | Pagar cobrança (Sandbox) |

#### Bolepix — webhook

| Method | Path | Summary |
|---|---|---|
| PUT | `/cobrancas/webhook` | Criar ou editar um webhook |
| GET | `/cobrancas/webhook` | Obter webhook cadastrado |
| DELETE | `/cobrancas/webhook` | Excluir webhook |
| GET | `/cobrancas/webhook/callbacks` | Consulta de callbacks enviados |
| POST | `/webhook/callbacks/retry` | Reenviar callbacks |

- Relacionado: [Guias Webhooks](#guias--webhooks) · [FAQ migração / QR Code](#duvidas-frequentes) · [Pix](#pix) (cobrança pura Pix, outro produto)

---

### Banking

- URL: https://developers.inter.co/references/banking
- YAML: https://developers.inter.co/redocusaurus/swagger-banking-yaml.yaml
- Title: API Banking
- Servers: `…/banking/v2` (prod + sandbox)

#### Banking — extrato / saldo

| Method | Path | Summary |
|---|---|---|
| GET | `/extrato` | Consultar extrato |
| GET | `/extrato/exportar` | Recuperar extrato em PDF |
| GET | `/extrato/completo` | Consultar extrato enriquecido |
| GET | `/saldo` | Consultar saldo |

#### Banking — pagamentos (boleto/DARF/lote)

| Method | Path | Summary |
|---|---|---|
| POST | `/pagamento` | Incluir pagamento com código de barras |
| GET | `/pagamento` | Buscar pagamentos |
| POST | `/pagamento/darf` | Incluir pagamento de DARF |
| GET | `/pagamento/darf` | Buscar pagamentos de DARF |
| POST | `/pagamento/lote` | Incluir pagamentos em lote |
| GET | `/pagamento/lote/{idLote}` | Buscar lote de pagamentos |
| DELETE | `/pagamento/{codigoTransacao}` | Cancelar agendamento do pagamento |

#### Banking — Pix pagamento (saída)

| Method | Path | Summary |
|---|---|---|
| POST | `/pix` | Incluir Pagamento Pix |
| GET | `/pix/{codigoSolicitacao}` | Consultar Pagamento Pix |

#### Banking — webhooks

| Method | Path | Summary |
|---|---|---|
| PUT | `/webhooks/{tipoWebhook}` | Criar webhook |
| GET | `/webhooks/{tipoWebhook}` | Obter webhook cadastrado |
| DELETE | `/webhooks/{tipoWebhook}` | Excluir webhook |
| GET | `/webhooks/{tipoWebhook}/callbacks` | Consultar callbacks |
| POST | `/webhooks/{tipoWebhook}/callbacks/retry` | Reenviar callbacks |

- Relacionado: [Guias Webhooks](#guias--webhooks) · [FAQ extrato / EndToEndId](#duvidas-frequentes) · [Pix](#pix) (recebimento ≠ Code ≠ banking Pix saída)

---

### Pix

- URL: https://developers.inter.co/references/pix
- YAML: https://developers.inter.co/redocusaurus/swagger-api-pix-yaml.yaml
- Title: API Pix
- Servers: `…/pix/v2` (prod + sandbox)

#### Pix — cob (cobrança imediata)

| Method | Path | Summary |
|---|---|---|
| PUT | `/cob/{txid}` | Criar cobrança imediata com txid |
| PATCH | `/cob/{txid}` | Revisar cobrança imediata |
| GET | `/cob/{txid}` | Consultar cobrança imediata |
| POST | `/cob` | Criar cobrança imediata |
| GET | `/cob` | Consultar lista de cobranças imediatas |
| POST | `/cob/pagar/{txid}` | Pagar Pix de cobrança imediata (Sandbox) |
| POST | `/sandbox/cob/pagamento` | Pagar cobrança imediata utilizando QRCode (Sandbox) |

#### Pix — cobv (cobrança com vencimento)

| Method | Path | Summary |
|---|---|---|
| PUT | `/cobv/{txid}` | Criar cobrança com vencimento |
| PATCH | `/cobv/{txid}` | Revisar cobrança com vencimento |
| GET | `/cobv/{txid}` | Consultar cobrança com vencimento |
| GET | `/cobv` | Consultar lista de cobranças com vencimento |
| POST | `/cobv/pagar/{txid}` | Pagar Pix de cobrança com vencimento (Sandbox) |
| POST | `/sandbox/cob/pagamento` | Pagar cobrança com vencimento utilizando QRCode (Sandbox) |

#### Pix — lotecobv

| Method | Path | Summary |
|---|---|---|
| PUT | `/lotecobv/{id}` | Criar/Alterar lote de cobranças com vencimento |
| PATCH | `/lotecobv/{id}` | Revisar cobranças específicas dentro de um lote |
| GET | `/lotecobv/{id}` | Consultar um lote de cobranças com vencimento |
| GET | `/lotecobv/{id}/sumario` | Sumário de um lote de cobranças com vencimento |
| GET | `/lotecobv/{id}/situacao/{situacao}` | Consultar cobranças de um lote por situação |
| GET | `/lotecobv` | Consultar lotes de cobranças com vencimento |

#### Pix — loc (locations)

| Method | Path | Summary |
|---|---|---|
| POST | `/loc` | Criar location do payload |
| GET | `/loc` | Consultar locations cadastradas |
| GET | `/loc/{id}` | Recuperar location do payload |
| DELETE | `/loc/{id}/txid` | Desvincular uma cobrança de uma location |

#### Pix — recebimentos / devolução

| Method | Path | Summary |
|---|---|---|
| GET | `/pix/{e2eId}` | Consultar pix |
| GET | `/pix` | Consultar pix recebidos |
| PUT | `/pix/{e2eId}/devolucao/{id}` | Solicitar devolução |
| GET | `/pix/{e2eId}/devolucao/{id}` | Consultar devolução |

#### Pix — webhook

| Method | Path | Summary |
|---|---|---|
| PUT | `/webhook/{chave}` | Criar webhook |
| GET | `/webhook/{chave}` | Obter webhook cadastrado |
| DELETE | `/webhook/{chave}` | Excluir webhook |
| GET | `/webhook/callbacks` | Consultar callbacks |
| POST | `/webhook/callbacks/retry` | Reenviar callbacks |

- Relacionado: [Pix Automático](#pix-automatico) · [Bolepix](#cobranca-bolepix-v3) · [Sandbox](#guias--sandbox) · [Guias Webhooks](#guias--webhooks)

---

### Pix Automático

- URL: https://developers.inter.co/references/pix-automatico
- YAML: https://developers.inter.co/redocusaurus/swagger-api-pix-automatico-yaml.yaml
- Title: API Pix Automático
- Servers: `…/pix/v2` (prod + sandbox) — mesmo host Pix; paths de recorrência

#### Pix Automático — recorrência (`rec`)

| Method | Path | Summary |
|---|---|---|
| POST | `/rec` | Criar recorrência |
| GET | `/rec` | Consultar lista de recorrências |
| GET | `/rec/{idRec}` | Consultar recorrência |
| PATCH | `/rec/{idRec}` | Revisar/Cancelar recorrência |
| PATCH | `/sandbox/rec/{idRec}/status` | Alterar status da recorrência (Sandbox) |
| POST | `/sandbox/cob/pagamento` | Pagar e autorizar QRCode de recorrência com cobrança vinculada (Sandbox) |

#### Pix Automático — solicitação (`solicrec`)

| Method | Path | Summary |
|---|---|---|
| POST | `/solicrec` | Criar solicitação de confirmação de recorrência |
| GET | `/solicrec/{idSolicRec}` | Consultar solicitação de recorrência |
| PATCH | `/solicrec/{idSolicRec}` | Revisar solicitação de recorrência |
| PATCH | `/sandbox/solicrec/{idRec}/status` | Alterar status da solicitação de recorrência (Sandbox) |

#### Pix Automático — cobrança recorrente (`cobr`)

| Method | Path | Summary |
|---|---|---|
| POST | `/cobr` | Criar cobrança recorrente |
| GET | `/cobr` | Consultar lista de cobranças recorrentes |
| POST | `/cobr/{txid}/retentativa/{data}` | Solicitar retentativa de cobrança |
| GET | `/cobr/{txid}` | Consultar cobrança recorrente |
| PUT | `/cobr/{txid}` | Criar cobrança recorrente com TxId |
| PATCH | `/cobr/{txid}` | Cancelar cobrança recorrente |
| PATCH | `/sandbox/cobr/{txId}/status` | Alterar status da cobrança recorrente (Sandbox) |
| POST | `/sandbox/cobr/pagamento` | Pagar cobrança recorrente (Sandbox) |

#### Pix Automático — location (`locrec`)

| Method | Path | Summary |
|---|---|---|
| POST | `/locrec` | Criar location do payload |
| GET | `/locrec` | Consultar locations cadastradas |
| GET | `/locrec/{id}` | Recuperar location do payload |
| DELETE | `/locrec/{id}/idRec` | Desvincular uma recorrência de uma location |

#### Pix Automático — webhooks

| Method | Path | Summary |
|---|---|---|
| PUT | `/webhookrec` | Criar WebhookRec |
| GET | `/webhookrec` | Consultar Webhook cadastrado |
| DELETE | `/webhookrec` | Excluir Webhook |
| PUT | `/webhookcobr` | Criar WebhookCobR |
| GET | `/webhookcobr` | Consultar Webhook cadastrado |
| DELETE | `/webhookcobr` | Excluir Webhook |

- Relacionado: [Pix Cob/CobV](#pix) · [Guias Webhooks](#guias--webhooks) · [Sandbox](#guias--sandbox)

---

### Forum

- URL: https://developers.inter.co/references/forum
- YAML: https://developers.inter.co/redocusaurus/swagger-api-forum-yaml.yaml
- Title: API Forum (Gerenciamento de publicações no Forum)
- Servers: `…/forum/v1` (prod + sandbox)
- **Não é API bancária** — CRUD de publicações do fórum da comunidade.

| Method | Path | Summary |
|---|---|---|
| GET | `/publication` | Obter publicação pelo ID |
| POST | `/publication` | Criar publicação |
| PUT | `/publication` | Editar publicação |
| DELETE | `/publication` | Deletar publicação |
| GET | `/publications` | Obter lista de publicações |
| POST | `/media/upload-url` | Gerar URL para upload de arquivo de mídia |

---

### Aviso legado — API Cobrança (boleto v2)

- YAML ainda publicado: https://developers.inter.co/redocusaurus/swagger-cobranca-yaml.yaml
- Title: API Cobrança — server `…/cobranca/v2` (e historicamente `…/boletos/v2`)
- **Descontinuada.** Migrar para [Cobrança Bolepix v3](#cobranca-bolepix-v3).
- Changelog: https://developers.inter.co/changelog/18/05/2026
- FAQ: “O que muda ao migrar da API Cobrança para a API Cobrança (Boleto com Pix)?” — [Dúvidas frequentes](#duvidas-frequentes)

Operações legado (não usar em código novo):

| Method | Path | Summary |
|---|---|---|
| POST | `/boletos` | Emitir boleto de cobrança |
| GET | `/boletos` | Recuperar coleção de boletos |
| GET | `/boletos/sumario` | Recuperar sumário de boletos |
| GET | `/boletos/{nossoNumero}` | Recuperar boleto detalhado |
| GET | `/boletos/{nossoNumero}/pdf` | Recuperar boleto em PDF |
| POST | `/boletos/{nossoNumero}/cancelar` | Cancelar boleto |
| PUT/GET/DELETE | `/boletos/webhook` | Webhook legado |
| GET | `/boletos/webhook/callbacks` | Consultar callbacks |

---

## Dúvidas frequentes

- URL: https://developers.inter.co/duvidas-frequentes
- O que tem: FAQ do portal (APIs + CNAB/VAN). Tópicos observados na coleta:

**Integração / auth / APIs**

- Como criar uma integração?
- Como gerar um token OAuth?
- Como obter o ClientId e ClientSecret utilizados na geração do token?
- Qual é a duração de um token gerado e como ele afeta o número de requisições?
- Posso criar uma API para uma conta MEI ou PF?
- Qual o limite gratuito para emissões via API?
- Como configurar um Webhook?
- Tenho 1 único servidor de webhook e gostaria de receber callbacks de várias contas. É possível?
- Como verificar o status de um Pix Cobrança via API?
- Quando o atributo “EndToEndId” é retornado na inclusão de um pagamento de Pix e como posso realizar a conciliação?
- Como configuro a quantidade de itens retornados na consulta extrato via API?
- Como gerar o QR Code de uma cobrança emitida pela API Pix ou API Cobrança (Boleto com Pix)?
- O que muda ao migrar da API Cobrança para a API Cobrança (Boleto com Pix)?

**CNAB / VAN**

- O que é CNAB? / arquivo de remessa? / arquivo de retorno?
- Quais layouts de CNAB o Inter possui / diferença CNAB 240 vs 400
- Como validar o layout do meu arquivo?
- Como ter acesso aos manuais do CNAB?
- Como importar remessa/retorno CNAB 240 e 400
- Como solicitar faixa bancária para carteira 110?
- O que é VAN Bancária? / quais integrações / como solicitar / produtos via VAN

- Relacionado: [Introdução](#guias--introducao) · [CNAB](#guias--cnab) · [Bolepix](#cobranca-bolepix-v3) · [Pix](#pix) · [Banking](#banking) · [Erros](#erros-status-code)

---

## Erros Status Code

- URL: https://developers.inter.co/erros-status-code
- O que tem: troubleshooting por código HTTP (mensagens típicas do Inter):

| Código | Tópicos no portal |
|---|---|
| 400 | Sem mensagem de Erro |
| 401 | Login/senha inválido no Token OAuth; Login/senha inválido nas APIs; Token inválido; Acesso negado |
| 403 | Faltando escopos necessários |
| 406 | Sem mensagem de Erro |
| 422 | Erro ao processar a requisição |
| 429 | Sem mensagem de Erro (rate limit) |
| 500 | Erro Interno no Token OAuth |

- Relacionado: [Token](#token) · [OAuth / mTLS](#oauth-20) · [FAQ](#duvidas-frequentes) · escopos na criação da [integração](#como-criar-uma-integracao)

---

## Apêndice — SDKs

Entrada: https://developers.inter.co/docs/sdks/sdk-intro

| Página | URL | Nota |
|---|---|---|
| Sobre o Inter SDK | https://developers.inter.co/docs/sdks/sdk-intro | O que é o SDK oficial |
| SDK Java | https://developers.inter.co/docs/sdks/sdk-java | Pré-requisitos + uso |
| SDK C# | https://developers.inter.co/docs/sdks/sdk-csharp | Pré-requisitos + uso |
| SDK PHP | https://developers.inter.co/docs/sdks/sdk-php | Pré-requisitos + uso |
| SDK Python | https://developers.inter.co/docs/sdks/sdk-python | Pré-requisitos + uso |

No dpasis_api a integração deve seguir o padrão **Gateway** ([Rule 9](../rules/architecture-dpasis.mdc) / skill `gateway-adapters`), não o SDK Java/C# do Inter — os SDKs servem de referência de fluxos/contratos.

---

## Apêndice — Changelog

- Lista: https://developers.inter.co/changelog
- Feeds: `/changelog/rss.xml`, `/changelog/atom.xml`, `/changelog/feed.json`
- Entrada crítica cobrança: https://developers.inter.co/changelog/18/05/2026 (Boletos V2 → Cobrança V3 / Bolepix)

---

## Como o agente deve usar este arquivo

1. Identificar o fluxo no [Mapa rápido](#mapa-rapido-fluxo--onde-ler).
2. Ler o **guia** correspondente (auth, webhook, sandbox) se for first-time no tema.
3. Abrir a **página de referência** + YAML se precisar de path/método/summary exatos; **não** inventar endpoints.
4. Cruzar [FAQ](#duvidas-frequentes) / [Erros](#erros-status-code) quando houver dúvida de regra ou status HTTP.
5. Só então desenhar gateway/use case no Nest seguindo as rules do repositório.

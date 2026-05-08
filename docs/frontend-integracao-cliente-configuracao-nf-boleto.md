# Integração frontend — Configuração de NF e boleto (`client-invoice-config`)

## Introdução

Este documento detalha o contrato HTTP da configuração faturamento/NF/boleto do cliente (recurso **Client Invoice Config**), com foco no campo `**dueDateType`** e nos dois modos mutuamente exclusivos: **dia de vencimento** vs **prazo  de faturamento**.

Serve de guia para montar formulários condicionais e payloads de **create**/**edit**.

**Referência OpenAPI:** Swagger em `/swagger`, tag **Clientes - Configuração NF e Boleto**.

## Base URL admin


| Item         | Valor                                   |
| ------------ | --------------------------------------- |
| Prefixo      | `/admin/client-invoice-config`          |
| Autenticação | JWT **admin** (`AccountRole.ADMIN`)     |
| Leitura      | Claim `**CLIENT_INVOICE_CONFIG_READ`**  |
| Escrita      | Claim `**CLIENT_INVOICE_CONFIG_WRITE**` |


### Rotas


| Método   | Caminho                                         | Uso                   |
| -------- | ----------------------------------------------- | --------------------- |
| `POST`   | `/admin/client-invoice-config`                  | Criar configuração    |
| `GET`    | `/admin/client-invoice-config/client/:clientId` | Buscar por `clientId` |
| `PATCH`  | `/admin/client-invoice-config/:id`              | Editar                |
| `DELETE` | `/admin/client-invoice-config/:id`              | Excluir               |


**Content-Type:** `application/json` em create/edit.

## Resumo das mudanças (modelo de dados)

O agregado passa a expor `**dueDateType`**, `**dueDateDay**`, `**dueMonth**` e `**deadlineDays**` como **campos irmãos** no JSON (sem objeto aninhado único de “config de vencimento”). O backend **persiste sempre os quatro campos no modelo**, mas **preenche apenas o par coerente com `dueDateType`**; o outro modo fica com `null` na leitura.


| `dueDateType` (valor da API) | Significado                                                                                |
| ---------------------------- | ------------------------------------------------------------------------------------------ |
| `Dia de vencimento`          | Vencimento em **dia do mês** + **mês** (calendário), com regras em relação a `emissionDay` |
| `Prazo faturamento`          | Vencimento por **N dias úteis/corridos** após a emissão (campo `deadlineDays`)             |


Os literais acima são exatamente os valores do enum exposto na API (strings em português).

## Regra central para o frontend

1. `**dueDateType` é obrigatório** no create e define qual “pacote” de campos o usuário preenche.
2. **Nunca trate `dueDateDay` / `dueMonth` / `deadlineDays` como opcionais de negócio só porque o DTO marca alguns como opcionais na validação superficial:** o domínio exige combinações corretas conforme o tipo.
3. Na **resposta** (`ClientInvoiceConfigDto`), espere:
  - modo **Dia de vencimento:** `dueDateDay` e `dueMonth` preenchidos, `deadlineDays: null`;
  - modo **Prazo faturamento:** `deadlineDays` preenchido, `dueDateDay: null`, `dueMonth: null`.

---

## Cenário 1 — `dueDateType: "Dia de vencimento"`

**Intenção:** definir o vencimento por **dia do calendário** (`dueDateDay`) e **mês** (`dueMonth`), considerando o **dia de emissão** (`emissionDay`) já obrigatório no mesmo payload.

### Campos necessários neste cenário


| Campo          | Obrigatório       | Descrição                                                     |
| -------------- | ----------------- | ------------------------------------------------------------- |
| `dueDateType`  | Sim               | Valor fixo: `"Dia de vencimento"`                             |
| `emissionDay`  | Sim               | Dia da emissão (1–31), já obrigatório no create               |
| `dueDateDay`   | **Sim (negócio)** | Dia do vencimento (1–31)                                      |
| `dueMonth`     | **Sim (negócio)** | Mês do vencimento (1–12)                                      |
| `deadlineDays` | **Não**           | Enviar `null` ou omitir; o backend grava `deadlineDays: null` |


### Regras de negócio (validação após o JSON)

Além de faixas (dia 1–31, mês 1–12), o backend exige:

1. `**dueDateDay` deve ser estritamente maior que `emissionDay`** (não pode ser igual).
2. **Intervalo mínimo:** `dueDateDay - emissionDay >= 15` (pelo menos 15 dias após o dia de emissão).

Se violar (1) ou (2), a API responde **400** com mensagem em português (ver secção Erros).

### Exemplo mínimo (trecho do body de create)

```json
{
  "dueDateType": "Dia de vencimento",
  "emissionDay": 5,
  "dueDateDay": 25,
  "dueMonth": 3,
  "deadlineDays": null
}
```

---

## Cenário 2 — `dueDateType: "Prazo faturamento"`

**Intenção:** definir o vencimento como `**deadlineDays`** dias após a emissão (prazo), usando `emissionDay` como referência de calendário da emissão.

### Campos necessários neste cenário


| Campo          | Obrigatório       | Descrição                                                 |
| -------------- | ----------------- | --------------------------------------------------------- |
| `dueDateType`  | Sim               | Valor fixo: `"Prazo faturamento"`                         |
| `emissionDay`  | Sim               | Dia da emissão (1–31)                                     |
| `deadlineDays` | **Sim (negócio)** | Inteiro **≥ 1** (quantidade de dias do prazo)             |
| `dueDateDay`   | **Não**           | Será armazenado como `null`; pode omitir ou enviar `null` |
| `dueMonth`     | **Não**           | Será armazenado como `null`; pode omitir ou enviar `null` |


### Exemplo mínimo (trecho do body de create)

```json
{
  "dueDateType": "Prazo faturamento",
  "emissionDay": 10,
  "deadlineDays": 30,
  "dueDateDay": null,
  "dueMonth": null
}
```

---

## Create vs Edit (`PATCH`)

- **Create** (`CreateClientInvoiceConfigInputDto`): todos os campos de negócio do create continuam obrigatórios conforme já documentado no Swagger (além dos cenários acima): `clientId`, `type`, `generateNf`, `emissionDay`, `billingAddressId`, `bankId`, `autoProtestBoleto`, etc.
- **Edit** (`EditClientInvoiceConfigInputDto`): é um `**PartialType`** do create **sem `clientId`**. Qualquer campo pode ser enviço parcialmente, mas ao **trocar `dueDateType`** o frontend deve enviar o **conjunto completo coerente** com o novo modo (ex.: ao mudar para **Prazo faturamento**, incluir `deadlineDays` válido e zere/omitir dia/mês de vencimento conforme UX).

---

## Resposta de leitura (`GET` por cliente)

O objeto retornado inclui sempre:

- `dueDateType`
- `dueDateDay`, `dueMonth`, `deadlineDays` (dois deles serão `null`, conforme o modo ativo)

Use isso para **pré-preencher** o formulário e escolher qual bloco de inputs exibir.

---

## Autenticação e claims


| Operação                  | Claim                         |
| ------------------------- | ----------------------------- |
| `GET …/client/:clientId`  | `CLIENT_INVOICE_CONFIG_READ`  |
| `POST`, `PATCH`, `DELETE` | `CLIENT_INVOICE_CONFIG_WRITE` |


---

## Erros / UX


| Status        | Quando                                                                                                                      |
| ------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `400`         | Validação `class-validator` (tipos, enums, limites de dia/mês no payload)                                                   |
| `400`         | Regras de vencimento: vencimento menor ou igual à emissão; ou intervalo menor que 15 dias entre emissão e dia de vencimento |
| `400`         | `deadlineDays` inválido para modo prazo (inteiro positivo esperado na regra de domínio)                                     |
| `400`         | Tipo de vencimento inválido no domínio (enum fora do esperado)                                                              |
| `404`         | Config não encontrada (por id ou fluxo equivalente)                                                                         |
| `409`         | Config já existe para o cliente (conflito no create)                                                                        |
| `403` / `401` | Falta de claim ou token                                                                                                     |


O corpo de erro segue o padrão global (`message` string).

---

## Checklist prático para o frontend

1. Tratar `dueDateType` como **radio / select** com valores literais `**Dia de vencimento`** e `**Prazo faturamento**` (não usar slugs em inglês no JSON).
2. Mostrar **apenas** os inputs do modo selecionado; validar no client os obrigatórios condicionais descritos nas tabelas.
3. Ao persistir modo **Dia de vencimento**, garantir `dueDateDay > emissionDay` e `dueDateDay - emissionDay >= 15` antes do submit (melhor UX; o backend continua sendo a fonte da verdade).
4. No modo **Prazo faturamento**, garantir `deadlineDays >= 1`.
5. Após `GET`, hidratar o formulário a partir de `dueDateType` + campos não nulos.
6. Tipar/enums no app a partir do OpenAPI, conferindo que strings coincidem com os exemplos deste documento.


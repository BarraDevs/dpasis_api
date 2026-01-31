# PERSONA.md - Especialista em Módulo de Orçamentos (ERP)

## 1. Identidade e Arquitetura do Sistema
Este documento define a estrutura de conhecimento para o módulo de **Gestão de Orçamentos**.
**Conceito Chave:** O Orçamento atua como um **Nexo (Hub)**. Ele não detém os dados mestres; ele cria relações entre entidades já existentes no ERP (Clientes, Itens, Transportadoras e Vendedores).

---

## 2. Mapa de Dados e Campos (Payload Specs)

### Etapa 1: Identificação (Vínculo de Cliente)
*Objetivo:* Definir quem está comprando. O sistema deve priorizar a busca de um cliente existente (`clientId`). O formulário visual serve como um "Cadastro Rápido" (On-the-fly) caso o cliente não exista.

**Campos Obrigatórios (Lógica de Seleção):**
* `clientId` (UUID/Int): ID do cliente se já cadastrado.

**Cadastro do cliente**
* Já existe um usecase para isso no módulo `client`.

---

### Etapa 2: Composição (Itens do Pedido)
*Objetivo:* Popular o carrinho. Itens **não são criados aqui**; eles são buscados do catálogo mestre (`Products` ou `Services`) e vinculados.

**Entidade: Item do Orçamento**
* **Vínculo (Lookup):**
    * `itemType` (Enum: 'PRODUCT' | 'SERVICE') - Define em qual tabela buscar.
    * `productId` (UUID/Int, condicional) - Se for Produto.
    * `serviceId` (UUID/Int, condicional) - Se for Serviço.
* **Transacional (Valores da negociação):**
    * `quantidade` (Decimal/Int)
    * `valorUnitario` (Decimal) - *Puxa o padrão do cadastro, mas permite override.*
    * `desconto` (Decimal/Percentual)
    * `valorTotal` (Calculado: (Qtd * Unit) - Desc).

---

### Etapa 3: Dados do Orçamento (Logística e Regras)
*Objetivo:* Definir como a entrega e o pagamento ocorrem. Conecta com o módulo de Logística.

**Campos de Logística:**
* `tipoFrete` (Enum: 'CIF', 'FOB', 'SEM_FRETE', 'TERCEIROS')
* `shipperId` (UUID/Int): ID da Transportadora selecionada da base.
* `valorFrete` (Decimal): Custo imputado ao orçamento.

**Campos Comerciais/Administrativos:**
* `processoComercial` (String/Código): Número de referência interna ou do cliente.
* `observacoes` (Text/Markdown): Notas livres para impressão na proposta.
* `salespersonId` (UUID/Int): ID do usuário logado (Vendedor) - *Automático via Token/Sessão.*

---

## 3. Fluxo de Navegação e UX (Atualizado)

### A. O Wizard de Criação (Funil)
1.  **Seleção de Cliente:**
    * *UX:* O usuário vê um campo de busca "Selecionar Cliente". Se encontrar, preenche o card. Se não, preenche o formulário completo para criar o `clientId` na hora.
2.  **Inclusão de Itens:**
    * *UX:* Busca inteligente (Nome/Código). Ao selecionar, o sistema recupera o preço base, mas o vendedor pode negociar (alterar preço/desconto) especificamente para este orçamento.
3.  **Definição Logística:**
    * *UX:* Dropdown listando transportadoras cadastradas (`shippers`).

### B. Workflow de Aprovação (Pós-Venda)
Após salvar (`status: PENDING`), o orçamento entra na esteira de decisão:
1.  **Auditoria:** O gestor revisa os itens e margens.
2.  **Ação de Aprovar:**
    * Muda status para `APPROVED`.
    * Dispara gatilhos para Financeiro (Contas a Receber) e Estoque (Reserva).
3.  **Ação de Recusar:**
    * Muda status para `REJECTED`.
    * Libera pré-reserva de estoque (se houver).

---

## 4. Diretrizes Técnicas para Agentes

Ao interagir sobre este sistema, considere:

* **Integridade Referencial:** Não se pode criar um orçamento sem um `clientId` válido. Se o usuário fornecer dados brutos de um novo cliente, o agente deve entender que a ação implícita é `createClient` -> `createBudget`.
* **Imutabilidade de Fonte:** Alterar o `valorUnitario` no orçamento **não altera** o preço do produto no catálogo geral. É uma alteração escopada apenas a essa negociação.
* **Dualidade de Itens:** O cálculo de impostos deve observar o `itemType`. Serviços incidem ISS; Produtos incidem ICMS/IPI. O agente deve saber diferenciar os IDs.
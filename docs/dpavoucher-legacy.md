# DpaVoucher — Documentação Técnica

> **Finalidade deste documento:** servir como referência para futuras alterações, migrações ou integrações do sistema DpaVoucher (VB.NET + Access) para outros ambientes (ex.: NestJS + PostgreSQL/Prisma).

---

## Visão Geral

**DpaVoucher** é uma aplicação desktop Windows desenvolvida pela **DpaTec** em **Visual Basic .NET (VB.NET)** com interface gráfica WinForms. Seu propósito é gerar e gravar códigos de voucher para revendedores indicadores diretamente em um banco de dados Microsoft Access.

A lógica é equivalente ao clique de um botão: abre o banco, itera sobre os revendedores qualificados, calcula o voucher de cada um via codificação Base58 customizada e persiste o resultado de volta no banco.

---

## Stack e Ambiente

| Item | Valor |
|---|---|
| Linguagem | Visual Basic .NET (VB.NET) |
| Framework | .NET Framework 4.5.2 |
| Tipo de aplicação | Windows Forms (WinExe) |
| IDE alvo | Visual Studio 2015 (ToolsVersion 14.0) |
| Plataforma | Windows only (AnyCPU) |
| Empresa | DpaTec |
| Versão | 1.0.0.0 |

---

## Estrutura de Arquivos

```
DpaVoucher/
├── DpaVoucher.sln                         # Solution do Visual Studio
└── DpaVoucher/
    ├── DpaVoucher.vbproj                  # Projeto VB.NET
    ├── App.config                         # Configuração de runtime (.NET 4.5.2)
    ├── Form1.vb                           # Lógica principal (único arquivo de código)
    ├── Form1.Designer.vb                  # Layout da UI (gerado pelo designer)
    ├── Form1.resx                         # Recursos do formulário
    ├── sale_tag_discount_voucher_icon_227316.ico  # Ícone da aplicação
    ├── My Project/
    │   ├── AssemblyInfo.vb                # Metadados do assembly
    │   ├── Application.Designer.vb        # Bootstrap do WinForms
    │   ├── Resources.Designer.vb          # Acesso a recursos embutidos
    │   └── Settings.Designer.vb           # Configurações de usuário
    ├── Resources/
    │   ├── voucher2.png                   # Imagem exibida no botão
    │   └── discount-voucher_17776154.png  # Imagem de marketing
    └── bin/Debug/
        ├── dpasis.ini                     # Configuração de caminho do banco
        ├── Dpasis.mdb                     # Banco de dados Microsoft Access (~257 MB)
        ├── voucher/
        │   ├── voucher.csv                # Export dos vouchers gerados
        │   └── VOUCHER.DBF                # Export em formato dBase
        └── DpaVoucher.exe                 # Executável compilado
```

---

## Dependências

### Assemblies .NET (todas nativas — sem pacotes NuGet)

| Assembly | Uso |
|---|---|
| `System.Data` / `System.Data.OleDb` | Conexão e queries no banco Access |
| `System.IO` | Leitura do arquivo `dpasis.ini` |
| `System.Text` | Codificação UTF-8 para o algoritmo Base58 |
| `System.Windows.Forms` | Interface gráfica (formulário, botão, label, MessageBox) |
| `System.Drawing` | Imagens e ícone da janela |
| `Microsoft.VisualBasic` | Biblioteca base do VB.NET |
| `System.Xml.Linq` | Declarado no projeto, não utilizado diretamente |
| `System.Net.Http` | Declarado no projeto, não utilizado diretamente |

### Dependência de sistema (não gerenciada)

- **Microsoft Jet OLEDB 4.0** — provider COM instalado junto ao Microsoft Access ou ao Access Database Engine. É a ponte entre o código .NET e o arquivo `.mdb`. **Funciona apenas em Windows 32-bit ou com configuração específica em 64-bit.**

---

## Configuração — `dpasis.ini`

Arquivo de texto simples localizado na mesma pasta do executável (`Application.StartupPath`). A **primeira linha** contém o caminho absoluto para a pasta onde o banco `Dpasis.mdb` reside:

```
D:\Projetos\Voucher\dpavoucher\DpaVoucher\DpaVoucher\bin\Debug
Painel = Sim
```

O código lê apenas a linha 0 e faz `Path.Combine(pasta, "Dpasis.mdb")` para montar o caminho final. As demais linhas são ignoradas pelo sistema de voucher (podem ser usadas por outros módulos do DpaSis).

---

## Banco de Dados — `Dpasis.mdb`

Banco **Microsoft Access** (formato Jet 4.0 / `.mdb`). A tabela relevante para o módulo de vouchers é:

### Tabela `CadRevendas`

| Campo | Tipo | Descrição |
|---|---|---|
| `Codigo` | VARCHAR(10) | Chave primária — código único do revendedor |
| `Razao` | VARCHAR(255) | Razão social |
| `CNPJ` | VARCHAR(20) | CNPJ do revendedor |
| `RevFabricante` | Boolean (0/1) | Flag: é revendedor indicador/fabricante |
| `Voucher` | VARCHAR(100) | Campo atualizado pela aplicação com o código gerado |

A query de leitura filtra apenas `RevFabricante = 1`, ou seja, somente os revendedores indicadores recebem voucher.

---

## Interface Gráfica (UI)

Janela única minimalista — **284 × 150 pixels**, centralizada na tela, sem botão de maximizar:

| Componente | Descrição |
|---|---|
| Título da janela | `"Dpa Voucher"` |
| `Label2` | Texto fixo: `"Revenda Indicadora"` |
| `Button1` | Ícone de voucher (`voucher2.png`) — dispara toda a lógica ao ser clicado |
| `Label1` | Instrução: `"Clique no icone para atualizar os vouchers"` |
| `Label3` | Label vazio (reservado) |

Após o processamento, um `MessageBox` exibe a contagem de vouchers gravados. Ao clicar em **OK**, a aplicação fecha automaticamente via `Application.Exit()`.

---

## Fluxo de Execução

```
Usuário clica em Button1
        │
        ▼
Lê dpasis.ini → extrai caminho da pasta do banco
        │
        ▼
Monta string de conexão OleDb (Jet 4.0)
        │
        ▼
Executa: SELECT Codigo FROM CadRevendas WHERE RevFabricante = 1
        │
        ▼
Para cada revendedor:
  ┌─────────────────────────────────────────────────────────┐
  │  input = Codigo.Trim() + DateTime.Now.Year.ToString()   │
  │  ex:  "000HU" + "2025" → "000HU2025"                    │
  │                                                         │
  │  voucher = EncodeBase58FromText(input)                  │
  │  ex:  "000HU2025" → "CAPUYMOMTZTQ"                      │
  │                                                         │
  │  UPDATE CadRevendas SET Voucher = ? WHERE Codigo = ?    │
  └─────────────────────────────────────────────────────────┘
        │
        ▼
MessageBox: "✅ {count} vouchers gravados diretamente no banco de dados!"
        │
        ▼
        OK → Application.Exit()
```

---

## Algoritmo Base58 — Implementação Customizada

> **Atenção crítica:** a implementação **não é** Base58Check (Bitcoin). É uma reimplementação direta do algoritmo Base58 padrão operando sobre bytes UTF-8, implementada manualmente no próprio `Form1.vb` sem nenhuma biblioteca externa.
>
> Em qualquer migração, **nunca usar `bs58`, `base-x` ou qualquer lib externa de Base58** — essas libs operam sobre buffers criptográficos e produzem saída incompatível com o algoritmo original.

### Alfabeto

```
123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz
```

Os caracteres ambíguos `0`, `O`, `I` e `l` são intencionalmente omitidos para evitar confusão visual em etiquetas impressas.

### Mecânica do algoritmo

1. Converte a string de entrada para bytes UTF-8
2. Conta zeros à esquerda (leading zero bytes) — representados como `'1'` no resultado
3. Itera sobre os bytes aplicando divisão por 58 com acúmulo de remainder (divisão longa em base 256 → base 58)
4. Cada remainder mapeia para um caractere do alfabeto, inserido no início da string resultado
5. Avança o ponteiro `start` saltando zeros que surgem durante a divisão
6. Prefixa `'1'.repeat(zeros)` para preservar os zeros iniciais

### Implementação de referência (VB.NET original — `Form1.vb`)

```vbnet
Private Shared ReadOnly Base58Alphabet As String = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"

Private Function EncodeBase58FromText(input As String) As String
    Dim bytes As Byte() = Encoding.UTF8.GetBytes(input)
    If bytes.Length = 0 Then Return String.Empty

    Dim zeros As Integer = 0
    While zeros < bytes.Length AndAlso bytes(zeros) = 0
        zeros += 1
    End While

    Dim temp As New List(Of Byte)(bytes)
    Dim encoded As New StringBuilder()
    Dim start As Integer = zeros

    While start < temp.Count
        Dim remainder As Integer = 0
        For i As Integer = start To temp.Count - 1
            Dim num As Integer = CInt(temp(i)) And &HFF
            Dim acc As Integer = remainder * 256 + num
            temp(i) = CByte(acc \ 58)
            remainder = acc Mod 58
        Next
        encoded.Insert(0, Base58Alphabet(remainder))
        While start < temp.Count AndAlso temp(start) = 0
            start += 1
        End While
    End While

    For i As Integer = 1 To zeros
        encoded.Insert(0, "1"c)
    Next

    Return encoded.ToString()
End Function
```

### Implementação de referência (TypeScript — para migração NestJS)

```typescript
const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

export function encodeBase58FromText(input: string): string {
  const bytes = Buffer.from(input, 'utf8');

  if (bytes.length === 0) return '';

  let zeros = 0;
  while (zeros < bytes.length && bytes[zeros] === 0) {
    zeros++;
  }

  const temp = Array.from(bytes);
  let result = '';
  let start = zeros;

  while (start < temp.length) {
    let remainder = 0;

    for (let i = start; i < temp.length; i++) {
      const num = temp[i] & 0xff;
      const acc = remainder * 256 + num;
      temp[i] = Math.floor(acc / 58);
      remainder = acc % 58;
    }

    result = BASE58_ALPHABET[remainder] + result;

    while (start < temp.length && temp[start] === 0) {
      start++;
    }
  }

  return '1'.repeat(zeros) + result;
}
```

### Casos de paridade obrigatórios

Qualquer reimplementação do algoritmo deve passar nestes casos antes de entrar em produção:

| Input | Voucher esperado |
|---|---|
| `000HU2025` | `CAPUYMOMTZTQ` |
| `000HV2025` | `CAPUYMUTZQ2G` |
| `000B92025` | `CAPUVJM67NIX` |
| `000012025` | `CAPUMKZCTT5A` |
| `""` (vazio) | `""` (vazio) |

---

## Tratamento de Erros

Toda a lógica do `Button1_Click` está envolvida em `Try/Catch`. Em caso de qualquer exceção (arquivo `.ini` ausente, banco inacessível, provider não instalado, etc.), um `MessageBox` exibe a mensagem de erro e o fluxo é interrompido sem fechar a aplicação.

Cenários de erro explicitamente tratados no código:

- `dpasis.ini` não encontrado → `FileNotFoundException` com mensagem descritiva
- `dpasis.ini` vazio → `Exception` genérica com mensagem descritiva

---

## Outputs Adicionais (pasta `voucher/`)

Além de gravar no banco, a pasta `bin/Debug/voucher/` contém exports estáticos gerados em algum momento:

| Arquivo | Formato | Conteúdo |
|---|---|---|
| `voucher.csv` | CSV (~38 KB) | Lista de revendedores com vouchers |
| `VOUCHER.DBF` | dBase III/IV (~88 KB) | Mesma lista em formato legado |

Esses arquivos **não são gerados pelo código atual** — provavelmente são exports manuais do Access para compatibilidade com sistemas legados que consomem `.dbf`.

---

## Limitações e Pontos de Atenção

| Limitação | Impacto |
|---|---|
| Depende do **Microsoft Jet OLEDB 4.0** | Não funciona em sistemas sem o Access Database Engine instalado; incompatível com Windows 64-bit sem configuração extra |
| **Sem transação** | Se a aplicação for encerrada à força durante o loop, parte dos registros fica atualizada e parte não |
| **Sem log** | Nenhum registro em arquivo de quais vouchers foram gerados ou sobrescritos |
| **Sem idempotência** | Rodar duas vezes no mesmo ano sobrescreve os vouchers existentes com o mesmo valor (inofensivo, mas desnecessário) |
| **Caminho hardcoded no ini** | `dpasis.ini` usa caminho absoluto da máquina de desenvolvimento — precisa ser ajustado em cada implantação |
| **Banco de ~257 MB** | O arquivo `.mdb` inclui todos os dados do sistema DpaSis, não apenas a tabela `CadRevendas` |

---

## Guia de Migração para NestJS + Prisma

### Schema Prisma equivalente

```prisma
model CadRevendas {
  Codigo        String   @id @db.VarChar(10)
  Razao         String?  @db.VarChar(255)
  CNPJ          String?  @db.VarChar(20)
  RevFabricante Boolean  @default(false)
  Voucher       String?  @db.VarChar(100)

  @@map("CadRevendas")
}
```

### Endpoint equivalente

```
POST /vouchers/generate
```

**Response 200:**
```json
{
  "gerados": 42,
  "ano": 2025,
  "mensagem": "42 vouchers gravados com sucesso."
}
```

### Equivalência de conceitos

| VB.NET original | NestJS equivalente |
|---|---|
| `dpasis.ini` | Variáveis de ambiente (`.env`) |
| `Microsoft.Jet.OLEDB.4.0` | Prisma Client + PostgreSQL/MySQL |
| `Button1_Click` | `POST /vouchers/generate` (controller) |
| `EncodeBase58FromText()` | `encodeBase58FromText()` em `base58.util.ts` |
| `SELECT … WHERE RevFabricante = 1` | `prisma.cadRevendas.findMany({ where: { RevFabricante: true } })` |
| `UPDATE CadRevendas SET Voucher = ?` | `prisma.cadRevendas.update({ where: { Codigo }, data: { Voucher } })` |
| `MessageBox.Show(count)` | Response body `{ gerados, ano, mensagem }` |

### Variáveis de ambiente necessárias

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=dpasis
DB_USER=postgres
DB_PASSWORD=secret
```

### Estrutura de módulo NestJS sugerida

```
src/voucher/
├── voucher.module.ts
├── voucher.controller.ts
├── voucher.service.ts
└── base58.util.ts
```

---

## Checklist de Migração

- [ ] `encodeBase58FromText('000HU2025')` retorna `'CAPUYMOMTZTQ'`
- [ ] `encodeBase58FromText('000012025')` retorna `'CAPUMKZCTT5A'`
- [ ] Todos os 4 casos de paridade passam nos testes
- [ ] Nenhuma lib externa de Base58 (`bs58`, `base-x`) utilizada
- [ ] Tabela `CadRevendas` existe no banco alvo com os campos corretos
- [ ] `VoucherModule` importado no `AppModule`
- [ ] Variáveis de ambiente configuradas no `.env`
- [ ] `POST /vouchers/generate` retorna 200 com contagem correta
- [ ] Dados do banco Access migrados para o banco relacional alvo

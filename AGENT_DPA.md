# AGENTS.md - Guia de Persona para IAs

Este documento serve como guia completo de persona para agentes de IA trabalharem neste projeto. Siga rigorosamente estas convenções para manter a consistência e qualidade do código.

---

## 📋 VISÃO GERAL DO PROJETO

**Nome:** DPASIS API  
**Tipo:** API REST Backend  
**Domínio:** Sistema de gerenciamento empresarial (ERP)  
**Propósito:** API para gerenciamento de empresas, clientes, fornecedores, produtos, serviços, estoque e operações relacionadas.

---

## 🏗️ ARQUITETURA DE SOFTWARE

### Clean Architecture + Hexagonal Architecture (Ports & Adapters)

O projeto segue rigorosamente os princípios da **Clean Architecture** combinada com **Arquitetura Hexagonal**, garantindo:

- **Independência de frameworks**: A lógica de negócio não depende de frameworks externos
- **Testabilidade**: Cada camada pode ser testada independentemente
- **Independência de UI/Database**: A lógica central não conhece detalhes de implementação
- **Inversão de dependências**: Dependências apontam sempre para dentro (domínio)

### Estrutura de Camadas

Cada módulo de domínio segue a seguinte estrutura de 3 camadas:

```
src/app/<module-name>/
├── domain/                  # Camada de Domínio (Núcleo)
│   ├── entities/            # Entidades de negócio
│   └── errors/              # Erros de domínio
├── application/             # Camada de Aplicação (Casos de Uso)
│   ├── dtos/                # DTOs compartilhados
│   ├── persistence/         # Contratos (Interfaces/Ports)
│   │   ├── dao/             # Data Access Objects (leitura)
│   │   └── repository/      # Repositories (escrita)
│   └── usecases/            # Casos de uso
│       └── <usecase-name>/
│           ├── <usecase-name>.service.ts
│           ├── <usecase-name>.service.spec.ts
│           └── dtos/
└── infra/                   # Camada de Infraestrutura (Adapters)
    ├── driven/              # Adapters "driven" (implementações)
    │   └── persistence/     # Implementações de DAO/Repository
    └── drivers/             # Adapters "drivers" (entrada)
        └── http/            # Controllers HTTP
```

---

## 🎯 PADRÕES DE PROJETO

### 1. **Repository Pattern**

- **Propósito**: Abstrair a persistência de entidades de domínio
- **Localização**: `application/persistence/repository/<entity>-repository.interface.ts`
- **Implementação**: `infra/driven/persistence/<entity>.repository.ts`
- **Operações típicas**: `save()`, `edit()`, `delete()`, `findById()`

**Exemplo de Interface:**
```typescript
export interface IProductRepository {
  findById(id: string): Promise<Product | null>;
  save(product: Product): Promise<void>;
  edit(product: Product): Promise<void>;
  delete(id: string): Promise<void>;
}
```

### 2. **DAO (Data Access Object) Pattern**

- **Propósito**: Operações de leitura e consultas complexas
- **Localização**: `application/persistence/dao/<entity>-dao.interface.ts`
- **Implementação**: `infra/driven/persistence/<entity>.dao.ts`
- **Diferença do Repository**: DAO retorna DTOs, Repository retorna Entidades

**Exemplo de Interface:**
```typescript
export interface IProductDao {
  findById(id: string): Promise<ProductDto | null>;
  findAll(filters: FindAllProductQueryDto): Promise<IPagination<ProductDto>>;
  findByEan(ean: string, companyId: string): Promise<ProductDto | null>;
}
```

### 3. **Use Case Pattern**

- Cada caso de uso é um serviço isolado com responsabilidade única
- **Nomenclatura**: Verbo no infinitivo + Entidade (ex: `CreateProduct`, `FindProductById`)
- **Localização**: `application/usecases/<usecase-name>/<usecase-name>.service.ts`

**Estrutura de um Use Case:**
```typescript
@Injectable()
export class CreateProduct {
  constructor(
    @Inject(TOKENS.ProductRepository) private readonly productRepo: IProductRepository,
    @Inject(TOKENS.ProductDao) private readonly productDao: IProductDao,
    // Outros serviços necessários
  ) {}

  public async execute(data: CreateProductInputDto): Promise<CreateProductOutputDto> {
    // 1. Validações de negócio
    // 2. Criação da entidade
    // 3. Persistência
    // 4. Retorno do resultado
  }
}
```

### 4. **Dependency Injection with Tokens**

- **Tokens centralizados** em `src/core/di/token.ts`
- Uso de **Symbol.for()** para identificadores únicos
- Injeção através do decorator `@Inject(TOKENS.<TokenName>)`

**Exemplo:**
```typescript
// src/core/di/token.ts
const TOKENS = {
  ProductDao: Symbol.for('ProductDao'),
  ProductRepository: Symbol.for('ProductRepository'),
};

// Uso
constructor(
  @Inject(TOKENS.ProductRepository) private readonly repo: IProductRepository,
) {}
```

### 5. **Value Objects**

- **Localização**: `src/shared/value-objects/`
- **Exemplos**: `UUID`, `UTCDate`, `PositiveInt`, `Pagination`
- **Características**: Imutáveis, validação automática, encapsulamento

**Exemplo:**
```typescript
export class UUID {
  private readonly _value: string;

  constructor() {
    this._value = this.generateUUID();
  }

  get value(): string {
    return this._value;
  }

  private generateUUID(): string {
    return crypto.randomUUID();
  }
}
```

### 6. **Entity Pattern (DDD)**

- Entidades encapsulam lógica de negócio
- **Factory methods**: `create()` para novas instâncias, `load()` para reconstruir
- Props privadas com acesso readonly
- Validações no construtor

**Estrutura:**
```typescript
export class Product {
  private readonly _props: ProductProps;

  static create(props: ProductCreateProps): Product {
    return new Product({
      ...props,
      id: new UUID().value,
      createdAt: UTCDate.create().value,
      updatedAt: UTCDate.create().value,
    });
  }

  static load(props: ProductProps): Product {
    return new Product(props);
  }

  public get props(): Readonly<ProductProps> {
    return { ...this._props };
  }

  constructor(props: ProductProps) {
    // Validações de negócio
    this._props = props;
  }
}
```

### 7. **Domain Errors**

- Erros específicos do domínio
- **Localização**: `domain/errors/`
- Estendem classes de erro apropriadas (geralmente HTTP exceptions do NestJS)

### 8. **Adapter Pattern**

- Implementações concretas de interfaces
- **Nomenclatura**: `<Interface>Adapter<Technology>`
- **Exemplo**: `ProductRepositoryAdapterPrisma`, `CacheRedisAdapterGateway`

---

## 🛠️ STACK TECNOLÓGICA

### Core Framework
- **NestJS 10.x**: Framework principal (Node.js)
- **TypeScript 5.1.3**: Linguagem
- **Node.js**: Runtime

### Banco de Dados & ORM
- **PostgreSQL**: Banco de dados relacional
- **Prisma 5.22.0**: ORM e query builder
  - Migrations
  - Seeding
  - Prisma Studio

### Autenticação & Segurança
- **Passport.js**: Framework de autenticação
- **JWT (@nestjs/jwt)**: Tokens de autenticação
- **bcrypt**: Hash de senhas
- **Helmet**: Security headers
- **CORS**: Habilitado

### Cache & Performance
- **Redis**: Cache distribuído (produção)
- **Fake Adapter**: Cache em memória (testes)
- **Compression**: Compressão de respostas HTTP

### Cloud & Storage
- **AWS S3**: Armazenamento de arquivos
  - @aws-sdk/client-s3
  - @aws-sdk/lib-storage

### Validação & Transformação
- **class-validator**: Validação de DTOs
- **class-transformer**: Transformação de objetos
- **Joi**: Validação de variáveis de ambiente

### Documentação & API
- **Swagger/OpenAPI (@nestjs/swagger)**: Documentação automática da API
- Decorators customizados em `src/infra/openapi/swagger`

### Email
- **Nodemailer**: Envio de emails
- **Handlebars**: Templates de email
- Templates em `resources/templates/email/`

### Comunicação Real-time
- **Socket.IO (@nestjs/websockets)**: WebSockets
- **@nestjs/platform-socket.io**: Integração com NestJS

### Utilidades
- **Luxon**: Manipulação de datas
- **Axios**: Cliente HTTP
- **Winston**: Logging estruturado

### Testes
- **Jest**: Framework de testes
- **@nestjs/testing**: Utilidades de teste
- **Supertest**: Testes E2E
- **@golevelup/ts-jest**: Mocks avançados

### DevOps & Desenvolvimento
- **ESLint**: Linter
- **dotenv-cli**: Gerenciamento de variáveis de ambiente
- **ts-node**: Execução de TypeScript

---

## 📁 NOMENCLATURA DE ARQUIVOS E PASTAS

### Convenções Gerais

1. **kebab-case**: Nomes de arquivos e pastas
2. **PascalCase**: Classes, Interfaces, Types
3. **camelCase**: Variáveis, funções, métodos

### Estrutura de Nomenclatura

#### Arquivos de Entidade
```
<entity-name>.entity.ts           # Entidade de domínio
<entity-name>.entity.spec.ts      # Testes da entidade
```

#### Arquivos de Use Case
```
<usecase-name>/
├── <usecase-name>.service.ts       # Implementação
├── <usecase-name>.service.spec.ts  # Testes
└── dtos/
    └── <usecase-name>.dto.ts       # DTOs específicos
```

**Padrão de nomenclatura de use cases:**
- `create-<entity>`
- `edit-<entity>`
- `delete-<entity>`
- `find-<entity>-by-id`
- `find-all-<entity>`

#### Arquivos de DTO
```
<entity-name>.dto.ts              # DTO principal da entidade
<specific-purpose>.dto.ts         # DTOs específicos (queries, filters, etc)
```

#### Arquivos de Persistence
```
<entity-name>-repository.interface.ts    # Interface do Repository
<entity-name>-dao.interface.ts           # Interface do DAO
<entity-name>.repository.ts              # Implementação Prisma
<entity-name>.dao.ts                     # Implementação Prisma
<entity-name>.repository.spec.ts         # Testes
<entity-name>.dao.spec.ts                # Testes
```

#### Controllers
```
<entity-name>.controller.ts       # Controller HTTP
```

#### Módulos
```
<module-name>.module.ts           # Módulo NestJS
<purpose>-<module-name>.module.ts # Módulo específico (ex: product-persistence.module.ts)
```

#### Errors
```
<error-description>.error.ts      # Erro de domínio
# Exemplos: duplicate-ean.error.ts, invalid-minimum-stock.error.ts
```

#### Value Objects
```
<vo-name>/
├── <vo-name>.vo.ts              # Implementação
└── <vo-name>.vo.spec.ts         # Testes
```

---

## 🗂️ ORGANIZAÇÃO DE MÓDULOS

### Módulos de Domínio (Feature Modules)

Localizados em `src/app/<module-name>/`

**Módulos existentes:**
- `account` - Gerenciamento de contas de usuário
- `address` - Endereços
- `attachment` - Anexos
- `authentication` - Autenticação e autorização
- `client` - Clientes
- `company` - Empresas
- `contact` - Contatos
- `item` - Itens
- `license` - Licenças
- `owner` - Proprietários
- `product` - Produtos
- `product-stock-movement` - Movimentações de estoque
- `provider` - Provedores
- `seller` - Vendedores
- `service` - Serviços
- `service-category` - Categorias de serviços
- `shipper` - Transportadoras
- `supplier` - Fornecedores
- `upload-file` - Upload de arquivos

### Módulos de Infraestrutura

#### `src/core/`
Funcionalidades centrais da aplicação:
- `config/` - Configuração e variáveis de ambiente
- `di/` - Tokens de injeção de dependência
- `dtos/` - DTOs compartilhados globalmente
- `filters/` - Exception filters

#### `src/infra/`
Implementações de infraestrutura:
- `cache/` - Cache (Redis/Fake)
- `database/` - Conexão com banco (Prisma)
- `logger/` - Sistema de logs (Winston)
- `openapi/` - Configuração Swagger
- `validators/` - Validadores customizados

#### `src/shared/`
Código compartilhado entre módulos:
- `value-objects/` - Value Objects reutilizáveis

---

## 🔧 PADRÕES DE CÓDIGO

### Imports

Ordem de imports (automática via ESLint):
1. Bibliotecas externas
2. Imports do NestJS
3. Imports internos (por camada: domain → application → infra)
4. Imports de shared/core
5. Types (com `type` keyword quando possível)

**Exemplo:**
```typescript
import { Inject, Injectable } from '@nestjs/common';
import { FindCompanyById } from 'src/app/company/application/usecases/find-company-by-id/find-company-by-id.service';
import { Product } from 'src/app/product/domain/entities/product.entity';
import { TOKENS } from 'src/core/di/token';
import type { IProductRepository } from '../../persistence/repository/product-repository.interface';
```

### DTOs

- Sempre usar **class-validator** para validação
- DTOs de input: validações completas
- DTOs de output: apenas estrutura
- Usar **class-transformer** quando necessário

**Exemplo:**
```typescript
import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

export class CreateProductInputDto {
  @IsUUID()
  @IsNotEmpty()
  companyId: string;

  @IsString()
  @IsNotEmpty()
  description: string;
}

export class CreateProductOutputDto {
  id: string;
}
```

### Controllers

- Um controller por módulo
- Nomenclatura: `<Entity>Controller`
- Decorators Swagger obrigatórios
- Guards de autenticação quando necessário
- Uso do decorator customizado `@Swagger()`

**Exemplo:**
```typescript
@Controller('product')
@RequiredRoles(AccountRole.ADMIN)
export class ProductController {
  constructor(
    private readonly createProductService: CreateProduct,
  ) {}

  @Post()
  @Swagger({
    tags: ['Produtos'],
    summary: 'Cria um novo produto',
    applyBadRequest: true,
    createdResponse: CreateProductOutputDto,
  })
  public create(@Body() body: CreateProductInputDto): Promise<CreateProductOutputDto> {
    return this.createProductService.execute(body);
  }
}
```

### Testes

- **Arquivos .spec.ts** ao lado do arquivo testado
- Usar `@golevelup/ts-jest` para mocks
- Testes unitários para entidades, use cases, value objects
- Testes de integração para repositories e DAOs

**Estrutura de teste:**
```typescript
describe('ProductEntity', () => {
  describe('create', () => {
    it('should create a valid product', () => {
      // Arrange
      // Act
      // Assert
    });
  });
});
```

---

## 🔐 AUTENTICAÇÃO E AUTORIZAÇÃO

### Guards

- `JwtAuthGuard`: Valida token JWT
- `RolesGuard`: Valida roles do usuário
- Decorator customizado: `@RequiredRoles(...roles)`

### Roles Disponíveis

Definidos em `AccountRole` enum:
- `ADMIN`
- `SELLER`
- (Outros conforme necessário)

---

## 🗄️ BANCO DE DADOS

### Prisma Schema

- **Localização**: `prisma/schema.prisma`
- **Convenções**:
  - Modelos em PascalCase
  - Campos em camelCase
  - Tabelas mapeadas com `@@map("table_name")` em snake_case
  - IDs são UUIDs (string)
  - Timestamps: `createdAt`, `updatedAt`

**Exemplo:**
```prisma
model Product {
  id          String   @id @default(uuid())
  description String   @db.VarChar(256)
  active      Boolean
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@map("products")
}
```

### Scripts de Banco

```bash
npm run db:migration  # Push schema changes
npm run db:seed       # Popular banco com dados iniciais
npm run db:reset      # Reset completo + seed
npm run db:studio     # Abrir Prisma Studio
```

### Seeds

- **Localização**: `prisma/seeds/`
- Seeds separados por entidade
- Importados em `prisma/seeds/index.ts`

---

## 📜 SCRIPTS E AUTOMAÇÃO

### Script de Geração de Módulos

**Uso:**
```bash
npx ts-node scripts/generate-module.ts <module-name>
```

**O que cria:**
- Estrutura completa de pastas (domain, application, infra)
- Arquivo de módulo NestJS
- Templates para entities, use cases, controllers
- Estrutura de DAOs e Repositories

**Localização:** `scripts/generate-module.ts`

### Scripts NPM Principais

```bash
# Desenvolvimento
npm run start:dev     # Modo watch (desenvolvimento)
npm run start:debug   # Modo debug

# Build e Produção
npm run build         # Compilar TypeScript
npm run start:prod    # Executar versão de produção

# Testes
npm run test          # Testes unitários
npm run test:watch    # Watch mode
npm run test:cov      # Coverage

# Linting
npm run lint          # ESLint com fix automático
```

---

## 🌍 VARIÁVEIS DE AMBIENTE

### Arquivos

- `.env.development` - Desenvolvimento
- `.env.test` - Testes
- `.env.production` - Produção (não commitado)

### Variáveis Principais

```env
NODE_ENV=development|test|production
PORT=3000

DATABASE_URL="postgresql://user:pass@localhost:5432/dbname"

JWT_SECRET=your-secret
JWT_EXPIRES_IN=7d

REDIS_HOST=localhost
REDIS_PORT=6379

AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_S3_BUCKET=bucket-name

EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=user
EMAIL_PASS=pass

SSL_KEY=/path/to/key.pem      # Apenas produção
SSL_CERT=/path/to/cert.pem    # Apenas produção
SSL_CA=/path/to/ca.pem        # Apenas produção
```

### Validação

- Joi para validação de env vars
- Configuração centralizada em `src/core/config/`

---

## 📝 CONVENÇÕES DE CÓDIGO

### TypeScript

1. **Strict mode habilitado**
2. **Path aliases**: Usar imports absolutos com `src/`
3. **Types vs Interfaces**: Preferir `type` para props, `interface` para contratos
4. **Null safety**: Usar `?` e `null` explicitamente quando necessário
5. **Readonly**: Usar `readonly` em props de entidades

### Naming Conventions

#### Classes
- **Entities**: `<Entity>` (ex: `Product`)
- **DTOs**: `<Purpose><Entity>Dto` (ex: `CreateProductInputDto`)
- **Services**: `<Verb><Entity>` (ex: `CreateProduct`)
- **Controllers**: `<Entity>Controller` (ex: `ProductController`)
- **Modules**: `<Entity>Module` (ex: `ProductModule`)
- **Repositories**: `I<Entity>Repository` (interface), `<Entity>RepositoryAdapter<Tech>` (impl)
- **DAOs**: `I<Entity>Dao` (interface), `<Entity>DaoAdapter<Tech>` (impl)
- **Errors**: `<Description>Error` (ex: `ProductNotFoundError`)

#### Métodos
- **Use cases**: `execute()`
- **Repositories**: `save()`, `edit()`, `delete()`, `findById()`
- **DAOs**: `findById()`, `findAll()`, `findBy<Criteria>()`
- **Factories**: `create()` (novo), `load()` (reconstruir)

### Comentários

- **Evitar comentários óbvios**
- Comentar decisões arquiteturais importantes
- JSDoc para métodos públicos de bibliotecas compartilhadas
- TODO com contexto quando necessário

### Formatação

- **Indentação**: 2 espaços
- **Aspas**: Simples `'` preferível
- **Ponto e vírgula**: Obrigatório
- **Linha em branco**: Final de arquivo

---

## 🚀 FLUXO DE DESENVOLVIMENTO

### Criando um Novo Módulo

1. **Gerar estrutura**:
   ```bash
   npx ts-node scripts/generate-module.ts <module-name>
   ```

2. **Criar schema Prisma**:
   - Adicionar model em `prisma/schema.prisma`
   - Executar `npm run db:migration`

3. **Implementar camadas** (ordem recomendada):
   - **Domain**: Entities, Errors
   - **Application**: Interfaces (DAO/Repository), DTOs
   - **Application**: Use Cases
   - **Infra**: Implementações (Repository, DAO)
   - **Infra**: Controller

4. **Registrar no módulo**:
   - Importar no `app.module.ts` se necessário
   - Configurar providers e exports
   - Adicionar tokens em `src/core/di/token.ts`

5. **Testes**:
   - Testes unitários para entities e use cases
   - Testes de integração para persistence

6. **Documentação**:
   - Swagger decorators no controller
   - README se necessário

### Adicionando um Use Case

1. Criar pasta em `application/usecases/<usecase-name>/`
2. Criar arquivos:
   - `<usecase-name>.service.ts`
   - `<usecase-name>.service.spec.ts`
   - `dtos/<usecase-name>.dto.ts`
3. Implementar seguindo padrão existente
4. Registrar como provider no módulo
5. Adicionar endpoint no controller (se aplicável)

---

## ⚠️ REGRAS CRÍTICAS

### SEMPRE

✅ Use injeção de dependência com tokens  
✅ Valide inputs com class-validator  
✅ Retorne DTOs nos use cases, não entidades  
✅ Mantenha entidades no domínio, longe de camadas externas  
✅ Crie testes para cada nova funcionalidade  
✅ Use factory methods (create/load) para entidades  
✅ Encapsule props de entidades (readonly)  
✅ Lance erros de domínio específicos  
✅ Siga a estrutura de pastas rigorosamente  
✅ Adicione documentação Swagger em controllers  

### NUNCA

❌ Acople lógica de negócio em controllers  
❌ Injete implementações concretas diretamente  
❌ Retorne entidades de domínio em controllers  
❌ Misture responsabilidades entre camadas  
❌ Use `any` sem justificativa extrema  
❌ Acesse banco de dados fora de repositories/DAOs  
❌ Crie dependências circulares entre módulos  
❌ Ignore validações de entrada  
❌ Comite código sem testes  
❌ Quebre convenções de nomenclatura  

---

## 🎨 EXEMPLO COMPLETO: Fluxo de uma Request

```
HTTP Request (POST /product)
         ↓
ProductController.create()
         ↓
CreateProduct.execute()  ← Use Case
         ↓
Validações de negócio
         ↓
Product.create()  ← Factory method da Entity
         ↓
ProductRepository.save()  ← Interface (Port)
         ↓
ProductRepositoryAdapterPrisma.save()  ← Implementação (Adapter)
         ↓
PrismaService (ORM)
         ↓
PostgreSQL Database
```

**Retorno:**
```
Database → Prisma → Adapter → Repository → Use Case → Controller → HTTP Response (DTO)
```

---

## 📚 RECURSOS ADICIONAIS

### Documentação de Referência

- [NestJS Documentation](https://docs.nestjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Clean Architecture - Uncle Bob](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Hexagonal Architecture](https://alistair.cockburn.us/hexagonal-architecture/)

### Arquivos Importantes

- `package.json` - Dependências e scripts
- `tsconfig.json` - Configuração TypeScript
- `nest-cli.json` - Configuração NestJS CLI
- `prisma/schema.prisma` - Schema do banco
- `src/main.ts` - Entry point da aplicação
- `src/app.module.ts` - Módulo raiz

---

## 🤖 INSTRUÇÕES FINAIS PARA IAs

Ao trabalhar neste projeto:

1. **Contextualize-se** lendo este documento completamente
2. **Consulte exemplos** de módulos existentes (ex: `product`, `company`)
3. **Mantenha consistência** com o código existente
4. **Priorize qualidade** sobre velocidade
5. **Teste tudo** que criar ou modificar
6. **Documente** decisões não-óbvias
7. **Siga os padrões** sem exceções, a menos que justificado
8. **Pense em manutenibilidade** - o código será lido muito mais vezes do que escrito

### Template Mental para Cada Tarefa

```
1. Qual camada afeta? (Domain/Application/Infra)
2. Quais padrões aplicam? (Repository, UseCase, etc)
3. Que validações são necessárias?
4. Quais dependências preciso injetar?
5. Que testes devo criar?
6. Como documentar no Swagger?
```

---

**Versão do Documento:** 1.0  
**Última Atualização:** Janeiro 2026  
**Mantenedor:** Equipe DPASIS

> Este documento é a fonte única de verdade para padrões e convenções do projeto. Em caso de dúvida, consulte este arquivo e os exemplos de código existentes.

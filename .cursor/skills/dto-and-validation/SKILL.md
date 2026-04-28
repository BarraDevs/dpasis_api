---
name: dto-and-validation
description: >-
  Como criar DTOs (Input/Output/Query/Param) e aplicar validação com
  class-validator e os decorators custom do projeto (Trim, StringToNumber,
  StringToBoolean). Use ao criar/modificar payload de requisição, ao herdar
  de Queries/Params, ao validar campos de entrada, ao gerar mensagens de
  erro em português, ou quando o usuário disser "criar DTO", "validar
  payload", "extender Queries", "filtrar lista por X", "transformar string
  em número", "decorator de validação", "regra de validação".
---

# DTOs e Validação

## Contexto

O projeto usa `class-validator` + `class-transformer` com `ValidationPipe({ whitelist: true, transform: true })` global (configurado em `src/infra/validators/class/config.ts` e aplicado em `main.ts`). DTOs são **classes** (não interfaces) decoradas, e o pipe automaticamente:

1. Remove campos não listados (whitelist)
2. Transforma strings de query/path em tipos primitivos (`transform: true` + decorators custom)
3. Valida e retorna erros em português

DTOs ficam organizados em três níveis:
- **DTO de saída do agregado**: `application/dtos/<modulo>.dto.ts` (sem decorators, é só shape)
- **DTO de input/output do use case**: `application/usecases/<verbo>-<modulo>/dtos/<verbo>-<modulo>.dto.ts`
- **DTOs base reutilizáveis**: `src/infra/validators/class/dtos/` (`Queries`, `Params`, `ParamsClientId`)

## Estrutura e Localização

```
src/infra/validators/class/
├── config.ts                              # ValidationPipeOptions
├── dtos/
│   ├── params/params.dto.ts               # { id: number }
│   ├── params/params-client-id.dto.ts     # { clientId: number }
│   └── queries/queries.dto.ts             # page, size, search, active
└── decorators/
    ├── trim/trim.ts                       # @Trim()
    ├── string-number/string-number.ts     # @StringToNumber()
    └── string-boolean/string-boolean.ts   # @StringToBoolean()

src/app/<x>/<modulo>/application/
├── dtos/<modulo>.dto.ts                   # Output DTO do agregado (sem decorators)
└── usecases/<verbo>-<modulo>/dtos/
    ├── <verbo>-<modulo>.dto.ts            # Create<X>InputDto / Edit<X>InputDto / etc.
    └── <verbo>-<modulo>.dto.spec.ts
```

## Como Fazer

### 1) DTO de saída do agregado (sem decorators)

Apenas o shape. Sem validação, pois é resposta:

```1:8:src/app/faq/application/dtos/faq.dto.ts
export class FaqDto {
  id: number;
  question: string;
  answer: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### 2) Input DTO de Create

Use class-validator + decorators custom. **Mensagens em português** com placeholder `$property`:

```1:23:src/app/faq/application/usecases/create-faq/dtos/create-faq.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { Trim } from 'src/infra/validators/class/decorators/trim/trim';

export class CreateFaqInputDto {
  @ApiProperty({ example: 'Como faço para recuperar minha senha?' })
  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @MaxLength(512, { message: '$property deve ter no máximo 512 caracteres' })
  @Trim()
  question: string;

  @ApiProperty({ example: 'Clique em "Esqueci minha senha" na tela de login.' })
  @IsString({ message: '$property deve ser uma string' })
  @IsNotEmpty({ message: '$property é obrigatório' })
  @MaxLength(8192, { message: '$property deve ter no máximo 8192 caracteres' })
  @Trim()
  answer: string;
}

export class CreateFaqOutputDto {
  id: number;
}
```

Padrão das mensagens: **`'$property <descrição em pt-BR>'`** (o `$property` é substituído pelo nome do campo automaticamente).

### 3) Query DTO estendendo `Queries`

`Queries` (em `src/infra/validators/class/dtos/queries/queries.dto.ts`) já traz `page`, `size`, `search`, `active`. Estenda para adicionar filtros específicos:

```1:33:src/infra/validators/class/dtos/queries/queries.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsPositive, IsString } from 'class-validator';
import { StringToBoolean } from '../../decorators/string-boolean/string-boolean';
import { StringToNumber } from '../../decorators/string-number/string-number';
import { Trim } from '../../decorators/trim/trim';

export class Queries {
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt({ message: '$property deve ser um número inteiro' })
  @IsPositive({ message: '$property deve ser um número positivo' })
  @StringToNumber()
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt({ message: '$property deve ser um número inteiro' })
  @IsPositive({ message: '$property deve ser um número positivo' })
  @StringToNumber()
  size?: number;

  @ApiPropertyOptional()
  @Trim()
  @IsOptional()
  @IsString({ message: '$property deve ser um texto' })
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean({ message: '$property deve ser um booleano' })
  @StringToBoolean()
  active?: boolean;
}
```

Uso:

```typescript
import { Queries } from 'src/infra/validators/class/dtos/queries/queries.dto';

export class FindAllFaqQueryDto extends Queries {}
```

Adicionando um filtro:

```typescript
export class FindAllAttachmentQueryDto extends Queries {
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt({ message: '$property deve ser um número inteiro' })
  @IsPositive({ message: '$property deve ser um número positivo' })
  @StringToNumber()
  clientId?: number;
}
```

### 4) Params DTO

`Params` (já fornecido) trata o caso `{ id: number }` da maioria das rotas:

```1:11:src/infra/validators/class/dtos/params/params.dto.ts
export class Params {
  @IsNotEmpty({ message: '$property é obrigatório' })
  @IsNumber({ allowNaN: false, allowInfinity: false }, { message: '$property deve ser um número' })
  @IsPositive({ message: '$property deve ser um número positivo' })
  @IsInt({ message: '$property deve ser um número inteiro' })
  @StringToNumber()
  id: number;
}
```

Para rotas com `clientId` no path use `ParamsClientId`. Se precisar de outros params, herde e adicione:

```typescript
export class FaqParams extends Params {
  // adiciona campos específicos (ex.: subId)
}
```

### 5) Edit DTO via `PartialType`

Para PATCH, use `PartialType` do `@nestjs/swagger`:

```typescript
import { PartialType } from '@nestjs/swagger';
import { CreateFaqInputDto } from '../../create-faq/dtos/create-faq.dto';

export class EditFaqInputDto extends PartialType(CreateFaqInputDto) {}
```

### 6) Decorators custom

| Decorator | Função |
|---|---|
| `@Trim()` | Aplica `.trim()` a strings (quando o valor é string) |
| `@StringToNumber()` | Converte string numérica em `number` (`'42'` → `42`); deixa outros tipos inalterados |
| `@StringToBoolean()` | Converte `'true'`/`'false'` em booleano |

```1:5:src/infra/validators/class/decorators/trim/trim.ts
export function Trim(opts?: TransformOptions): PropertyDecorator {
  return Transform(({ value }) => (typeof value === 'string') ? value.trim() : value, opts);
}
```

São essenciais em `Queries` e `Params`, pois query/path strings sempre chegam como `string`. **Sem `@StringToNumber()` o `IsInt` não passa.**

### 7) DTO com array de objetos

Use `@ValidateNested({ each: true })` + `@Type(() => XxxDto)`:

```typescript
import { Type } from 'class-transformer';
import { ValidateNested, IsArray } from 'class-validator';

export class CreateAdminInputDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubjectInputDto)
  subjects: SubjectInputDto[];
  // ...
}
```

### 8) DTO de saída para Swagger paginado

DTOs paginados usam o tipo `IPagination<T>` (de `src/shared/value-objects/pagination/pagination.vo.ts`). No controller use `@Swagger({ okPaginatedResponse: FaqDto })` — o decorator monta o schema OpenAPI. Não declare manualmente.

### 9) `@ApiProperty` é obrigatório nos campos do input DTO

O Swagger plugin do NestJS preenche automaticamente alguns campos a partir dos tipos, mas **`example` no `@ApiProperty`** ajuda muito a documentação. Para opcional use `@ApiPropertyOptional()`.

## Convenções Obrigatórias

- DTOs são **classes** (`export class XxxDto`), nunca `interface` (precisam de decorators em runtime)
- Nome do arquivo: **`<verbo>-<modulo>.dto.ts`** (ex.: `create-faq.dto.ts`)
- Nome da classe: **`<Verbo><Entity>InputDto`** + **`<Verbo><Entity>OutputDto`** no mesmo arquivo
- Toda mensagem de validação em **pt-BR** com `$property`
- Querystrings/paths usam SEMPRE `@StringToNumber()` ou `@StringToBoolean()` antes de `@IsInt`/`@IsBoolean`
- Strings de input usam SEMPRE `@Trim()` (a não ser que espaços sejam significativos)
- `MaxLength`/`MinLength` explícitos onde houver limite de banco (ver schema Prisma `@db.Text`, `@db.VarChar(N)`)
- DTOs de saída do agregado em `application/dtos/<modulo>.dto.ts` ficam **sem decorators** (são shapes)
- Use `extends Queries` para herdar `page/size/search/active`; adicione filtros específicos como propriedades extras
- Use `extends Params` para herdar `{ id: number }`; estenda quando precisar de mais params

## Anti-Padrões (Nunca Faça)

- ❌ DTO sem `@ApiProperty()`/`@ApiPropertyOptional()` quando exposto via OpenAPI
- ❌ Esquecer `@StringToNumber()` em campo numérico vindo de query/path. O `IsInt` rejeita `'42'`
- ❌ Validar regra de negócio no DTO (ex.: "esse id existe?"). DTO valida formato/forma; existência é no use case
- ❌ Usar `interface XxxDto` (decorators precisam de classe)
- ❌ Misturar Input e Output em arquivos diferentes do mesmo use case. Mantenha **`Create<X>InputDto`** e **`Create<X>OutputDto`** no mesmo `create-<x>.dto.ts`
- ❌ `@IsString()` sem `@IsNotEmpty()` quando o campo é obrigatório (vai aceitar `""`)
- ❌ Mensagens em inglês. O projeto entrega erros em **pt-BR**
- ❌ Importar DTO de outro módulo. Cada use case tem seus próprios DTOs

## Exemplo Completo

DTO de Edit que usa `PartialType` + Trim + MaxLength:

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { PartialType } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';
import { Trim } from 'src/infra/validators/class/decorators/trim/trim';
import { CreateFaqInputDto } from '../../create-faq/dtos/create-faq.dto';

export class EditFaqInputDto extends PartialType(CreateFaqInputDto) {}
```

Controller consumindo o DTO (validação automática via `ValidationPipe` global):

```83:94:src/app/faq/infra/drivers/http/admin/faq-admin.controller.ts
  @Patch(':id')
  @RequiredClaims(Claim.FAQ_WRITE)
  @Swagger({
    tags: ['FAQs'],
    summary: 'Editar FAQ',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public update(@Param() params: Params, @Body() body: EditFaqInputDto): Promise<SuccessMessage> {
    return this.editFaq.execute(params.id, body);
  }
```

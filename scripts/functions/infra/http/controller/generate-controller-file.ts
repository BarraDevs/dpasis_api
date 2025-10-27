import { Props } from 'scripts/generate-module';

export function generateControllerFile({ moduleName, moduleNamePascal }: Props) {
  return `import { Body, Controller, Post } from '@nestjs/common';
import { Create${moduleNamePascal} } from 'src/app/${moduleName}/application/usecases/create-${moduleName}/create-${moduleName}.service';
import { Create${moduleNamePascal}InputDto, Create${moduleNamePascal}OutputDto } from 'src/app/${moduleName}/application/usecases/create-${moduleName}/dtos/create-${moduleName}.dto';
import { Swagger } from 'src/infra/openapi/swagger';

@Controller('${moduleName}')
export class ${moduleNamePascal}Controller {
  constructor(
    private readonly create${moduleNamePascal}Service: Create${moduleNamePascal},
    // private readonly findAll${moduleNamePascal}Service: FindAll${moduleNamePascal},
    // private readonly find${moduleNamePascal}ByIdService: Find${moduleNamePascal}ById,
    // private readonly edit${moduleNamePascal}Service: Edit${moduleNamePascal},
    // private readonly delete${moduleNamePascal}Service: Delete${moduleNamePascal},
  ) {}

  @Post()
  @Swagger({
    tags: ['TAG_AQUI'],
    summary: 'Rota para criar NOME_AQUI',
    applyBadRequest: true,
    createdResponse: Create${moduleNamePascal}OutputDto,
  })
  public create(@Body() body: Create${moduleNamePascal}InputDto): Promise<Create${moduleNamePascal}OutputDto> {
    return this.create${moduleNamePascal}Service.execute(body);
  }

//  @Get()
//  @Swagger({
//    tags: ['TAG_AQUI'],
//    summary: 'Rota para listar NOME_AQUI',
//    applyBadRequest: true,
//    okPaginatedResponse: ${moduleNamePascal}Dto,
//  })
//  public findAll(@Query() queries: FindAll${moduleNamePascal}QueryDto): Promise<IPagination<${moduleNamePascal}Dto>> {
//    return this.findAll${moduleNamePascal}Service.execute(queries);
//  }
//
//  @Get(':id')
//  @Swagger({
//    tags: ['TAG_AQUI'],
//    summary: 'Rota para buscar NOME_AQUI por ID',
//    applyBadRequest: true,
//    applyNotFound: true,
//    okResponse: ${moduleNamePascal}Dto,
//  })
//  public findOne(@Param() params: Params): Promise<${moduleNamePascal}Dto> {
//    return this.find${moduleNamePascal}ByIdService.execute(params.id);
//  }
//
//  @Patch(':id')
//  @Swagger({
//    tags: ['TAG_AQUI'],
//    summary: 'Rota para editar NOME_AQUI',
//    applyBadRequest: true,
//    applyNotFound: true,
//    okResponse: SuccessMessage,
//  })
//  public update(@Param() params: Params, @Body() body: Edit${moduleNamePascal}InputDto): Promise<SuccessMessage> {
//    return this.edit${moduleNamePascal}Service.execute(params.id, body);
//  }
//
//  @Delete(':id')
//  @Swagger({
//    tags: ['TAG_AQUI'],
//    summary: 'Rota para deletar NOME_AQUI',
//    applyBadRequest: true,
//    applyNotFound: true,
//    okResponse: SuccessMessage,
//  })
//  public remove(@Param() params: Params): Promise<SuccessMessage> {
//    return this.delete${moduleNamePascal}Service.execute(params.id);
//  }
}
`;
}

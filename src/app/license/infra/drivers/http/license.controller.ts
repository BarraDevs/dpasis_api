import { Body, Controller, Post } from '@nestjs/common';
import { CreateLicense } from 'src/app/license/application/usecases/create-license/create-license.service';
import { CreateLicenseInputDto, CreateLicenseOutputDto } from 'src/app/license/application/usecases/create-license/dtos/create-license.dto';
import { Swagger } from 'src/infra/openapi/swagger';

@Controller('license')
export class LicenseController {
  constructor(
    private readonly createLicenseService: CreateLicense,
    // private readonly findAllLicenseService: FindAllLicense,
    // private readonly findLicenseByIdService: FindLicenseById,
    // private readonly editLicenseService: EditLicense,
    // private readonly deleteLicenseService: DeleteLicense,
  ) {}

  @Post()
  @Swagger({
    tags: ['TAG_AQUI'],
    summary: 'Rota para criar NOME_AQUI',
    applyBadRequest: true,
    createdResponse: CreateLicenseOutputDto,
  })
  public create(@Body() body: CreateLicenseInputDto): Promise<CreateLicenseOutputDto> {
    return this.createLicenseService.execute(body);
  }

//  @Get()
//  @Swagger({
//    tags: ['TAG_AQUI'],
//    summary: 'Rota para listar NOME_AQUI',
//    applyBadRequest: true,
//    okPaginatedResponse: LicenseDto,
//  })
//  public findAll(@Query() queries: FindAllLicenseQueryDto): Promise<IPagination<LicenseDto>> {
//    return this.findAllLicenseService.execute(queries);
//  }
//
//  @Get(':id')
//  @Swagger({
//    tags: ['TAG_AQUI'],
//    summary: 'Rota para buscar NOME_AQUI por ID',
//    applyBadRequest: true,
//    applyNotFound: true,
//    okResponse: LicenseDto,
//  })
//  public findOne(@Param() params: Params): Promise<LicenseDto> {
//    return this.findLicenseByIdService.execute(params.id);
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
//  public update(@Param() params: Params, @Body() body: EditLicenseInputDto): Promise<SuccessMessage> {
//    return this.editLicenseService.execute(params.id, body);
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
//    return this.deleteLicenseService.execute(params.id);
//  }
}

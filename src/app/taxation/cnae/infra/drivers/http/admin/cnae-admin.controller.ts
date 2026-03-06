import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { RequiredRoles } from 'src/app/authentication/infra/decorators/required-role.decorator';
import { CnaeDto } from 'src/app/taxation/cnae/application/dtos/cnae.dto';
import { CreateCnae } from 'src/app/taxation/cnae/application/usecases/create-cnae/create-cnae.service';
import { CreateCnaeInputDto, CreateCnaeOutputDto } from 'src/app/taxation/cnae/application/usecases/create-cnae/dtos/create-cnae.dto';
import { EditCnaeInputDto } from 'src/app/taxation/cnae/application/usecases/edit-cnae/dtos/edit-cnae.dto';
import { EditCnae } from 'src/app/taxation/cnae/application/usecases/edit-cnae/edit-cnae.service';
import { FindAllCnaeQueryDto } from 'src/app/taxation/cnae/application/usecases/find-all-cnae/dtos/find-all-cnae.dto';
import { FindAllCnae } from 'src/app/taxation/cnae/application/usecases/find-all-cnae/find-all-cnae.service';
import { FindCnaeById } from 'src/app/taxation/cnae/application/usecases/find-cnae-by-id/find-cnae-by-id.service';
import { UpdateCnaeStatus } from 'src/app/taxation/cnae/application/usecases/update-cnae-status/update-cnae-status.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Swagger } from 'src/infra/openapi/swagger';
import { Params } from 'src/infra/validators/class/dtos/params/params.dto';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';

@Controller('admin/cnae')
@RequiredRoles(AccountRole.ADMIN)
export class CnaeAdminController {
  constructor(
    private readonly createCnae: CreateCnae,
    private readonly findAllCnae: FindAllCnae,
    private readonly findCnaeById: FindCnaeById,
    private readonly editCnae: EditCnae,
    private readonly updateCnaeStatus: UpdateCnaeStatus,
  ) {}

  @Post()
  @Swagger({
    tags: ['Configurações - CNAE'],
    summary: 'Criar novo CNAE',
    applyBadRequest: true,
    applyConflict: true,
    createdResponse: CreateCnaeOutputDto,
  })
  public create(@Body() body: CreateCnaeInputDto): Promise<CreateCnaeOutputDto> {
    return this.createCnae.execute(body);
  }

  @Get()
  @Swagger({
    tags: ['Configurações - CNAE'],
    summary: 'Listar CNAEs com paginação e busca',
    applyBadRequest: true,
    okPaginatedResponse: CnaeDto,
  })
  public findAll(@Query() queries: FindAllCnaeQueryDto): Promise<IPagination<CnaeDto>> {
    return this.findAllCnae.execute(queries);
  }

  @Get(':id')
  @Swagger({
    tags: ['Configurações - CNAE'],
    summary: 'Buscar CNAE por ID',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: CnaeDto,
  })
  public findOne(@Param() params: Params): Promise<CnaeDto> {
    return this.findCnaeById.execute(params.id);
  }

  @Patch(':id/status')
  @Swagger({
    tags: ['Configurações - CNAE'],
    summary: 'Inverter status ativo do CNAE',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public updateStatus(@Param() params: Params): Promise<SuccessMessage> {
    return this.updateCnaeStatus.execute(params.id);
  }

  @Patch(':id')
  @Swagger({
    tags: ['Configurações - CNAE'],
    summary: 'Editar CNAE',
    applyBadRequest: true,
    applyNotFound: true,
    applyConflict: true,
    okResponse: SuccessMessage,
  })
  public update(@Param() params: Params, @Body() body: EditCnaeInputDto): Promise<SuccessMessage> {
    return this.editCnae.execute(params.id, body);
  }
}

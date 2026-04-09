import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { Claim } from 'src/app/authentication/domain/authorization/claim';
import { RequiredClaims } from 'src/app/authentication/infra/decorators/required-claims.decorator';
import { RequiredRoles } from 'src/app/authentication/infra/decorators/required-role.decorator';
import { IndopDto } from 'src/app/taxation/indop/application/dtos/indop.dto';
import { CreateIndop } from 'src/app/taxation/indop/application/usecases/create-indop/create-indop.service';
import { CreateIndopInputDto, CreateIndopOutputDto } from 'src/app/taxation/indop/application/usecases/create-indop/dtos/create-indop.dto';
import { DeleteIndop } from 'src/app/taxation/indop/application/usecases/delete-indop/delete-indop.service';
import { EditIndopInputDto } from 'src/app/taxation/indop/application/usecases/edit-indop/dtos/edit-indop.dto';
import { EditIndop } from 'src/app/taxation/indop/application/usecases/edit-indop/edit-indop.service';
import { FindAllIndopQueryDto } from 'src/app/taxation/indop/application/usecases/find-all-indop/dtos/find-all-indop.dto';
import { FindAllIndop } from 'src/app/taxation/indop/application/usecases/find-all-indop/find-all-indop.service';
import { FindIndopById } from 'src/app/taxation/indop/application/usecases/find-indop-by-id/find-indop-by-id.service';
import { UpdateIndopStatus } from 'src/app/taxation/indop/application/usecases/update-indop-status/update-indop-status.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Swagger } from 'src/infra/openapi/swagger';
import { Params } from 'src/infra/validators/class/dtos/params/params.dto';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';

@Controller('admin/indop')
@RequiredRoles(AccountRole.ADMIN)
export class IndopAdminController {
  constructor(
    private readonly createIndop: CreateIndop,
    private readonly findAllIndop: FindAllIndop,
    private readonly findIndopById: FindIndopById,
    private readonly editIndop: EditIndop,
    private readonly updateIndopStatus: UpdateIndopStatus,
    private readonly deleteIndop: DeleteIndop,
  ) {}

  @Post()
  @RequiredClaims(Claim.INDOP_WRITE)
  @Swagger({
    tags: ['Tributação - INDOP'],
    summary: 'Criar novo INDOP',
    applyBadRequest: true,
    applyConflict: true,
    createdResponse: CreateIndopOutputDto,
  })
  public create(@Body() body: CreateIndopInputDto): Promise<CreateIndopOutputDto> {
    return this.createIndop.execute(body);
  }

  @Get()
  @RequiredClaims(Claim.INDOP_READ)
  @Swagger({
    tags: ['Tributação - INDOP'],
    summary: 'Listar INDOP com paginação e busca',
    applyBadRequest: true,
    okPaginatedResponse: IndopDto,
  })
  public findAll(@Query() queries: FindAllIndopQueryDto): Promise<IPagination<IndopDto>> {
    return this.findAllIndop.execute(queries);
  }

  @Get(':id')
  @RequiredClaims(Claim.INDOP_READ)
  @Swagger({
    tags: ['Tributação - INDOP'],
    summary: 'Buscar INDOP por ID',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: IndopDto,
  })
  public findOne(@Param() params: Params): Promise<IndopDto> {
    return this.findIndopById.execute(params.id);
  }

  @Patch(':id/status')
  @RequiredClaims(Claim.INDOP_WRITE)
  @Swagger({
    tags: ['Tributação - INDOP'],
    summary: 'Inverter status ativo do INDOP',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public updateStatus(@Param() params: Params): Promise<SuccessMessage> {
    return this.updateIndopStatus.execute(params.id);
  }

  @Patch(':id')
  @RequiredClaims(Claim.INDOP_WRITE)
  @Swagger({
    tags: ['Tributação - INDOP'],
    summary: 'Editar INDOP',
    applyBadRequest: true,
    applyNotFound: true,
    applyConflict: true,
    okResponse: SuccessMessage,
  })
  public update(@Param() params: Params, @Body() body: EditIndopInputDto): Promise<SuccessMessage> {
    return this.editIndop.execute(params.id, body);
  }

  @Delete(':id')
  @RequiredClaims(Claim.INDOP_WRITE)
  @Swagger({
    tags: ['Tributação - INDOP'],
    summary: 'Excluir INDOP',
    applyBadRequest: true,
    applyNotFound: true,
    applyConflict: true,
    okResponse: SuccessMessage,
  })
  public remove(@Param() params: Params): Promise<SuccessMessage> {
    return this.deleteIndop.execute(params.id);
  }
}

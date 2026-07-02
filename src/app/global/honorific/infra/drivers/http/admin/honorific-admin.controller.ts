import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { Claim } from 'src/app/authentication/domain/authorization/claim';
import { RequiredClaims } from 'src/app/authentication/infra/decorators/required-claims.decorator';
import { RequiredRoles } from 'src/app/authentication/infra/decorators/required-role.decorator';
import { HonorificDto } from 'src/app/global/honorific/application/dtos/honorific.dto';
import { CreateHonorific } from 'src/app/global/honorific/application/usecases/create-honorific/create-honorific.service';
import { CreateHonorificInputDto, CreateHonorificOutputDto } from 'src/app/global/honorific/application/usecases/create-honorific/dtos/create-honorific.dto';
import { DeleteHonorific } from 'src/app/global/honorific/application/usecases/delete-honorific/delete-honorific.service';
import { EditHonorificInputDto } from 'src/app/global/honorific/application/usecases/edit-honorific/dtos/edit-honorific.dto';
import { EditHonorific } from 'src/app/global/honorific/application/usecases/edit-honorific/edit-honorific.service';
import { FindAllHonorificQueryDto } from 'src/app/global/honorific/application/usecases/find-all-honorific/dtos/find-all-honorific.dto';
import { FindAllHonorific } from 'src/app/global/honorific/application/usecases/find-all-honorific/find-all-honorific.service';
import { FindHonorificById } from 'src/app/global/honorific/application/usecases/find-honorific-by-id/find-honorific-by-id.service';
import { UpdateHonorificStatus } from 'src/app/global/honorific/application/usecases/update-honorific-status/update-honorific-status.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Swagger } from 'src/infra/openapi/swagger';
import { Params } from 'src/infra/validators/class/dtos/params';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';

@Controller('admin/honorific')
@RequiredRoles(AccountRole.ADMIN)
export class HonorificAdminController {
  constructor(
    private readonly createHonorific: CreateHonorific,
    private readonly findAllHonorific: FindAllHonorific,
    private readonly findHonorificById: FindHonorificById,
    private readonly editHonorific: EditHonorific,
    private readonly updateHonorificStatus: UpdateHonorificStatus,
    private readonly deleteHonorific: DeleteHonorific,
  ) {}

  @Post()
  @RequiredClaims(Claim.HONORIFIC_WRITE)
  @Swagger({
    tags: ['Pronomes de tratamento'],
    summary: 'Criar pronome de tratamento',
    applyBadRequest: true,
    createdResponse: CreateHonorificOutputDto,
  })
  public create(@Body() body: CreateHonorificInputDto): Promise<CreateHonorificOutputDto> {
    return this.createHonorific.execute(body);
  }

  @Get()
  @RequiredClaims(Claim.HONORIFIC_READ)
  @Swagger({
    tags: ['Pronomes de tratamento'],
    summary: 'Listar pronomes de tratamento com paginação e busca',
    applyBadRequest: true,
    okPaginatedResponse: HonorificDto,
  })
  public findAll(@Query() queries: FindAllHonorificQueryDto): Promise<IPagination<HonorificDto>> {
    return this.findAllHonorific.execute(queries);
  }

  @Get(':id')
  @RequiredClaims(Claim.HONORIFIC_READ)
  @Swagger({
    tags: ['Pronomes de tratamento'],
    summary: 'Buscar pronome de tratamento por ID',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: HonorificDto,
  })
  public findOne(@Param() params: Params): Promise<HonorificDto> {
    return this.findHonorificById.execute(params.id);
  }

  @Patch(':id/status')
  @RequiredClaims(Claim.HONORIFIC_WRITE)
  @Swagger({
    tags: ['Pronomes de tratamento'],
    summary: 'Inverter status ativo do pronome de tratamento',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public updateStatus(@Param() params: Params): Promise<SuccessMessage> {
    return this.updateHonorificStatus.execute(params.id);
  }

  @Patch(':id')
  @RequiredClaims(Claim.HONORIFIC_WRITE)
  @Swagger({
    tags: ['Pronomes de tratamento'],
    summary: 'Editar pronome de tratamento',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public update(@Param() params: Params, @Body() body: EditHonorificInputDto): Promise<SuccessMessage> {
    return this.editHonorific.execute(params.id, body);
  }

  @Delete(':id')
  @RequiredClaims(Claim.HONORIFIC_WRITE)
  @Swagger({
    tags: ['Pronomes de tratamento'],
    summary: 'Excluir pronome de tratamento',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public remove(@Param() params: Params): Promise<SuccessMessage> {
    return this.deleteHonorific.execute(params.id);
  }
}

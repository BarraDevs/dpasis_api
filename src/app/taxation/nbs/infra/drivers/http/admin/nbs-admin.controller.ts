import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { Claim } from 'src/app/authentication/domain/authorization/claim';
import { RequiredClaims } from 'src/app/authentication/infra/decorators/required-claims.decorator';
import { RequiredRoles } from 'src/app/authentication/infra/decorators/required-role.decorator';
import { NbsDto } from 'src/app/taxation/nbs/application/dtos/nbs.dto';
import { CreateNbs } from 'src/app/taxation/nbs/application/usecases/create-nbs/create-nbs.service';
import { CreateNbsInputDto, CreateNbsOutputDto } from 'src/app/taxation/nbs/application/usecases/create-nbs/dtos/create-nbs.dto';
import { EditNbsInputDto } from 'src/app/taxation/nbs/application/usecases/edit-nbs/dtos/edit-nbs.dto';
import { EditNbs } from 'src/app/taxation/nbs/application/usecases/edit-nbs/edit-nbs.service';
import { FindAllNbsQueryDto } from 'src/app/taxation/nbs/application/usecases/find-all-nbs/dtos/find-all-nbs.dto';
import { FindAllNbs } from 'src/app/taxation/nbs/application/usecases/find-all-nbs/find-all-nbs.service';
import { FindNbsById } from 'src/app/taxation/nbs/application/usecases/find-nbs-by-id/find-nbs-by-id.service';
import { UpdateNbsStatus } from 'src/app/taxation/nbs/application/usecases/update-nbs-status/update-nbs-status.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Swagger } from 'src/infra/openapi/swagger';
import { Params } from 'src/infra/validators/class/dtos/params/params.dto';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';

@Controller('admin/nbs')
@RequiredRoles(AccountRole.ADMIN)
export class NbsAdminController {
  constructor(
    private readonly createNbs: CreateNbs,
    private readonly findAllNbs: FindAllNbs,
    private readonly findNbsById: FindNbsById,
    private readonly editNbs: EditNbs,
    private readonly updateNbsStatus: UpdateNbsStatus,
  ) {}

  @Post()
  @RequiredClaims(Claim.NBS_CREATE)
  @Swagger({
    tags: ['Tributação - NBS'],
    summary: 'Criar novo NBS',
    applyBadRequest: true,
    applyConflict: true,
    createdResponse: CreateNbsOutputDto,
  })
  public create(@Body() body: CreateNbsInputDto): Promise<CreateNbsOutputDto> {
    return this.createNbs.execute(body);
  }

  @Get()
  @RequiredClaims(Claim.NBS_LIST)
  @Swagger({
    tags: ['Tributação - NBS'],
    summary: 'Listar NBS com paginação e busca',
    applyBadRequest: true,
    okPaginatedResponse: NbsDto,
  })
  public findAll(@Query() queries: FindAllNbsQueryDto): Promise<IPagination<NbsDto>> {
    return this.findAllNbs.execute(queries);
  }

  @Get(':id')
  @RequiredClaims(Claim.NBS_READ)
  @Swagger({
    tags: ['Tributação - NBS'],
    summary: 'Buscar NBS por ID',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: NbsDto,
  })
  public findOne(@Param() params: Params): Promise<NbsDto> {
    return this.findNbsById.execute(params.id);
  }

  @Patch(':id/status')
  @RequiredClaims(Claim.NBS_UPDATE_STATUS)
  @Swagger({
    tags: ['Tributação - NBS'],
    summary: 'Inverter status ativo do NBS',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public updateStatus(@Param() params: Params): Promise<SuccessMessage> {
    return this.updateNbsStatus.execute(params.id);
  }

  @Patch(':id')
  @RequiredClaims(Claim.NBS_UPDATE)
  @Swagger({
    tags: ['Tributação - NBS'],
    summary: 'Editar NBS',
    applyBadRequest: true,
    applyNotFound: true,
    applyConflict: true,
    okResponse: SuccessMessage,
  })
  public update(@Param() params: Params, @Body() body: EditNbsInputDto): Promise<SuccessMessage> {
    return this.editNbs.execute(params.id, body);
  }
}

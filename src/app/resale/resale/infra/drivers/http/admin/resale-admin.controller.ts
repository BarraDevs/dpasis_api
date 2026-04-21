import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { Claim } from 'src/app/authentication/domain/authorization/claim';
import { RequiredClaims } from 'src/app/authentication/infra/decorators/required-claims.decorator';
import { RequiredRoles } from 'src/app/authentication/infra/decorators/required-role.decorator';
import { ResaleDto } from 'src/app/resale/resale/application/dtos/resale.dto';
import { ActivateResale } from 'src/app/resale/resale/application/usecases/activate-resale/activate-resale.service';
import { CreateResale } from 'src/app/resale/resale/application/usecases/create-resale/create-resale.service';
import { CreateResaleInputDto, CreateResaleOutputDto } from 'src/app/resale/resale/application/usecases/create-resale/dtos/create-resale.dto';
import { DeactivateResale } from 'src/app/resale/resale/application/usecases/deactivate-resale/deactivate-resale.service';
import { EditResaleInputDto } from 'src/app/resale/resale/application/usecases/edit-resale/dtos/edit-resale.dto';
import { EditResale } from 'src/app/resale/resale/application/usecases/edit-resale/edit-resale.service';
import { FindAllResaleQueryDto } from 'src/app/resale/resale/application/usecases/find-all-resale/dtos/find-all-resale.dto';
import { FindAllResale } from 'src/app/resale/resale/application/usecases/find-all-resale/find-all-resale.service';
import { FindResaleById } from 'src/app/resale/resale/application/usecases/find-resale-by-id/find-resale-by-id.service';
import { GetResaleSequenceOutputDto } from 'src/app/resale/resale/application/usecases/get-resale-sequence/dtos/get-resale-sequence.dto';
import { GetResaleSequence } from 'src/app/resale/resale/application/usecases/get-resale-sequence/get-resale-sequence.service';
import { SetResaleNextIdInputDto } from 'src/app/resale/resale/application/usecases/set-resale-next-id/dtos/set-resale-next-id.dto';
import { SetResaleNextId } from 'src/app/resale/resale/application/usecases/set-resale-next-id/set-resale-next-id.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Swagger } from 'src/infra/openapi/swagger';
import { Params } from 'src/infra/validators/class/dtos/params/params.dto';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';

@Controller('admin/resale')
@RequiredRoles(AccountRole.ADMIN)
export class ResaleAdminController {
  constructor(
    private readonly activateResale: ActivateResale,
    private readonly createResale: CreateResale,
    private readonly deactivateResale: DeactivateResale,
    private readonly findAllResale: FindAllResale,
    private readonly findResaleById: FindResaleById,
    private readonly editResale: EditResale,
    private readonly getResaleSequence: GetResaleSequence,
    private readonly setResaleNextId: SetResaleNextId,
  ) {}

  @Post()
  @RequiredClaims(Claim.RESALE_WRITE)
  @Swagger({
    tags: ['Revendas'],
    summary: 'Criar nova revenda',
    applyBadRequest: true,
    createdResponse: CreateResaleOutputDto,
  })
  public create(@Body() body: CreateResaleInputDto): Promise<CreateResaleOutputDto> {
    return this.createResale.execute(body);
  }

  @Get()
  @RequiredClaims(Claim.RESALE_READ)
  @Swagger({
    tags: ['Revendas'],
    summary: 'Listar revendas com paginação e busca',
    applyBadRequest: true,
    okPaginatedResponse: ResaleDto,
  })
  public findAll(@Query() queries: FindAllResaleQueryDto): Promise<IPagination<ResaleDto>> {
    return this.findAllResale.execute(queries);
  }

  @Get('sequence')
  @RequiredClaims(Claim.RESALE_READ)
  @Swagger({
    tags: ['Revendas'],
    summary: 'Consultar próximo ID automático de revenda',
    okResponse: GetResaleSequenceOutputDto,
  })
  public getSequence(): Promise<GetResaleSequenceOutputDto> {
    return this.getResaleSequence.execute();
  }

  @Patch('sequence')
  @RequiredClaims(Claim.RESALE_WRITE)
  @Swagger({
    tags: ['Revendas'],
    summary: 'Definir próximo ID automático de revenda',
    applyBadRequest: true,
    okResponse: SuccessMessage,
  })
  public setSequence(@Body() body: SetResaleNextIdInputDto): Promise<SuccessMessage> {
    return this.setResaleNextId.execute(body);
  }

  @Get(':id')
  @RequiredClaims(Claim.RESALE_READ)
  @Swagger({
    tags: ['Revendas'],
    summary: 'Buscar revenda por ID',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: ResaleDto,
  })
  public findOne(@Param() params: Params): Promise<ResaleDto> {
    return this.findResaleById.execute(params.id);
  }

  @Patch(':id/activate')
  @RequiredClaims(Claim.RESALE_WRITE)
  @Swagger({
    tags: ['Revendas'],
    summary: 'Ativar revenda',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public activate(@Param() params: Params): Promise<SuccessMessage> {
    return this.activateResale.execute(params.id);
  }

  @Patch(':id/deactivate')
  @RequiredClaims(Claim.RESALE_WRITE)
  @Swagger({
    tags: ['Revendas'],
    summary: 'Desativar revenda',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public deactivate(@Param() params: Params): Promise<SuccessMessage> {
    return this.deactivateResale.execute(params.id);
  }

  @Patch(':id')
  @RequiredClaims(Claim.RESALE_WRITE)
  @Swagger({
    tags: ['Revendas'],
    summary: 'Editar revenda',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public update(@Param() params: Params, @Body() body: EditResaleInputDto): Promise<SuccessMessage> {
    return this.editResale.execute(params.id, body);
  }
}

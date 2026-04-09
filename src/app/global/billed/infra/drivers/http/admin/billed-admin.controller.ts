import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { Claim } from 'src/app/authentication/domain/authorization/claim';
import { RequiredClaims } from 'src/app/authentication/infra/decorators/required-claims.decorator';
import { RequiredRoles } from 'src/app/authentication/infra/decorators/required-role.decorator';
import { BilledDto } from 'src/app/global/billed/application/dtos/billed.dto';
import { ActivateBilled } from 'src/app/global/billed/application/usecases/activate-billed/activate-billed.service';
import { CreateBilled } from 'src/app/global/billed/application/usecases/create-billed/create-billed.service';
import { CreateBilledInputDto, CreateBilledOutputDto } from 'src/app/global/billed/application/usecases/create-billed/dtos/create-billed.dto';
import { DeactivateBilled } from 'src/app/global/billed/application/usecases/deactivate-billed/deactivate-billed.service';
import { DeleteBilled } from 'src/app/global/billed/application/usecases/delete-billed/delete-billed.service';
import { EditBilledInputDto } from 'src/app/global/billed/application/usecases/edit-billed/dtos/edit-billed.dto';
import { EditBilled } from 'src/app/global/billed/application/usecases/edit-billed/edit-billed.service';
import { FindAllBilledQueryDto } from 'src/app/global/billed/application/usecases/find-all-billed/dtos/find-all-billed.dto';
import { FindAllBilled } from 'src/app/global/billed/application/usecases/find-all-billed/find-all-billed.service';
import { FindBilledById } from 'src/app/global/billed/application/usecases/find-billed-by-id/find-billed-by-id.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Swagger } from 'src/infra/openapi/swagger';
import { Params } from 'src/infra/validators/class/dtos/params/params.dto';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';

@Controller('admin/billed')
@RequiredRoles(AccountRole.ADMIN)
export class BilledAdminController {
  constructor(
    private readonly activateBilled: ActivateBilled,
    private readonly createBilled: CreateBilled,
    private readonly deactivateBilled: DeactivateBilled,
    private readonly findAllBilled: FindAllBilled,
    private readonly findBilledById: FindBilledById,
    private readonly editBilled: EditBilled,
    private readonly deleteBilled: DeleteBilled,
  ) {}

  @Post()
  @RequiredClaims(Claim.BILLED_WRITE)
  @Swagger({
    tags: ['Faturados'],
    summary: 'Criar faturado',
    applyBadRequest: true,
    createdResponse: CreateBilledOutputDto,
  })
  public create(@Body() body: CreateBilledInputDto): Promise<CreateBilledOutputDto> {
    return this.createBilled.execute(body);
  }

  @Get()
  @RequiredClaims(Claim.BILLED_READ)
  @Swagger({
    tags: ['Faturados'],
    summary: 'Listar faturados com paginação e busca',
    applyBadRequest: true,
    okPaginatedResponse: BilledDto,
  })
  public findAll(@Query() queries: FindAllBilledQueryDto): Promise<IPagination<BilledDto>> {
    return this.findAllBilled.execute(queries);
  }

  @Get(':id')
  @RequiredClaims(Claim.BILLED_READ)
  @Swagger({
    tags: ['Faturados'],
    summary: 'Buscar faturado por ID',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: BilledDto,
  })
  public findOne(@Param() params: Params): Promise<BilledDto> {
    return this.findBilledById.execute(params.id);
  }

  @Patch(':id/activate')
  @RequiredClaims(Claim.BILLED_WRITE)
  @Swagger({
    tags: ['Faturados'],
    summary: 'Ativar faturado',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public activate(@Param() params: Params): Promise<SuccessMessage> {
    return this.activateBilled.execute(params.id);
  }

  @Patch(':id/deactivate')
  @RequiredClaims(Claim.BILLED_WRITE)
  @Swagger({
    tags: ['Faturados'],
    summary: 'Desativar faturado',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public deactivate(@Param() params: Params): Promise<SuccessMessage> {
    return this.deactivateBilled.execute(params.id);
  }

  @Patch(':id')
  @RequiredClaims(Claim.BILLED_WRITE)
  @Swagger({
    tags: ['Faturados'],
    summary: 'Editar faturado',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public update(@Param() params: Params, @Body() body: EditBilledInputDto): Promise<SuccessMessage> {
    return this.editBilled.execute(params.id, body);
  }

  @Delete(':id')
  @RequiredClaims(Claim.BILLED_WRITE)
  @Swagger({
    tags: ['Faturados'],
    summary: 'Deletar faturado',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public remove(@Param() params: Params): Promise<SuccessMessage> {
    return this.deleteBilled.execute(params.id);
  }
}

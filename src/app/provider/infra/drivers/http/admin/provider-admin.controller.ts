import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { Claim } from 'src/app/authentication/domain/authorization/claim';
import { RequiredClaims } from 'src/app/authentication/infra/decorators/required-claims.decorator';
import { RequiredRoles } from 'src/app/authentication/infra/decorators/required-role.decorator';
import { ProviderDto } from 'src/app/provider/application/dtos/provider.dto';
import { ActivateProvider } from 'src/app/provider/application/usecases/activate-provider/activate-provider.service';
import { CreateProvider } from 'src/app/provider/application/usecases/create-provider/create-provider.service';
import { CreateProviderInputDto, CreateProviderOutputDto } from 'src/app/provider/application/usecases/create-provider/dtos/create-provider.dto';
import { DeactivateProvider } from 'src/app/provider/application/usecases/deactivate-provider/deactivate-provider.service';
import { DeleteProvider } from 'src/app/provider/application/usecases/delete-provider/delete-provider.service';
import { EditProviderInputDto } from 'src/app/provider/application/usecases/edit-provider/dtos/edit-provider.dto';
import { EditProvider } from 'src/app/provider/application/usecases/edit-provider/edit-provider.service';
import { FindAllProviderQueryDto } from 'src/app/provider/application/usecases/find-all-provider/dtos/find-all-provider.dto';
import { FindAllProvider } from 'src/app/provider/application/usecases/find-all-provider/find-all-provider.service';
import { FindProviderById } from 'src/app/provider/application/usecases/find-provider-by-id/find-provider-by-id.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Swagger } from 'src/infra/openapi/swagger';
import { Params } from 'src/infra/validators/class/dtos/params';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';

@Controller('admin/provider')
@RequiredRoles(AccountRole.ADMIN)
export class ProviderAdminController {
  constructor(
    private readonly activateProvider: ActivateProvider,
    private readonly createProvider: CreateProvider,
    private readonly deactivateProvider: DeactivateProvider,
    private readonly deleteProvider: DeleteProvider,
    private readonly findAllProvider: FindAllProvider,
    private readonly findProviderById: FindProviderById,
    private readonly editProvider: EditProvider,
  ) {}

  @Post()
  @RequiredClaims(Claim.PROVIDER_WRITE)
  @Swagger({
    tags: ['Prestadores'],
    summary: 'Criar novo prestador',
    applyBadRequest: true,
    createdResponse: CreateProviderOutputDto,
  })
  public create(@Body() body: CreateProviderInputDto): Promise<CreateProviderOutputDto> {
    return this.createProvider.execute(body);
  }

  @Get()
  @RequiredClaims(Claim.PROVIDER_READ)
  @Swagger({
    tags: ['Prestadores'],
    summary: 'Listar prestadores com paginação e busca',
    applyBadRequest: true,
    okPaginatedResponse: ProviderDto,
  })
  public findAll(@Query() queries: FindAllProviderQueryDto): Promise<IPagination<ProviderDto>> {
    return this.findAllProvider.execute(queries);
  }

  @Get(':id')
  @RequiredClaims(Claim.PROVIDER_READ)
  @Swagger({
    tags: ['Prestadores'],
    summary: 'Buscar prestador por ID',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: ProviderDto,
  })
  public findOne(@Param() params: Params): Promise<ProviderDto> {
    return this.findProviderById.execute(params.id);
  }

  @Patch(':id/activate')
  @RequiredClaims(Claim.PROVIDER_WRITE)
  @Swagger({
    tags: ['Prestadores'],
    summary: 'Ativar prestador',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public activate(@Param() params: Params): Promise<SuccessMessage> {
    return this.activateProvider.execute(params.id);
  }

  @Patch(':id/deactivate')
  @RequiredClaims(Claim.PROVIDER_WRITE)
  @Swagger({
    tags: ['Prestadores'],
    summary: 'Desativar prestador',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public deactivate(@Param() params: Params): Promise<SuccessMessage> {
    return this.deactivateProvider.execute(params.id);
  }

  @Patch(':id')
  @RequiredClaims(Claim.PROVIDER_WRITE)
  @Swagger({
    tags: ['Prestadores'],
    summary: 'Editar prestador',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public update(@Param() params: Params, @Body() body: EditProviderInputDto): Promise<SuccessMessage> {
    return this.editProvider.execute(params.id, body);
  }

  @Delete(':id')
  @RequiredClaims(Claim.PROVIDER_WRITE)
  @Swagger({
    tags: ['Prestadores'],
    summary: 'Excluir prestador',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public remove(@Param() params: Params): Promise<SuccessMessage> {
    return this.deleteProvider.execute(params.id);
  }
}

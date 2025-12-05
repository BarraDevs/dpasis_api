import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { RequiredRoles } from 'src/app/authentication/infra/decorators/required-role.decorator';
import { ProviderDto } from 'src/app/provider/application/dtos/provider.dto';
import { CreateProvider } from 'src/app/provider/application/usecases/create-provider/create-provider.service';
import { CreateProviderInputDto, CreateProviderOutputDto } from 'src/app/provider/application/usecases/create-provider/dtos/create-provider.dto';
import { EditProviderInputDto } from 'src/app/provider/application/usecases/edit-provider/dtos/edit-provider.dto';
import { EditProvider } from 'src/app/provider/application/usecases/edit-provider/edit-provider.service';
import { FindAllProviderQueryDto } from 'src/app/provider/application/usecases/find-all-provider/dtos/find-all-provider.dto';
import { FindAllProvider } from 'src/app/provider/application/usecases/find-all-provider/find-all-provider.service';
import { FindProviderById } from 'src/app/provider/application/usecases/find-provider-by-id/find-provider-by-id.service';
import { UpdateProviderStatus } from 'src/app/provider/application/usecases/update-provider-status/update-provider-status.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Swagger } from 'src/infra/openapi/swagger';
import { Params } from 'src/infra/validators/class-*/dtos/params/params.dto';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';

@Controller('providers')
@RequiredRoles(AccountRole.ADMIN)
export class ProviderController {
  constructor(
    private readonly createProviderService: CreateProvider,
    private readonly findAllProviderService: FindAllProvider,
    private readonly findProviderByIdService: FindProviderById,
    private readonly editProviderService: EditProvider,
    private readonly updateProviderStatusService: UpdateProviderStatus,
  ) {}

  @Post()
  @Swagger({
    tags: ['Prestadores'],
    summary: 'Rota para criar um prestador',
    applyBadRequest: true,
    applyConflict: true,
    createdResponse: CreateProviderOutputDto,
  })
  public create(@Body() body: CreateProviderInputDto): Promise<CreateProviderOutputDto> {
    return this.createProviderService.execute(body);
  }

  @Get()
  @Swagger({
    tags: ['Prestadores'],
    summary: 'Rota para listar todos os prestadores',
    applyBadRequest: true,
    okPaginatedResponse: ProviderDto,
  })
  public findAll(@Query() queries: FindAllProviderQueryDto): Promise<IPagination<ProviderDto>> {
    return this.findAllProviderService.execute(queries);
  }

  @Get(':id')
  @Swagger({
    tags: ['Prestadores'],
    summary: 'Rota para buscar prestador por ID',
    applyBadRequest: true,
    okResponse: ProviderDto,
  })
  public findOne(@Param() params: Params): Promise<ProviderDto | null> {
    return this.findProviderByIdService.execute(params.id);
  }

  @Patch(':id')
  @Swagger({
    tags: ['Prestadores'],
    summary: 'Rota para editar prestador',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public update(@Param() params: Params, @Body() body: EditProviderInputDto): Promise<SuccessMessage> {
    return this.editProviderService.execute(params.id, body);
  }

  @Patch(':id/status')
  @Swagger({
    tags: ['Prestadores'],
    summary: 'Rota para ativar/desativar prestador',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public updateStatus(@Param() params: Params): Promise<SuccessMessage> {
    return this.updateProviderStatusService.execute(params.id);
  }
}

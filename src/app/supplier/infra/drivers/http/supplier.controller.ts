import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { RequiredRoles } from 'src/app/authentication/infra/decorators/required-role.decorator';
import { SupplierDto } from 'src/app/supplier/application/dtos/supplier.dto';
import { CreateSupplier } from 'src/app/supplier/application/usecases/create-supplier/create-supplier.service';
import { CreateSupplierInputDto, CreateSupplierOutputDto } from 'src/app/supplier/application/usecases/create-supplier/dtos/create-supplier.dto';
import { EditSupplierInputDto } from 'src/app/supplier/application/usecases/edit-supplier/dtos/edit-supplier.dto';
import { EditSupplier } from 'src/app/supplier/application/usecases/edit-supplier/edit-supplier.service';
import { FindAllSupplierQueryDto } from 'src/app/supplier/application/usecases/find-all-supplier/dtos/find-all-supplier.dto';
import { FindAllSupplier } from 'src/app/supplier/application/usecases/find-all-supplier/find-all-supplier.service';
import { FindSupplierById } from 'src/app/supplier/application/usecases/find-supplier-by-id/find-supplier-by-id.service';
import { UpdateSupplierStatus } from 'src/app/supplier/application/usecases/update-supplier-status/update-supplier-status.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Swagger } from 'src/infra/openapi/swagger';
import { Params } from 'src/infra/validators/class-*/dtos/params/params.dto';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';

@Controller('supplier')
@RequiredRoles(AccountRole.ADMIN)
export class SupplierController {
  constructor(
    private readonly createSupplierService: CreateSupplier,
    private readonly findAllSupplierService: FindAllSupplier,
    private readonly findSupplierByIdService: FindSupplierById,
    private readonly editSupplierService: EditSupplier,
    private readonly updateSupplierStatusService: UpdateSupplierStatus,
  ) {}

  @Post()
  @Swagger({
    tags: ['Fornecedores'],
    summary: 'Rota para criar um fornecedor',
    applyBadRequest: true,
    applyConflict: true,
    createdResponse: CreateSupplierOutputDto,
  })
  public create(@Body() body: CreateSupplierInputDto): Promise<CreateSupplierOutputDto> {
    return this.createSupplierService.execute(body);
  }

  @Get()
  @Swagger({
    tags: ['Fornecedores'],
    summary: 'Rota para listar todos os fornecedores',
    applyBadRequest: true,
    okPaginatedResponse: SupplierDto,
  })
  public findAll(@Query() queries: FindAllSupplierQueryDto): Promise<IPagination<SupplierDto>> {
    return this.findAllSupplierService.execute(queries);
  }

  @Get(':id')
  @Swagger({
    tags: ['Fornecedores'],
    summary: 'Rota para buscar fornecedor por ID',
    applyBadRequest: true,
    okResponse: SupplierDto,
  })
  public findOne(@Param() params: Params): Promise<SupplierDto | null> {
    return this.findSupplierByIdService.execute(params.id);
  }

  @Patch(':id')
  @Swagger({
    tags: ['Fornecedores'],
    summary: 'Rota para editar fornecedor',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public update(@Param() params: Params, @Body() body: EditSupplierInputDto): Promise<SuccessMessage> {
    return this.editSupplierService.execute(params.id, body);
  }

  @Patch(':id/status')
  @Swagger({
    tags: ['Fornecedores'],
    summary: 'Rota para ativar/desativar fornecedor',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public async updateStatus(@Param() params: Params): Promise<SuccessMessage> {
    return this.updateSupplierStatusService.execute(params.id);
  }
}

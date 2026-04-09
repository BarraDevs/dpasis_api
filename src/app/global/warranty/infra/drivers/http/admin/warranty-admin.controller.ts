import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { Claim } from 'src/app/authentication/domain/authorization/claim';
import { RequiredClaims } from 'src/app/authentication/infra/decorators/required-claims.decorator';
import { RequiredRoles } from 'src/app/authentication/infra/decorators/required-role.decorator';
import { WarrantyDto } from 'src/app/global/warranty/application/dtos/warranty.dto';
import { CreateWarranty } from 'src/app/global/warranty/application/usecases/create-warranty/create-warranty.service';
import { CreateWarrantyInputDto, CreateWarrantyOutputDto } from 'src/app/global/warranty/application/usecases/create-warranty/dtos/create-warranty.dto';
import { DeleteWarranty } from 'src/app/global/warranty/application/usecases/delete-warranty/delete-warranty.service';
import { EditWarrantyInputDto } from 'src/app/global/warranty/application/usecases/edit-warranty/dtos/edit-warranty.dto';
import { EditWarranty } from 'src/app/global/warranty/application/usecases/edit-warranty/edit-warranty.service';
import { FindAllWarrantyQueryDto } from 'src/app/global/warranty/application/usecases/find-all-warranty/dtos/find-all-warranty.dto';
import { FindAllWarranty } from 'src/app/global/warranty/application/usecases/find-all-warranty/find-all-warranty.service';
import { FindWarrantyById } from 'src/app/global/warranty/application/usecases/find-warranty-by-id/find-warranty-by-id.service';
import { UpdateWarrantyStatus } from 'src/app/global/warranty/application/usecases/update-warranty-status/update-warranty-status.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Swagger } from 'src/infra/openapi/swagger';
import { Params } from 'src/infra/validators/class/dtos/params/params.dto';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';

@Controller('admin/warranty')
@RequiredRoles(AccountRole.ADMIN)
export class WarrantyAdminController {
  constructor(
    private readonly createWarranty: CreateWarranty,
    private readonly findAllWarranty: FindAllWarranty,
    private readonly findWarrantyById: FindWarrantyById,
    private readonly editWarranty: EditWarranty,
    private readonly updateWarrantyStatus: UpdateWarrantyStatus,
    private readonly deleteWarranty: DeleteWarranty,
  ) {}

  @Post()
  @RequiredClaims(Claim.WARRANTY_WRITE)
  @Swagger({
    tags: ['Garantias'],
    summary: 'Criar garantia',
    applyBadRequest: true,
    createdResponse: CreateWarrantyOutputDto,
  })
  public create(@Body() body: CreateWarrantyInputDto): Promise<CreateWarrantyOutputDto> {
    return this.createWarranty.execute(body);
  }

  @Get()
  @RequiredClaims(Claim.WARRANTY_READ)
  @Swagger({
    tags: ['Garantias'],
    summary: 'Listar garantias com paginação e busca',
    applyBadRequest: true,
    okPaginatedResponse: WarrantyDto,
  })
  public findAll(@Query() queries: FindAllWarrantyQueryDto): Promise<IPagination<WarrantyDto>> {
    return this.findAllWarranty.execute(queries);
  }

  @Get(':id')
  @RequiredClaims(Claim.WARRANTY_READ)
  @Swagger({
    tags: ['Garantias'],
    summary: 'Buscar garantia por ID',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: WarrantyDto,
  })
  public findOne(@Param() params: Params): Promise<WarrantyDto> {
    return this.findWarrantyById.execute(params.id);
  }

  @Patch(':id/status')
  @RequiredClaims(Claim.WARRANTY_WRITE)
  @Swagger({
    tags: ['Garantias'],
    summary: 'Inverter status ativo da garantia',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public updateStatus(@Param() params: Params): Promise<SuccessMessage> {
    return this.updateWarrantyStatus.execute(params.id);
  }

  @Patch(':id')
  @RequiredClaims(Claim.WARRANTY_WRITE)
  @Swagger({
    tags: ['Garantias'],
    summary: 'Editar garantia',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public update(@Param() params: Params, @Body() body: EditWarrantyInputDto): Promise<SuccessMessage> {
    return this.editWarranty.execute(params.id, body);
  }

  @Delete(':id')
  @RequiredClaims(Claim.WARRANTY_WRITE)
  @Swagger({
    tags: ['Garantias'],
    summary: 'Deletar garantia',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public remove(@Param() params: Params): Promise<SuccessMessage> {
    return this.deleteWarranty.execute(params.id);
  }
}

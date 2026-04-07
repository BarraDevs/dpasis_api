import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { Claim } from 'src/app/authentication/domain/authorization/claim';
import { RequiredClaims } from 'src/app/authentication/infra/decorators/required-claims.decorator';
import { RequiredRoles } from 'src/app/authentication/infra/decorators/required-role.decorator';
import { ClientDiscountDto } from 'src/app/client/client-discount/application/dtos/client-discount.dto';
import { CreateClientDiscount } from 'src/app/client/client-discount/application/usecases/create-client-discount/create-client-discount.service';
import {
    CreateClientDiscountInputDto,
    CreateClientDiscountOutputDto,
} from 'src/app/client/client-discount/application/usecases/create-client-discount/dtos/create-client-discount.dto';
import { DeleteClientDiscount } from 'src/app/client/client-discount/application/usecases/delete-client-discount/delete-client-discount.service';
import { EditClientDiscountInputDto } from 'src/app/client/client-discount/application/usecases/edit-client-discount/dtos/edit-client-discount.dto';
import { EditClientDiscount } from 'src/app/client/client-discount/application/usecases/edit-client-discount/edit-client-discount.service';
import { FindAllClientDiscountQueryDto } from 'src/app/client/client-discount/application/usecases/find-all-client-discount/dtos/find-all-client-discount.dto';
import { FindAllClientDiscount } from 'src/app/client/client-discount/application/usecases/find-all-client-discount/find-all-client-discount.service';
import { FindClientDiscountById } from 'src/app/client/client-discount/application/usecases/find-client-discount-by-id/find-client-discount-by-id.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Swagger } from 'src/infra/openapi/swagger';
import { Params } from 'src/infra/validators/class/dtos/params/params.dto';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';

@Controller('admin/client-discount')
@RequiredRoles(AccountRole.ADMIN)
export class ClientDiscountAdminController {
  constructor(
    private readonly createClientDiscount: CreateClientDiscount,
    private readonly findAllClientDiscount: FindAllClientDiscount,
    private readonly findClientDiscountById: FindClientDiscountById,
    private readonly editClientDiscount: EditClientDiscount,
    private readonly deleteClientDiscount: DeleteClientDiscount,
  ) {}

  @Post()
  @RequiredClaims(Claim.CLIENT_DISCOUNT_WRITE)
  @Swagger({
    tags: ['Clientes - Descontos'],
    summary: 'Criar novo desconto',
    applyBadRequest: true,
    createdResponse: CreateClientDiscountOutputDto,
  })
  public create(@Body() body: CreateClientDiscountInputDto): Promise<CreateClientDiscountOutputDto> {
    return this.createClientDiscount.execute(body);
  }

  @Get()
  @RequiredClaims(Claim.CLIENT_DISCOUNT_READ)
  @Swagger({
    tags: ['Clientes - Descontos'],
    summary: 'Listar descontos com paginação e filtros',
    applyBadRequest: true,
    okPaginatedResponse: ClientDiscountDto,
  })
  public findAll(@Query() queries: FindAllClientDiscountQueryDto): Promise<IPagination<ClientDiscountDto>> {
    return this.findAllClientDiscount.execute(queries);
  }

  @Get(':id')
  @RequiredClaims(Claim.CLIENT_DISCOUNT_READ)
  @Swagger({
    tags: ['Clientes - Descontos'],
    summary: 'Buscar desconto por ID',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: ClientDiscountDto,
  })
  public findOne(@Param() params: Params): Promise<ClientDiscountDto> {
    return this.findClientDiscountById.execute(params.id);
  }

  @Patch(':id')
  @RequiredClaims(Claim.CLIENT_DISCOUNT_WRITE)
  @Swagger({
    tags: ['Clientes - Descontos'],
    summary: 'Editar desconto',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public update(@Param() params: Params, @Body() body: EditClientDiscountInputDto): Promise<SuccessMessage> {
    return this.editClientDiscount.execute(params.id, body);
  }

  @Delete(':id')
  @RequiredClaims(Claim.CLIENT_DISCOUNT_WRITE)
  @Swagger({
    tags: ['Clientes - Descontos'],
    summary: 'Excluir desconto',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public remove(@Param() params: Params): Promise<SuccessMessage> {
    return this.deleteClientDiscount.execute(params.id);
  }
}

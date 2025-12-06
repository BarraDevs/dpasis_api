import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { RequiredRoles } from 'src/app/authentication/infra/decorators/required-role.decorator';
import { SellerDto } from 'src/app/seller/application/dtos/seller.dto';
import { CreateSeller } from 'src/app/seller/application/usecases/create-seller/create-seller.service';
import { CreateSellerInputDto, CreateSellerOutputDto } from 'src/app/seller/application/usecases/create-seller/dtos/create-seller.dto';
import { EditSellerInputDto } from 'src/app/seller/application/usecases/edit-seller/dtos/edit-seller.dto';
import { EditSeller } from 'src/app/seller/application/usecases/edit-seller/edit-seller.service';
import { FindAllSellerQueryDto } from 'src/app/seller/application/usecases/find-all-seller/dtos/find-all-seller.dto';
import { FindAllSeller } from 'src/app/seller/application/usecases/find-all-seller/find-all-seller.service';
import { FindSellerById } from 'src/app/seller/application/usecases/find-seller-by-id/find-seller-by-id.service';
import { UpdateSellerStatus } from 'src/app/seller/application/usecases/update-seller-status/update-seller-status.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Swagger } from 'src/infra/openapi/swagger';
import { Params } from 'src/infra/validators/class-*/dtos/params/params.dto';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';

@Controller('sellers')
@RequiredRoles(AccountRole.ADMIN)
export class SellerController {
  constructor(
    private readonly createSellerService: CreateSeller,
    private readonly findAllSellerService: FindAllSeller,
    private readonly findSellerByIdService: FindSellerById,
    private readonly editSellerService: EditSeller,
    private readonly updateSellerStatusService: UpdateSellerStatus,
  ) {}

  @Post()
  @Swagger({
    tags: ['Vendedores'],
    summary: 'Rota para criar um vendedor',
    applyBadRequest: true,
    applyConflict: true,
    createdResponse: CreateSellerOutputDto,
  })
  public create(@Body() body: CreateSellerInputDto): Promise<CreateSellerOutputDto> {
    return this.createSellerService.execute(body);
  }

  @Get()
  @Swagger({
    tags: ['Vendedores'],
    summary: 'Rota para listar todos os vendedores',
    applyBadRequest: true,
    okPaginatedResponse: SellerDto,
  })
  public findAll(@Query() queries: FindAllSellerQueryDto): Promise<IPagination<SellerDto>> {
    return this.findAllSellerService.execute(queries);
  }

  @Get(':id')
  @Swagger({
    tags: ['Vendedores'],
    summary: 'Rota para buscar vendedor por ID',
    applyBadRequest: true,
    okResponse: SellerDto,
  })
  public findOne(@Param() params: Params): Promise<SellerDto | null> {
    return this.findSellerByIdService.execute(params.id);
  }

  @Patch(':id')
  @Swagger({
    tags: ['Vendedores'],
    summary: 'Rota para editar vendedor',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public update(@Param() params: Params, @Body() body: EditSellerInputDto): Promise<SuccessMessage> {
    return this.editSellerService.execute(params.id, body);
  }

  @Patch(':id/status')
  @Swagger({
    tags: ['Vendedores'],
    summary: 'Rota para ativar/desativar vendedor',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public updateStatus(@Param() params: Params): Promise<SuccessMessage> {
    return this.updateSellerStatusService.execute(params.id);
  }
}

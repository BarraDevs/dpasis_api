import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes } from '@nestjs/swagger';
import { AccountRole } from 'src/app/account/domain/enums/account-role.enum';
import { Claim } from 'src/app/authentication/domain/authorization/claim';
import { RequiredClaims } from 'src/app/authentication/infra/decorators/required-claims.decorator';
import { RequiredRoles } from 'src/app/authentication/infra/decorators/required-role.decorator';
import { SellerDto } from 'src/app/seller/application/dtos/seller.dto';
import { ActivateSeller } from 'src/app/seller/application/usecases/activate-seller/activate-seller.service';
import { CreateSeller } from 'src/app/seller/application/usecases/create-seller/create-seller.service';
import { CreateSellerInputDto, CreateSellerOutputDto } from 'src/app/seller/application/usecases/create-seller/dtos/create-seller.dto';
import { DeactivateSeller } from 'src/app/seller/application/usecases/deactivate-seller/deactivate-seller.service';
import { DeleteSeller } from 'src/app/seller/application/usecases/delete-seller/delete-seller.service';
import { EditSellerInputDto } from 'src/app/seller/application/usecases/edit-seller/dtos/edit-seller.dto';
import { EditSeller } from 'src/app/seller/application/usecases/edit-seller/edit-seller.service';
import { FindAllSellerQueryDto } from 'src/app/seller/application/usecases/find-all-seller/dtos/find-all-seller.dto';
import { FindAllSeller } from 'src/app/seller/application/usecases/find-all-seller/find-all-seller.service';
import { FindSellerById } from 'src/app/seller/application/usecases/find-seller-by-id/find-seller-by-id.service';
import { UploadSingleInputDto } from 'src/app/upload-file/application/usecases/upload-single/dtos/upload-single.dto';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Swagger } from 'src/infra/openapi/swagger';
import { Params } from 'src/infra/validators/class/dtos/params';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';

@Controller('admin/seller')
@RequiredRoles(AccountRole.ADMIN)
export class SellerAdminController {
  constructor(
    private readonly activateSeller: ActivateSeller,
    private readonly createSeller: CreateSeller,
    private readonly deactivateSeller: DeactivateSeller,
    private readonly deleteSeller: DeleteSeller,
    private readonly findAllSeller: FindAllSeller,
    private readonly findSellerById: FindSellerById,
    private readonly editSeller: EditSeller,
  ) {}

  @Post()
  @RequiredClaims(Claim.SELLER_WRITE)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @Swagger({
    tags: ['Vendedores'],
    summary: 'Criar novo vendedor',
    applyBadRequest: true,
    mergeRequestBody: [CreateSellerInputDto, UploadSingleInputDto],
    createdResponse: CreateSellerOutputDto,
  })
  public create(
    @Body() body: CreateSellerInputDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<CreateSellerOutputDto> {
    return this.createSeller.execute(body, file);
  }

  @Get()
  @RequiredClaims(Claim.SELLER_READ)
  @Swagger({
    tags: ['Vendedores'],
    summary: 'Listar vendedores com paginação e busca',
    applyBadRequest: true,
    okPaginatedResponse: SellerDto,
  })
  public findAll(@Query() queries: FindAllSellerQueryDto): Promise<IPagination<SellerDto>> {
    return this.findAllSeller.execute(queries);
  }

  @Get(':id')
  @RequiredClaims(Claim.SELLER_READ)
  @Swagger({
    tags: ['Vendedores'],
    summary: 'Buscar vendedor por ID',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SellerDto,
  })
  public findOne(@Param() params: Params): Promise<SellerDto> {
    return this.findSellerById.execute(params.id);
  }

  @Patch(':id/activate')
  @RequiredClaims(Claim.SELLER_WRITE)
  @Swagger({
    tags: ['Vendedores'],
    summary: 'Ativar vendedor',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public activate(@Param() params: Params): Promise<SuccessMessage> {
    return this.activateSeller.execute(params.id);
  }

  @Patch(':id/deactivate')
  @RequiredClaims(Claim.SELLER_WRITE)
  @Swagger({
    tags: ['Vendedores'],
    summary: 'Desativar vendedor',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public deactivate(@Param() params: Params): Promise<SuccessMessage> {
    return this.deactivateSeller.execute(params.id);
  }

  @Patch(':id')
  @RequiredClaims(Claim.SELLER_WRITE)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @Swagger({
    tags: ['Vendedores'],
    summary: 'Editar vendedor',
    applyBadRequest: true,
    applyNotFound: true,
    mergeRequestBody: [EditSellerInputDto, UploadSingleInputDto],
    okResponse: SuccessMessage,
  })
  public update(
    @Param() params: Params,
    @Body() body: EditSellerInputDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<SuccessMessage> {
    return this.editSeller.execute(params.id, body, file);
  }

  @Delete(':id')
  @RequiredClaims(Claim.SELLER_WRITE)
  @Swagger({
    tags: ['Vendedores'],
    summary: 'Excluir vendedor',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public remove(@Param() params: Params): Promise<SuccessMessage> {
    return this.deleteSeller.execute(params.id);
  }
}

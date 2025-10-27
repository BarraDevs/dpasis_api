import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AddressDto } from 'src/app/address/application/dtos/address.dto';
import { CreateAddress } from 'src/app/address/application/usecases/create-address/create-address.service';
import { CreateAddressInputDto, CreateAddressOutputDto } from 'src/app/address/application/usecases/create-address/dtos/create-address.dto';
import { DeleteAddress } from 'src/app/address/application/usecases/delete-address/delete-address.service';
import { EditAddressInputDto } from 'src/app/address/application/usecases/edit-address/dtos/edit-address.dto';
import { EditAddress } from 'src/app/address/application/usecases/edit-address/edit-address.service';
import { FindAddressById } from 'src/app/address/application/usecases/find-address-by-id/find-address-by-id.service';
import { FindAllAddressQueryDto } from 'src/app/address/application/usecases/find-all-address/dtos/find-all-address.dto';
import { FindAllAddress } from 'src/app/address/application/usecases/find-all-address/find-all-address.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Swagger } from 'src/infra/openapi/swagger';
import { Params } from 'src/infra/validators/class-*/dtos/params/params.dto';
import { IPagination } from 'src/shared/value-objects/pagination/pagination.vo';

@Controller('address/secondary')
export class AddressSecondaryController {
  private readonly IS_MAIN = false;

  constructor(
    private readonly createAddressService: CreateAddress,
    private readonly findAllAddressService: FindAllAddress,
    private readonly findAddressByIdService: FindAddressById,
    private readonly editAddressService: EditAddress,
    private readonly deleteAddressService: DeleteAddress,
  ) {}

  @Post()
  @Swagger({
    tags: ['Endereços secundários'],
    summary: 'Rota para criar um novo endereço secundário',
    applyBadRequest: true,
    createdResponse: CreateAddressOutputDto,
  })
  public create(@Body() body: CreateAddressInputDto): Promise<CreateAddressOutputDto> {
    return this.createAddressService.execute(body, this.IS_MAIN);
  }

  @Get()
  @Swagger({
    tags: ['Endereços secundários'],
    summary: 'Rota para listar todos os endereços secundários',
    applyBadRequest: true,
    okPaginatedResponse: AddressDto,
  })
  public findAll(@Query() queries: FindAllAddressQueryDto): Promise<IPagination<AddressDto>> {
    return this.findAllAddressService.execute({ ...queries, isMain: this.IS_MAIN });
  }

  @Get(':id')
  @Swagger({
    tags: ['Endereços secundários'],
    summary: 'Rota para buscar um endereço secundário por ID',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: AddressDto,
  })
  public findOne(@Param() params: Params): Promise<AddressDto> {
    return this.findAddressByIdService.execute(params.id, this.IS_MAIN);
  }

  @Patch(':id')
  @Swagger({
    tags: ['Endereços secundários'],
    summary: 'Rota para editar um endereço secundário',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public update(@Param() params: Params, @Body() body: EditAddressInputDto): Promise<SuccessMessage> {
    return this.editAddressService.execute(params.id, this.IS_MAIN, body);
  }

  @Delete(':id')
  @Swagger({
    tags: ['Endereços secundários'],
    summary: 'Rota para deletar um endereço secundário',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public remove(@Param() params: Params): Promise<SuccessMessage> {
    return this.deleteAddressService.execute(params.id);
  }
}

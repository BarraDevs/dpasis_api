import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { AddressDto } from 'src/app/address/application/dtos/address.dto';
import { CreateAddress } from 'src/app/address/application/usecases/create-address/create-address.service';
import { CreateAddressInputDto, CreateAddressOutputDto } from 'src/app/address/application/usecases/create-address/dtos/create-address.dto';
import { EditAddressInputDto } from 'src/app/address/application/usecases/edit-address/dtos/edit-address.dto';
import { EditAddress } from 'src/app/address/application/usecases/edit-address/edit-address.service';
import { FindMainAddress } from 'src/app/address/application/usecases/find-main-address/find-main-address.service';
import { SuccessMessage } from 'src/core/dtos/success-message.dto';
import { Swagger } from 'src/infra/openapi/swagger';
import { Params } from 'src/infra/validators/class-*/dtos/params/params.dto';

@Controller('address/main')
export class AddressMainController {
  private readonly IS_MAIN = true;

  constructor(
    private readonly createAddressService: CreateAddress,
    private readonly findMainAddressService: FindMainAddress,
    private readonly editAddressService: EditAddress,
  ) {}

  @Post()
  @Swagger({
    tags: ['Endereço principal'],
    summary: 'Rota para criar um novo endereço principal',
    applyBadRequest: true,
    createdResponse: CreateAddressOutputDto,
  })
  public create(@Body() body: CreateAddressInputDto): Promise<CreateAddressOutputDto> {
    return this.createAddressService.execute(body, this.IS_MAIN);
  }

  @Get(':id')
  @Swagger({
    tags: ['Endereço principal'],
    summary: 'Rota para buscar o endereço principal',
    description: 'O id informado deve ser o ownerId',
    applyBadRequest: true,
    okResponse: AddressDto,
  })
  public findOne(@Param() params: Params): Promise<AddressDto | null> {
    return this.findMainAddressService.execute(params.id);
  }

  @Patch(':id')
  @Swagger({
    tags: ['Endereço principal'],
    summary: 'Rota para editar o endereço principal',
    description: 'O id informado deve ser o id do endereço',
    applyBadRequest: true,
    applyNotFound: true,
    okResponse: SuccessMessage,
  })
  public update(@Param() params: Params, @Body() body: EditAddressInputDto): Promise<SuccessMessage> {
    return this.editAddressService.execute(params.id, this.IS_MAIN, body);
  }
}

import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { AddressModule } from 'src/app/address/address.module';
import { AddressNotFoundError } from 'src/app/address/domain/errors/address-not-found.error';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { CreateAddress } from '../create-address/create-address.service';
import { CreateAddressInputDto } from '../create-address/dtos/create-address.dto';
import { FindAddressById } from '../find-address-by-id/find-address-by-id.service';
import { EditAddressInputDto } from './dtos/edit-address.dto';
import { EditAddress } from './edit-address.service';

describe('EditAddress', () => {
  let sut: EditAddress;
  let prisma: PrismaService;
  let createAddress: CreateAddress;
  let findAddressById: FindAddressById;

  beforeEach(async() => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        AddressModule,
        ConfigModule,
      ],
    }).compile();

    sut = module.get(EditAddress);
    prisma = module.get(PrismaService);
    createAddress = module.get(CreateAddress);
    findAddressById = module.get(FindAddressById);

    await prisma.address.deleteMany();
  });

  afterAll(async() => {
    await prisma.address.deleteMany();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should throw an error if address not found', async() => {
    const data = createMock<EditAddressInputDto>();

    expect.assertions(1);
    return sut.execute('non-existing-id', true, data).catch((error) => {
      expect(error).toBeInstanceOf(AddressNotFoundError);
    });
  });

  it('should throw an error if main address not found', async() => {
    const secondaryAddress = await createAddress.execute({
      zipCode: '12345678',
      street: 'Rua Secundária',
      number: '456',
      neighborhood: 'Bairro Secundário',
      city: 'Cidade Secundária',
      state: 'Estado Secundário',
      ownerId: 'owner-123',
    }, false);

    const data = createMock<EditAddressInputDto>();

    expect.assertions(1);
    return sut.execute(secondaryAddress.id, true, data).catch((error) => {
      expect(error).toBeInstanceOf(AddressNotFoundError);
    });
  });

  it('should throw an error if secondary address not found', async() => {
    const mainAddress = await createAddress.execute({
      zipCode: '12345678',
      street: 'Rua Principal',
      number: '123',
      neighborhood: 'Bairro Principal',
      city: 'Cidade Principal',
      state: 'Estado Principal',
      ownerId: 'owner-123',
    }, true);

    const data = createMock<EditAddressInputDto>();

    expect.assertions(1);
    return sut.execute(mainAddress.id, false, data).catch((error) => {
      expect(error).toBeInstanceOf(AddressNotFoundError);
    });
  });

  it.each(
    [
      true,
      false,
    ]
  )('should edit address successfully (isMain=%s)', async(isMain: boolean) => {
    const data: CreateAddressInputDto = {
      zipCode: '12345678',
      street: 'Rua Principal',
      number: '123',
      neighborhood: 'Bairro Principal',
      city: 'Cidade Principal',
      state: 'Estado Principal',
      ownerId: 'owner-123',
    };

    const mainAddress = await createAddress.execute(data, isMain);

    const dataEdited: EditAddressInputDto = {
      zipCode: '87654321',
      street: 'Rua Editada',
      number: '321',
      neighborhood: 'Bairro Editado',
    };

    const result = await sut.execute(mainAddress.id, isMain, dataEdited);
    expect(result).toEqual({ message: 'Endereço atualizado com sucesso!' });

    const updatedAddress = await findAddressById.execute(mainAddress.id, isMain);
    expect(updatedAddress).toMatchObject({
      id: mainAddress.id,
      zipCode: dataEdited.zipCode,
      street: dataEdited.street,
      number: dataEdited.number,
      neighborhood: dataEdited.neighborhood,
      city: data.city,
      state: data.state,
      ownerId: data.ownerId,
      isMain,
    });
  });
});

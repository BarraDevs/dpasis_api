import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { AddressModule } from 'src/app/address/address.module';
import { AddressMainCannotBeDeletedError } from 'src/app/address/domain/errors/address-main-cannot-be-deleted.error';
import { AddressNotFoundError } from 'src/app/address/domain/errors/address-not-found.error';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { AddressDto } from '../../dtos/address.dto';
import { CreateAddress } from '../create-address/create-address.service';
import { DeleteAddress } from './delete-address.service';

describe('DeleteAddress', () => {
  let sut: DeleteAddress;
  let prisma: PrismaService;
  let createAddress: CreateAddress;

  beforeEach(async() => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        AddressModule,
        ConfigModule,
      ],
    }).compile();

    sut = module.get(DeleteAddress);
    prisma = module.get(PrismaService);
    createAddress = module.get(CreateAddress);

    await prisma.address.deleteMany();
  });

  afterAll(async() => {
    await prisma.address.deleteMany();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  it('should throw an error if address does not exist', async() => {
    expect.assertions(1);
    return sut.execute('non-existing-id').catch((error) => {
      expect(error).toBeInstanceOf(AddressNotFoundError);
    });
  });

  it('should throw an error if address is main', async() => {
    const mainAddress = createMock<AddressDto>({ isMain: true });
    jest.spyOn(sut['addressDao'], 'findById').mockResolvedValueOnce(mainAddress);

    expect.assertions(1);
    return sut.execute('main-address-id').catch((error) => {
      expect(error).toBeInstanceOf(AddressMainCannotBeDeletedError);
    });
  });

  it('should delete address successfully', async() => {
    const address = await createAddress.execute({
      zipCode: '12345-678',
      street: 'Rua A',
      number: '100',
      neighborhood: 'Bairro B',
      city: 'Cidade B',
      state: 'Estado C',
      ownerId: 'owner-123',
    }, false);

    const result = await sut.execute(address.id);
    expect(result).toEqual({ message: 'Endereço deletado com sucesso!' });

    const deletedAddress = await prisma.address.findUnique({ where: { id: address.id } });
    expect(deletedAddress).toBeNull();
  });
});

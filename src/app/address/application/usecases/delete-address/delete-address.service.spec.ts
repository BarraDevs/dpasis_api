import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { Owner } from '@prisma/client';
import { AddressModule } from 'src/app/address/address.module';
import { AddressMainCannotBeDeletedError } from 'src/app/address/domain/errors/address-main-cannot-be-deleted.error';
import { AddressNotFoundError } from 'src/app/address/domain/errors/address-not-found.error';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { AddressDto } from '../../dtos/address.dto';
import { CreateAddress } from '../create-address/create-address.service';
import { FindAddressById } from '../find-address-by-id/find-address-by-id.service';
import { DeleteAddress } from './delete-address.service';

describe('DeleteAddress', () => {
  let sut: DeleteAddress;
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

    sut = module.get(DeleteAddress);
    prisma = module.get(PrismaService);
    createAddress = module.get(CreateAddress);
    findAddressById = module.get(FindAddressById);

    await prisma.owner.deleteMany();
    await prisma.address.deleteMany();
  });

  afterEach(async() => {
    await prisma.owner.deleteMany();
    await prisma.address.deleteMany();
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(sut).toBeDefined();
  });

  describe('unit tests', () => {
    it('should throw an error if address is main', async() => {
      // Arrange
      const mainAddress = createMock<AddressDto>({ isMain: true });
      jest.spyOn(sut['addressDao'], 'findById').mockResolvedValueOnce(mainAddress);

      // Act & Assert
      expect.assertions(1);
      return sut.execute('main-address-id').catch((error) => {
        expect(error).toBeInstanceOf(AddressMainCannotBeDeletedError);
      });
    });

    it('should call addressDao with correct values', async() => {
      // Arrange
      const address = createMock<AddressDto>({ isMain: false });
      const findByIdSpy = jest.spyOn(sut['addressDao'], 'findById').mockResolvedValue(address);
      const deleteSpy = jest.spyOn(sut['addressDao'], 'delete').mockResolvedValue();

      // Act
      const result = await sut.execute(address.id);

      // Assert
      expect(findByIdSpy).toHaveBeenCalledWith(address.id, false);
      expect(deleteSpy).toHaveBeenCalledWith(address.id);
      expect(result).toEqual({ message: 'Endereço deletado com sucesso!' });
    });
  });

  describe('integration tests', () => {
    let owner01: Owner;

    beforeEach(async() => {
      owner01 = await prisma.owner.create({
        data: {
          id: 'owner-123',
          active: true,
        },
      });
    });

    it('should throw an error if address does not exist', async() => {
      // Act & Assert
      expect.assertions(1);
      return sut.execute('non-existing-id').catch((error) => {
        expect(error).toBeInstanceOf(AddressNotFoundError);
      });
    });

    it('should delete address successfully', async() => {
      // Arrange
      const address = await createAddress.execute({
        zipCode: '12345-678',
        street: 'Rua A',
        number: '100',
        neighborhood: 'Bairro B',
        city: 'Cidade B',
        state: 'Estado C',
        ownerId: owner01.id,
        nickname: null,
        complement: null,
        reference: null,
      }, false);

      // Act
      const result = await sut.execute(address.id);
      expect(result).toEqual({ message: 'Endereço deletado com sucesso!' });

      // Assert
      await expect(findAddressById.execute(address.id, false)).rejects.toThrow(AddressNotFoundError);
    });
  });
});

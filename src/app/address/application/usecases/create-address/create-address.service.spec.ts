import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { Owner } from '@prisma/client';
import { AddressModule } from 'src/app/address/address.module';
import { AddressMainMustBeOneError } from 'src/app/address/domain/errors/address-main-must-be-one.error';
import { OwnerNotActiveError } from 'src/app/owner/domain/errors/owner-not-active.error';
import { OwnerNotFoundError } from 'src/app/owner/domain/errors/owner-not-found.error';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { AddressDto } from '../../dtos/address.dto';
import { FindAddressById } from '../find-address-by-id/find-address-by-id.service';
import { CreateAddress } from './create-address.service';
import { CreateAddressInputDto } from './dtos/create-address.dto';

describe('CreateAddress', () => {
  let sut: CreateAddress;
  let prisma: PrismaService;
  let findAddressById: FindAddressById;

  beforeEach(async() => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        AddressModule,
        ConfigModule,
      ],
    }).compile();

    sut = module.get(CreateAddress);
    prisma = module.get(PrismaService);
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
    it('should call addressDao with correct values', async() => {
      // Arrange
      const input = createMock<CreateAddressInputDto>();
      const address = createMock<AddressDto>();
      const findMainAddressSpy = jest.spyOn(sut['addressDao'], 'findMainAddress').mockResolvedValue(null);
      const saveSpy = jest.spyOn(sut['addressDao'], 'save').mockResolvedValue(address.id);

      const owner = createMock<Owner>();
      jest.spyOn(sut['findOwnerById'], 'execute').mockResolvedValue(owner);

      // Act
      const result = await sut.execute(input, true);

      // Assert
      expect(findMainAddressSpy).toHaveBeenCalledWith(owner.id);
      expect(saveSpy).toHaveBeenCalledWith(input, true);
      expect(result).toEqual({ id: address.id });
    });
  });

  describe('integration tests', () => {
    let owner01: Owner;

    beforeEach(async() => {
      owner01 = await prisma.owner.create({
        data: {
          id: 'owner-1',
          active: true,
        },
      });
    });

    it('should throw an error if owner does not exist', async() => {
      // Arrange
      const data: CreateAddressInputDto = {
        zipCode: '12345-678',
        street: 'Main St',
        number: '123',
        neighborhood: 'Downtown',
        city: 'Metropolis',
        state: 'State',
        ownerId: 'non-existent-owner',
        nickname: null,
        complement: null,
        reference: null,
      };

      // Act & Assert
      expect.assertions(1);
      return sut.execute(data, false).catch((error) => {
        expect(error).toBeInstanceOf(OwnerNotFoundError);
      });
    });

    it('should throw an error if owner is not active', async() => {
      // Arrange
      await prisma.owner.update({
        where: { id: owner01.id },
        data: { active: false },
      });

      const data: CreateAddressInputDto = {
        zipCode: '12345-678',
        street: 'Main St',
        number: '123',
        neighborhood: 'Downtown',
        city: 'Metropolis',
        state: 'State',
        ownerId: owner01.id,
        nickname: 'Home',
        complement: 'Apt 4',
        reference: null,
      };

      // Act & Assert
      expect.assertions(1);
      return sut.execute(data, false).catch((error) => {
        expect(error).toBeInstanceOf(OwnerNotActiveError);
      });
    });

    it('should create a main address', async() => {
      // Arrange
      const data: CreateAddressInputDto = {
        zipCode: '12345-678',
        street: 'Main St',
        number: '123',
        complement: 'Apt 4',
        neighborhood: 'Downtown',
        city: 'Metropolis',
        state: 'State',
        ownerId: owner01.id,
        nickname: 'Home',
        reference: null,
      };

      // Act
      const result = await sut.execute(data, true);

      // Assert
      const createdAddress = await findAddressById.execute(result.id, true);
      expect(createdAddress).toBeDefined();
      expect(createdAddress).toEqual<AddressDto>({
        id: result.id,
        nickname: data.nickname || null,
        zipCode: data.zipCode,
        street: data.street,
        number: data.number,
        complement: data.complement || null,
        reference: data.reference || null,
        neighborhood: data.neighborhood,
        city: data.city,
        state: data.state,
        ownerId: data.ownerId,
        isMain: true,
        createdAt: createdAddress!.createdAt,
        updatedAt: createdAddress!.updatedAt,
      });
    });

    it('should not create a second main address for the same owner', async() => {
      // Arrange
      const data: CreateAddressInputDto = {
        zipCode: '12345-678',
        street: 'Main St',
        number: '123',
        neighborhood: 'Downtown',
        city: 'Metropolis',
        state: 'State',
        ownerId: owner01.id,
        nickname: null,
        complement: null,
        reference: null,
      };
      await sut.execute(data, true);

      // Act & Assert
      expect.assertions(1);
      return sut.execute(data, true).catch((error) => {
        expect(error).toBeInstanceOf(AddressMainMustBeOneError);
      });
    });

    it('should create a non-main address', async() => {
      // Arrange
      const data: CreateAddressInputDto = {
        zipCode: '98765-432',
        street: 'Second St',
        number: '456',
        neighborhood: 'Uptown',
        city: 'Gotham',
        state: 'State',
        ownerId: owner01.id,
        nickname: null,
        complement: null,
        reference: null,
      };

      // Act
      const result = await sut.execute(data, false);

      // Assert
      const createdAddress = await findAddressById.execute(result.id, false);
      expect(createdAddress).toBeDefined();
      expect(createdAddress).toEqual<AddressDto>({
        id: result.id,
        nickname: data.nickname || null,
        zipCode: data.zipCode,
        street: data.street,
        number: data.number,
        complement: data.complement || null,
        reference: data.reference || null,
        neighborhood: data.neighborhood,
        city: data.city,
        state: data.state,
        ownerId: data.ownerId,
        isMain: false,
        createdAt: createdAddress!.createdAt,
        updatedAt: createdAddress!.updatedAt,
      });
    });
  });
});

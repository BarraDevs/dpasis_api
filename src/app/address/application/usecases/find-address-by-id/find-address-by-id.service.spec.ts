import { createMock } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { AddressModule } from 'src/app/address/address.module';
import { AddressNotFoundError } from 'src/app/address/domain/errors/address-not-found.error';
import { ConfigModule } from 'src/core/config/config.module';
import { PrismaService } from 'src/infra/database/prisma/prisma.service';
import { AddressDto } from '../../dtos/address.dto';
import { CreateAddress } from '../create-address/create-address.service';
import { CreateAddressInputDto } from '../create-address/dtos/create-address.dto';
import { FindAddressById } from './find-address-by-id.service';

describe('FindAddressById', () => {
  let sut: FindAddressById;
  let prisma: PrismaService;
  let createAddress: CreateAddress;

  beforeEach(async() => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        AddressModule,
        ConfigModule,
      ],
    }).compile();

    sut = module.get(FindAddressById);
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

  describe('unit tests', () => {
    it('should call addressDao.findById with correct values', async() => {
      // Arrange
      const address = createMock<AddressDto>();
      const findByIdSpy = jest.spyOn(sut['addressDao'], 'findById').mockResolvedValue(address);

      // Act
      const id = 'address-id-123';
      const isMain = true;
      await sut.execute(id, isMain);

      // Assert
      expect(findByIdSpy).toHaveBeenCalledWith(id, isMain);
    });
  });

  describe('integration tests', () => {
    it.each(
      [
        true,
        false,
      ]
    )('should throw an error if address not found', async(isMain: boolean) => {
      // Act & Assert
      expect.assertions(1);
      return sut.execute('non-existing-id', isMain).catch((error) => {
        expect(error).toBeInstanceOf(AddressNotFoundError);
      });
    });

    it.each(
      [
        true,
        false,
      ]
    )('should return address if found', async(isMain: boolean) => {
      // Arrange
      const data: CreateAddressInputDto = {
        nickname: 'Home',
        street: '123 Main St',
        number: 'Apt 4B',
        complement: 'Near the park',
        reference: 'Blue door',
        neighborhood: 'Downtown',
        city: 'Anytown',
        state: 'CA',
        zipCode: '12345',
        ownerId: 'owner-123',
      };
      const createdAddress = await createAddress.execute(data, isMain);

      // Act
      const address = await sut.execute(createdAddress.id, isMain);

      // Assert
      expect(address).toBeDefined();
      expect(address).toEqual<AddressDto>({
        id: createdAddress.id,
        nickname: data.nickname || null,
        street: data.street,
        number: data.number,
        complement: data.complement || null,
        reference: data.reference || null,
        neighborhood: data.neighborhood,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        isMain,
        ownerId: data.ownerId,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });
  });
});
